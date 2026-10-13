import { GoogleGenerativeAI } from "@google/generative-ai";
import { products, services, Product, Service } from "./data";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export type AgentStep = {
  id: string;
  type: "thinking" | "searching" | "matching" | "pricing" | "responding" | "escalating";
  label: string;
  detail?: string;
  status: "running" | "done" | "error";
  ts: number;
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps?: AgentStep[];
  matchedItems?: (Product | Service)[];
  ts: number;
};

const PRODUCT_SYSTEM = `You are Rivon's product assistant. You help customers find and buy pest control products, EV charging equipment, cleaning supplies, and removal supplies from Rivon's catalogue.

CATALOGUE:
${JSON.stringify(products, null, 2)}

Rules:
1. Only quote prices from the catalogue above. Never invent prices.
2. If a product is out of stock, say so clearly.
3. Always mention lead times when they exist.
4. Be helpful, concise, and honest about what you have vs. don't have.
5. If the customer wants something not in the catalogue, say you don't carry it.
6. For orders, tell them to proceed to checkout — you cannot place orders in chat.
7. Keep responses under 120 words.
8. End with a helpful follow-up question if relevant.`;

const SERVICE_SYSTEM = `You are Rivon's service booking assistant. You help customers understand, qualify for, and book services in pest control, EV charging installation, cleaning, and removals.

SERVICES:
${JSON.stringify(services, null, 2)}

QUALIFICATION RULES:
- Ask for postcode to confirm we cover their area.
- For pest control: ask what pest, how long they've noticed it, and property type.
- For EV charging: confirm it's single-phase and ask if OZEV grant has been claimed.
- For cleaning: ask size of property and frequency needed.
- For removals: ask origin and destination postcodes, approximate volume (boxes/rooms), and date.

PRICING RULE (CRITICAL): You NEVER produce a final binding price. You provide an estimate range only. The owner approves all quotes before they reach the customer.

Keep responses under 130 words. Be warm but efficient.`;

function findRelevantItems(query: string, mode: "product" | "service"): (Product | Service)[] {
  const q = query.toLowerCase();
  const items = mode === "product" ? products : services;
  return items.filter(item =>
    item.name.toLowerCase().includes(q) ||
    item.category.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    ["pest", "rat", "mouse", "wasp", "cockroach", "bug", "clean", "removal", "ev", "charger"].some(
      kw => q.includes(kw) && (item.name.toLowerCase().includes(kw) || item.category.toLowerCase().includes(kw))
    )
  ).slice(0, 3);
}

export async function chat(
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string,
  mode: "product" | "service",
  onStep: (step: AgentStep) => void
): Promise<{ content: string; matchedItems: (Product | Service)[] }> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Step 1: thinking
  onStep({ id: "1", type: "thinking", label: "Understanding intent", status: "running", ts: Date.now() });
  await delay(300);
  onStep({ id: "1", type: "thinking", label: "Understanding intent", status: "done", ts: Date.now() });

  // Step 2: searching catalogue
  onStep({ id: "2", type: "searching", label: "Searching catalogue", detail: `${mode === "product" ? products.length : services.length} items`, status: "running", ts: Date.now() });
  await delay(200);
  const matched = findRelevantItems(userMessage, mode);
  onStep({ id: "2", type: "searching", label: "Searching catalogue", detail: `${matched.length} relevant items found`, status: "done", ts: Date.now() });

  // Step 3: matching
  if (matched.length > 0) {
    onStep({ id: "3", type: "matching", label: "Matching to query", detail: matched.map(m => m.name).join(", "), status: "running", ts: Date.now() });
    await delay(200);
    onStep({ id: "3", type: "matching", label: "Matching to query", status: "done", ts: Date.now() });
  }

  // Step 4: pricing check (service mode)
  if (mode === "service") {
    onStep({ id: "4", type: "pricing", label: "Checking pricing rules", detail: "Owner approval required — estimate only", status: "running", ts: Date.now() });
    await delay(150);
    onStep({ id: "4", type: "pricing", label: "Pricing rules applied", status: "done", ts: Date.now() });
  }

  // Step 5: generating response
  onStep({ id: "5", type: "responding", label: "Composing response", status: "running", ts: Date.now() });

  const systemPrompt = mode === "product" ? PRODUCT_SYSTEM : SERVICE_SYSTEM;
  const geminiHistory = history.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const chatSession = model.startChat({
    history: [
      { role: "user", parts: [{ text: "System context: " + systemPrompt }] },
      { role: "model", parts: [{ text: "Understood. I'm ready to assist." }] },
      ...geminiHistory,
    ],
  });

  const result = await chatSession.sendMessage(userMessage);
  const text = result.response.text();

  onStep({ id: "5", type: "responding", label: "Response ready", status: "done", ts: Date.now() });

  return { content: text, matchedItems: matched };
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
