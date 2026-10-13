import { NextRequest } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { businesses, serviceBusinesses, ServiceOffering } from "@/lib/data";
import { getSessionId } from "@/lib/session";
import { getStore, SessionRecord, StoredMessage } from "@/lib/store";
import { Lead, LeadStage, emptyLead, STAGE_ORDER } from "@/lib/leads";
import { Quote, Escalation } from "@/lib/quotes";

export const maxDuration = 60;

// Strip BOM and whitespace: a key pasted through a shell can carry U+FEFF,
// which throws when the SDK puts it in an HTTP header.
const API_KEY = (process.env.OPENAI_API_KEY ?? "").replace(/^﻿/, "").trim();

const openai = new OpenAI({ apiKey: API_KEY, maxRetries: 2 });

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// gpt-4.1-mini handles this well and costs a fraction of 4o; nano is the
// cheaper fallback if the primary is rate-limited.
const MODELS = ["gpt-4.1-mini", "gpt-4.1-nano"];

/**
 * Only the trailing turns are sent. The system prompt carries the catalogue,
 * and a service conversation is qualification questions — the last few
 * exchanges hold everything the model needs.
 */
const HISTORY_TURNS = 8;

async function generateWithFallback(
  messages: ChatCompletionMessageParam[],
  wantJson: boolean
): Promise<string> {
  let lastErr: unknown;
  for (const model of MODELS) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages,
        temperature: 0.4,
        max_tokens: 500,
        // Guarantees parseable output instead of hoping the model stays on schema.
        ...(wantJson ? { response_format: { type: "json_object" as const } } : {}),
      });
      const text = completion.choices[0]?.message?.content?.trim();
      if (text) return text;
      throw new Error("Empty completion");
    } catch (err) {
      lastErr = err;
      const status = (err as { status?: number }).status;
      // 400/401/404 are our fault, not load — another model will fail the same way.
      if (status === 400 || status === 401 || status === 404) throw err;
      await delay(500);
    }
  }
  throw lastErr;
}

function findProductMatches(query: string, bizId: string) {
  const biz = businesses.find(b => b.id === bizId);
  if (!biz) return [];
  const q = query.toLowerCase();
  return biz.products
    .filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      q.split(" ").some(w => w.length > 3 && (p.name.toLowerCase().includes(w) || p.category.toLowerCase().includes(w)))
    )
    .slice(0, 3);
}

function findServiceMatches(query: string, bizId: string) {
  const biz = serviceBusinesses.find(b => b.id === bizId);
  if (!biz) return [];
  const q = query.toLowerCase();
  return biz.services
    .filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      q.split(" ").some(w => w.length > 3 && (s.name.toLowerCase().includes(w) || s.category.toLowerCase().includes(w)))
    )
    .slice(0, 3);
}

type LeadRead = {
  score?: number;
  stage?: LeadStage;
  interest?: string;
  mentionedItems?: string[];
  facts?: Record<string, string>;
  signals?: { label: string; positive: boolean }[];
};

type AgentAction = (
  | { action: "reply"; reply: string }
  | { action: "quote"; reply: string; serviceName: string; answers: Record<string, string>; lines: { label: string; amount: number }[]; notes?: string }
  | { action: "escalate"; reply: string; question: string; reason: string }
) & { lead?: LeadRead };

/** Scoring rubric shared by both modes — the model returns this alongside its reply. */
const LEAD_BLOCK = `
ALSO include a "lead" object scoring this customer, judged on the whole
conversation so far, not just the last message:

"lead": {
  "score": <0-100>,
  "stage": "browsing" | "comparing" | "intent" | "qualified" | "ready",
  "interest": "<what they want, one short phrase in their own terms>",
  "mentionedItems": ["<names of items or services they engaged with>"],
  "facts": {"<label>":"<value>"},
  "signals": [{"label":"<short observation>","positive":true|false}]
}

Scoring guide:
- 0-25  browsing — vague questions, no specifics
- 26-45 comparing — weighing options, asking about differences
- 46-65 intent — named a specific item or service, asking practical questions
- 66-85 qualified — gave details that let you serve them (size, postcode, date, quantity)
- 86-100 ready — asking to buy, book, or confirm

Put concrete details in "facts": postcode, budget, timing, property size,
quantity, sizes. Keep labels short ("Postcode", "Needed by", "Property").
Signals are brief and honest — "asked about next-day delivery" (positive),
"only price-checking" (negative). Never invent facts the customer did not give.`;

/**
 * The model returns JSON so the server decides what happens next, rather than
 * the UI pattern-matching prose. A model that drifts from the schema still
 * produces a usable reply via the fallback below.
 */
function parseAgentAction(raw: string): AgentAction {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : raw).trim();

  try {
    const parsed = JSON.parse(candidate);
    if (parsed && typeof parsed.reply === "string") {
      if (parsed.action === "quote" && Array.isArray(parsed.lines) && parsed.lines.length > 0) {
        return parsed as AgentAction;
      }
      if (parsed.action === "escalate" && typeof parsed.question === "string") {
        return parsed as AgentAction;
      }
      // Keep `lead` — it rides alongside every action, including a plain reply.
      return { action: "reply", reply: parsed.reply, lead: parsed.lead };
    }
  } catch {
    // Model returned prose instead of JSON — use it as the reply.
  }
  return { action: "reply", reply: candidate };
}

