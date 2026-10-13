import { NextRequest } from "next/server";
import { getSessionId } from "@/lib/session";
import { getStore } from "@/lib/store";
import { emptyLead } from "@/lib/leads";

export const maxDuration = 30;

/**
 * Restores this browser's conversation, and lists every session for the
 * business so the owner sidebar can show all leads, not just this one.
 */
export async function GET(req: NextRequest) {
  const bizId = req.nextUrl.searchParams.get("bizId");
  const mode = (req.nextUrl.searchParams.get("mode") ?? "product") as "product" | "service";
  if (!bizId) return Response.json({ error: "bizId required" }, { status: 400 });

  const sessionId = await getSessionId();
  const store = getStore();

  const [mine, all] = await Promise.all([
    store.getSession(sessionId, bizId),
    store.listSessions(bizId),
  ]);

  return Response.json({
    sessionId,
    messages: mine?.messages ?? [],
    lead: mine?.lead ?? emptyLead(sessionId, bizId, mode),
    inbox: mine?.inbox ?? [],
    // Every lead for this business. The owner watches these; the customer pane
    // never reads them.
    leads: all.map(s => s.lead),
    allInbox: all.flatMap(s => s.inbox.map(i => ({ ...i, sessionId: s.sessionId }))),
  });
}

/** Owner actions: approving a quote or answering an escalation. */
export async function POST(req: NextRequest) {
  const { bizId, targetSessionId, itemId, action, finalTotal, reply } = await req.json();
  if (!bizId || !targetSessionId || !itemId) {
    return Response.json({ error: "bizId, targetSessionId and itemId required" }, { status: 400 });
  }

  const store = getStore();
  const session = await store.getSession(targetSessionId, bizId);
  if (!session) return Response.json({ error: "session not found" }, { status: 404 });

  let customerMessage: string | null = null;

  session.inbox = session.inbox.map(item => {
    if (item.id !== itemId) return item;

    if (item.kind === "quote") {
      if (action === "approve") {
        const total = typeof finalTotal === "number" ? finalTotal : item.total;
        const changed = total !== item.total;
        customerMessage = `Thanks for waiting. For ${item.serviceName.toLowerCase()}, that comes to £${total.toFixed(2)}. Would you like to go ahead and book it in?`;
        return {
          ...item,
          originalTotal: changed ? item.total : item.originalTotal,
          total,
          status: "approved" as const,
          resolvedAt: Date.now(),
        };
      }
      if (action === "reject") {
        customerMessage = "Thanks for your patience. We need to look at this one more closely before quoting — someone from the team will come back to you shortly.";
        return { ...item, status: "rejected" as const, resolvedAt: Date.now() };
      }
    }

    if (item.kind === "escalation" && action === "answer" && typeof reply === "string") {
      customerMessage = reply;
      return { ...item, ownerReply: reply, status: "answered" as const, resolvedAt: Date.now() };
    }

    return item;
  });

  if (customerMessage) {
    session.messages = [
      ...session.messages,
      { role: "assistant", content: customerMessage, ownerApproved: true, ts: Date.now() },
    ];
  }

  session.updatedAt = Date.now();
  await store.saveSession(session);

  return Response.json({ ok: true, inbox: session.inbox, customerMessage });
}
