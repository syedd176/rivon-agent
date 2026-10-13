import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { businesses, serviceBusinesses, ServiceOffering } from "@/lib/data";

export const maxDuration = 60;

// Strip BOM and whitespace: a key pasted through a shell can carry U+FEFF,
// which throws when the SDK puts it in an HTTP header.
const API_KEY = (process.env.GEMINI_API_KEY ?? "").replace(/^﻿/, "").trim();

const genAI = new GoogleGenerativeAI(API_KEY);

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

const MODELS = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-2.5-flash"];

type GeminiTurn = { role: string; parts: { text: string }[] };

// Gemini flash models return 503 under load; try each model, with one retry per model.
async function generateWithFallback(history: GeminiTurn[], message: string): Promise<string> {
  let lastErr: unknown;
  for (const modelName of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const session = model.startChat({ history });
        const result = await session.sendMessage(message);
        return result.response.text();
      } catch (err) {
        lastErr = err;
        const msg = String(err);
        if (msg.includes("404") || msg.includes("no longer available")) break;
        if (attempt === 0) await delay(700);
      }
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

type AgentAction =
  | { action: "reply"; reply: string }
  | { action: "quote"; reply: string; serviceName: string; answers: Record<string, string>; lines: { label: string; amount: number }[]; notes?: string }
  | { action: "escalate"; reply: string; question: string; reason: string };

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
      return { action: "reply", reply: parsed.reply };
    }
  } catch {
    // Model returned prose instead of JSON — use it as the reply.
  }
  return { action: "reply", reply: candidate };
}

export async function POST(req: NextRequest) {
  const { history, message, mode, bizId } = await req.json();

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
- End with a follow-up question or offer where appropriate.`;
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

You reply ONLY with a JSON object. No prose outside it, no markdown fences.
Choose exactly one of three actions.

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
- Keep every "reply" under 130 words. Warm, but efficient.`;
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode("data: " + JSON.stringify(data) + "\n\n"));
      };

      try {
        if (!API_KEY) {
          throw new Error("GEMINI_API_KEY is not configured on the server");
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

        const geminiHistory = [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: mode === "service" ? '{"action":"reply","reply":"Understood. I will reply only in JSON."}' : "Understood. I'm ready to help customers." }] },
          ...(history || []).map((m: { role: string; content: string }) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
        ];

        const raw = await generateWithFallback(geminiHistory, message);

        // Product mode is plain prose; only service mode uses the action schema.
        const result: AgentAction = mode === "service"
          ? parseAgentAction(raw)
          : { action: "reply", reply: raw };

        send({ type: "step", stepType: "responding", id: "5", label: "Response ready", status: "done" });

        if (result.action === "quote") {
          const total = result.lines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
          send({ type: "step", stepType: "pricing", id: "6", label: "Quote built from rate card", detail: `${result.lines.length} line${result.lines.length !== 1 ? "s" : ""}`, status: "done" });
          send({ type: "step", stepType: "escalating", id: "7", label: "Sent to owner for approval", detail: "Held — not shown to customer", status: "done" });
          send({
            type: "quote",
            quote: {
              serviceName: result.serviceName,
              answers: result.answers ?? {},
              lines: result.lines,
              total,
              notes: result.notes,
            },
          });
        } else if (result.action === "escalate") {
          send({ type: "step", stepType: "escalating", id: "6", label: "Escalated to owner", detail: result.reason, status: "done" });
          send({
            type: "escalation",
            escalation: { question: result.question, reason: result.reason },
          });
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
        send({ type: "done" });
      } catch (err) {
        const raw = String(err);
        console.error("[chat] generation failed:", raw);
        const friendly = raw.includes("503") || raw.includes("high demand")
          ? "The AI service is busy right now. Please send your message again in a moment."
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
