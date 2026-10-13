import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { businesses, serviceBusinesses } from "@/lib/data";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

export async function POST(req: NextRequest) {
  const { history, message, mode, bizId } = await req.json();

  let systemPrompt = "";
  let catalogueSummary = "";

  if (mode === "product") {
    const biz = businesses.find(b => b.id === bizId);
    if (!biz) return new Response("Business not found", { status: 404 });
    catalogueSummary = JSON.stringify({ products: biz.products, faq: biz.faq, returnPolicy: biz.returnPolicy, shippingPolicy: biz.shippingPolicy }, null, 2);
    systemPrompt = `You are a helpful shopping assistant for "${biz.name}" — ${biz.tagline}.

CATALOGUE & POLICIES:
${catalogueSummary}

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
    catalogueSummary = JSON.stringify({ services: biz.services, faq: biz.faq, qualificationQuestions: biz.qualificationQuestions }, null, 2);
    systemPrompt = `You are a helpful booking assistant for "${biz.name}" — ${biz.tagline}.

SERVICES & POLICIES:
${catalogueSummary}

Your job:
- Help customers understand services, book, and get qualified.
- Ask the qualification questions to gather info before quoting.
- CRITICAL: You NEVER give a final binding price. Provide estimate ranges only. The owner approves all quotes before confirming.
- For FAQs, use the faq array above.
- Keep replies under 130 words. Be warm but efficient.`;
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode("data: " + JSON.stringify(data) + "\n\n"));
      };

      try {
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
          send({ type: "step", stepType: "pricing", id: "4", label: "Applying pricing rules", detail: "Estimate only — owner approval required", status: "running" });
          await delay(120);
          send({ type: "step", stepType: "pricing", id: "4", label: "Pricing rules applied", status: "done" });
        }

        send({ type: "step", stepType: "responding", id: "5", label: "Composing response", status: "running" });

        const geminiHistory = [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "Understood. I'm ready to help customers." }] },
          ...(history || []).map((m: { role: string; content: string }) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
        ];

        const text = await generateWithFallback(geminiHistory, message);

        send({ type: "step", stepType: "responding", id: "5", label: "Response ready", status: "done" });
        send({ type: "matched", items: matched });
        send({ type: "content", text });
        send({ type: "done" });
      } catch (err) {
        const raw = String(err);
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
