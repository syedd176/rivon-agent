import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { products, services } from "@/lib/data";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const PRODUCT_SYSTEM = `You are Rivon's product assistant. Help customers find pest control products, EV charging equipment, cleaning supplies, and removal supplies.

CATALOGUE (use ONLY these prices):
${JSON.stringify(products, null, 2)}

Rules:
- Only quote prices from the catalogue. Never invent prices.
- If out of stock, say so. Mention lead times when they exist.
- Keep responses under 120 words.
- For orders: direct to checkout.`;

const SERVICE_SYSTEM = `You are Rivon's service booking assistant for pest control, EV charging installation, cleaning, and removals in the UK and Ireland.

SERVICES:
${JSON.stringify(services, null, 2)}

CRITICAL PRICING RULE: You NEVER give a final binding quote. Estimates only. Owner approves all quotes.

QUALIFICATION:
- Ask postcode to confirm coverage.
- Pest control: what pest, how long, property type.
- EV charging: single-phase? OZEV grant used?
- Cleaning: property size, frequency.
- Removals: origin/destination postcodes, volume, date.

Keep responses under 130 words. Be warm but efficient.`;

function findRelevantItems(query: string, mode: string) {
  const q = query.toLowerCase();
  const items = mode === "product" ? products : services;
  const keywords = ["pest", "rat", "mouse", "wasp", "cockroach", "bug", "clean", "removal", "ev", "charger", "move", "bed"];
  return items.filter(item =>
    item.name.toLowerCase().includes(q) ||
    item.category.toLowerCase().includes(q) ||
    keywords.some(kw => q.includes(kw) && (item.name.toLowerCase().includes(kw) || item.category.toLowerCase().includes(kw)))
  ).slice(0, 3);
}

export async function POST(req: NextRequest) {
  const { history, message, mode } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode("data: " + JSON.stringify(data) + "\n\n"));
      };

      try {
        // Agentic steps
        send({ type: "step", id: "1", label: "Understanding intent", status: "running" });
        await delay(250);
        send({ type: "step", id: "1", label: "Understanding intent", status: "done" });

        send({ type: "step", id: "2", label: "Searching catalogue", detail: `${mode === "product" ? products.length : services.length} items`, status: "running" });
        await delay(200);
        const matched = findRelevantItems(message, mode);
        send({ type: "step", id: "2", label: "Searching catalogue", detail: `${matched.length} relevant item${matched.length !== 1 ? "s" : ""} found`, status: "done" });

        if (matched.length > 0) {
          send({ type: "step", id: "3", label: "Matching to query", detail: matched.slice(0, 2).map((m: { name: string }) => m.name).join(", "), status: "running" });
          await delay(150);
          send({ type: "step", id: "3", label: "Matching to query", status: "done" });
        }

        if (mode === "service") {
          send({ type: "step", id: "4", label: "Applying pricing rules", detail: "Estimate only — owner approval required", status: "running" });
          await delay(150);
          send({ type: "step", id: "4", label: "Pricing rules applied", status: "done" });
        }

        send({ type: "step", id: "5", label: "Composing response", status: "running" });

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const systemPrompt = mode === "product" ? PRODUCT_SYSTEM : SERVICE_SYSTEM;

        const geminiHistory = [
          { role: "user", parts: [{ text: "Context: " + systemPrompt }] },
          { role: "model", parts: [{ text: "Understood." }] },
          ...(history || []).map((m: { role: string; content: string }) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
        ];

        const chatSession = model.startChat({ history: geminiHistory });
        const result = await chatSession.sendMessage(message);
        const text = result.response.text();

        send({ type: "step", id: "5", label: "Response ready", status: "done" });
        send({ type: "matched", items: matched });
        send({ type: "content", text });
        send({ type: "done" });
      } catch (err) {
        send({ type: "error", message: String(err) });
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

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