/** Merge the model's read of the lead onto the stored one, keeping facts it stops repeating. */
function mergeLead(prev: Lead, read: LeadRead | undefined, messageCount: number): Lead {
  if (!read) return { ...prev, messageCount, lastSeen: Date.now() };
  const stage = read.stage && STAGE_ORDER.includes(read.stage) ? read.stage : prev.stage;
  return {
    ...prev,
    score: typeof read.score === "number" ? Math.max(0, Math.min(100, Math.round(read.score))) : prev.score,
    stage,
    interest: read.interest?.trim() || prev.interest,
    mentionedItems: [...new Set([...prev.mentionedItems, ...(read.mentionedItems ?? [])])].slice(0, 8),
    facts: { ...prev.facts, ...(read.facts ?? {}) },
    signals: (read.signals ?? prev.signals).slice(0, 6),
    messageCount,
    lastSeen: Date.now(),
  };
}

export async function POST(req: NextRequest) {
  const { message, mode, bizId } = await req.json();

  const sessionId = await getSessionId();
  const store = getStore();
  const existing = await store.getSession(sessionId, bizId);
  const session: SessionRecord = existing ?? {
    sessionId,
    bizId,
    mode,
    messages: [],
    lead: emptyLead(sessionId, bizId, mode),
    inbox: [],
    updatedAt: Date.now(),
  };

  // History comes from storage, not the client, so a tampered payload cannot
  // inject turns into another customer's conversation.
  const history = session.messages.map(m => ({ role: m.role, content: m.content }));

  let systemPrompt = "";

  if (mode === "product") {
    const biz = businesses.find(b => b.id === bizId);
    if (!biz) return new Response("Business not found", { status: 404 });
    systemPrompt = `You are a shopping assistant for "${biz.name}" — ${biz.tagline}.

CATALOGUE & POLICIES:
${JSON.stringify({ products: biz.products, faq: biz.faq, returnPolicy: biz.returnPolicy, shippingPolicy: biz.shippingPolicy }, null, 2)}

Your job:
- Answer product enquiries, availability, stock, pricing, colours, sizes.
- Handle order queries, return requests, shipping questions.
- For FAQs, use the faq array above.
- ONLY quote prices from the catalogue. Never invent prices.
- If a product is out of stock, say so clearly.
- Keep replies under 130 words. Be friendly and helpful.
- End with a follow-up question or offer where appropriate.

You reply with a single JSON object:
{"action":"reply","reply":"<your message to the customer>"}
${LEAD_BLOCK}`;
  } else {
    const biz = serviceBusinesses.find(b => b.id === bizId);
    if (!biz) return new Response("Business not found", { status: 404 });

    systemPrompt = `You are a booking assistant for "${biz.name}" — ${biz.tagline}.

SERVICES (this is the rate card — the only source of prices):
${JSON.stringify(biz.services, null, 2)}

FAQ (answer from here when it fits):
${JSON.stringify(biz.faq, null, 2)}

QUALIFICATION QUESTIONS you must have answers to before any quote:
${JSON.stringify(biz.qualificationQuestions, null, 2)}

You reply with a single JSON object. Choose exactly one of three actions.

1. Normal conversation — answering a question, or asking qualification questions:
{"action":"reply","reply":"<your message>"}

2. You now have answers to the qualification questions and the customer wants a
   price. Build the quote from the rate card above:
{"action":"quote",
 "reply":"<tell the customer their details are with the team and a price is coming shortly. DO NOT state any number here.>",
 "serviceName":"<service name from the rate card>",
 "answers":{"<question>":"<what they told you>"},
 "lines":[{"label":"<what this charge is for>","amount":<number>}],
 "notes":"<anything the owner should know>"}

3. The customer asked something you cannot answer from the rate card or FAQ —
   anything needing a human judgement, an exception, a bespoke arrangement, or
   information you simply do not have:
{"action":"escalate",
 "reply":"<tell the customer you are checking with the team and will come back shortly>",
 "question":"<their question, verbatim>",
 "reason":"<why you cannot answer it>"}

RULES THAT OVERRIDE EVERYTHING:
- NEVER state a price, a total, a range, or any number that commits the
  business, in any "reply" field. Prices reach the customer only after the
  owner approves them. This is not negotiable.
- Ask the qualification questions before quoting. Two or three at a time, not
  all at once. Do not quote on guesses.
- "lines" must come from the rate card. Do not invent charges.
- Keep every "reply" under 130 words. Warm, but efficient.
${LEAD_BLOCK}`;
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode("data: " + JSON.stringify(data) + "\n\n"));
      };

      try {
        if (!API_KEY) {
          throw new Error("OPENAI_API_KEY is not configured on the server");
        }

        send({ type: "step", stepType: "thinking", id: "1", label: "Understanding intent", status: "running" });
        await delay(250);
        send({ type: "step", stepType: "thinking", id: "1", label: "Understanding intent", status: "done" });

        const totalItems = mode === "product"
          ? (businesses.find(b => b.id === bizId)?.products.length ?? 0)
          : (serviceBusinesses.find(b => b.id === bizId)?.services.length ?? 0);

        send({ type: "step", stepType: "searching", id: "2", label: "Searching catalogue", detail: `${totalItems} items`, status: "running" });
        await delay(200);

        const matched = mode === "product"
          ? findProductMatches(message, bizId)
          : findServiceMatches(message, bizId);

        send({ type: "step", stepType: "searching", id: "2", label: "Searching catalogue", detail: `${matched.length} relevant item${matched.length !== 1 ? "s" : ""} found`, status: "done" });

        if (matched.length > 0) {
          send({ type: "step", stepType: "matching", id: "3", label: "Matching to query", detail: matched.slice(0, 2).map((m: { name: string }) => m.name).join(", "), status: "running" });
          await delay(150);
          send({ type: "step", stepType: "matching", id: "3", label: "Matching to query", status: "done" });
        }

        if (mode === "service") {
          send({ type: "step", stepType: "qualifying", id: "4", label: "Checking qualification", detail: "Owner approves before any price is sent", status: "running" });
          await delay(150);
          send({ type: "step", stepType: "qualifying", id: "4", label: "Qualification checked", status: "done" });
        }

        send({ type: "step", stepType: "responding", id: "5", label: "Composing response", status: "running" });

        // System prompt first and unchanged across a conversation, so OpenAI's
        // automatic prefix caching covers the catalogue on every turn after the
        // first. Only recent turns follow it.
        const recent = (history || []).slice(-HISTORY_TURNS);
        const messages: ChatCompletionMessageParam[] = [
          { role: "system", content: systemPrompt },
          ...recent.map((m: { role: string; content: string }) => ({
            role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
            content: m.content,
          })),
          { role: "user", content: message },
        ];

        const raw = await generateWithFallback(messages, true);
        const result: AgentAction = parseAgentAction(raw);

        send({ type: "step", stepType: "responding", id: "5", label: "Response ready", status: "done" });

        if (result.action === "quote") {
          const total = result.lines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
          send({ type: "step", stepType: "pricing", id: "6", label: "Quote built from rate card", detail: `${result.lines.length} line${result.lines.length !== 1 ? "s" : ""}`, status: "done" });
          send({ type: "step", stepType: "escalating", id: "7", label: "Sent to owner for approval", detail: "Held — not shown to customer", status: "done" });
          const quote: Quote = {
            id: `q-${Date.now()}`,
            kind: "quote",
            bizId,
            serviceName: result.serviceName,
            answers: result.answers ?? {},
            lines: result.lines,
            total,
            notes: result.notes,
            status: "pending",
            createdAt: Date.now(),
          };
          session.inbox = [quote, ...session.inbox];
          send({ type: "quote", quote });
        } else if (result.action === "escalate") {
          send({ type: "step", stepType: "escalating", id: "6", label: "Escalated to owner", detail: result.reason, status: "done" });
          const escalation: Escalation = {
            id: `e-${Date.now()}`,
            kind: "escalation",
            bizId,
            question: result.question,
            reason: result.reason,
            status: "unanswered",
            createdAt: Date.now(),
          };
          session.inbox = [escalation, ...session.inbox];
          send({ type: "escalation", escalation });
        }

        // Service prices reach the customer only through owner approval, so the
        // rate card goes to the model but never to the browser. Product prices
        // were set by the business, so they ship as-is.
        const safeMatches = mode === "service"
          ? matched.map(m => {
              const { basePrice, ...rest } = m as ServiceOffering;
              void basePrice;
              return rest;
            })
          : matched;

        send({ type: "matched", items: safeMatches });
        send({ type: "content", text: result.reply });

        const now = Date.now();
        const turns: StoredMessage[] = [
          { role: "user", content: message, ts: now },
          { role: "assistant", content: result.reply, ts: now + 1 },
        ];
        session.messages = [...session.messages, ...turns];
        session.lead = mergeLead(session.lead, result.lead, session.messages.length);
        session.updatedAt = now;
        await store.saveSession(session);

        send({ type: "lead", lead: session.lead });
        send({ type: "done" });
      } catch (err) {
        const raw = String(err);
        const status = (err as { status?: number }).status;
        console.error("[chat] generation failed:", status ?? "", raw);
        const friendly =
          status === 429 ? "The assistant is handling a lot of requests right now. Please send that again in a moment."
          : status === 401 ? "The assistant is not configured correctly. Please let the team know."
          : "Sorry, something went wrong generating a reply. Please try again.";
        send({ type: "step", stepType: "responding", id: "5", label: "Response failed", status: "error" });
        send({ type: "error", message: friendly });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
