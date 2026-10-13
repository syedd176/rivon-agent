import { NextRequest } from "next/server";
import { getSessionId } from "@/lib/session";
import { getStore } from "@/lib/store";

export const maxDuration = 300;

const POLL_MS = 2000;
/** Below Vercel's function ceiling, so the stream closes cleanly and the client reconnects. */
const MAX_LIFETIME_MS = 270_000;
const HEARTBEAT_MS = 25_000;

/**
 * Live owner feed. Serverless instances share no memory, so this watches the
 * database rather than an in-process event bus: a cheap watermark query every
 * couple of seconds, and a full payload sent only when something actually
 * changed. EventSource reconnects on its own when the stream ends.
 */
export async function GET(req: NextRequest) {
  const bizId = req.nextUrl.searchParams.get("bizId");
  if (!bizId) return new Response("bizId required", { status: 400 });

  const viewerSessionId = await getSessionId();
  const store = getStore();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const started = Date.now();
      let lastMark = "";
      let lastBeat = Date.now();

      const send = (data: object) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode("data: " + JSON.stringify(data) + "\n\n"));
        } catch {
          closed = true;
        }
      };

      const close = () => {
        if (closed) return;
        closed = true;
        try { controller.close(); } catch { /* already closed */ }
      };

      req.signal.addEventListener("abort", close);

      const pushSnapshot = async () => {
        const sessions = await store.listSessions(bizId);
        const mine = sessions.find(s => s.sessionId === viewerSessionId);
        send({
          type: "snapshot",
          viewerSessionId,
          leads: sessions.map(s => s.lead),
          inbox: sessions.flatMap(s => s.inbox.map(i => ({ ...i, sessionId: s.sessionId }))),
          // Lets a customer's own tab pick up an owner reply without reloading.
          myMessages: mine?.messages ?? [],
        });
      };

      try {
        lastMark = await store.watermark(bizId);
        await pushSnapshot();

        while (!closed) {
          if (req.signal.aborted || Date.now() - started > MAX_LIFETIME_MS) break;
          await delay(POLL_MS);
          if (closed || req.signal.aborted) break;

          try {
            const mark = await store.watermark(bizId);
            if (mark !== lastMark) {
              lastMark = mark;
              await pushSnapshot();
              lastBeat = Date.now();
            } else if (Date.now() - lastBeat > HEARTBEAT_MS) {
              // Keeps proxies from dropping an idle connection.
              send({ type: "ping" });
              lastBeat = Date.now();
            }
          } catch (err) {
            console.error("[live] poll failed:", String(err));
          }
        }
      } finally {
        close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
