"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User } from "lucide-react";
import { AgentSteps, Step } from "./AgentSteps";
import { ItemCard } from "./ProductCard";
import { Product, ServiceOffering } from "@/lib/data";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps?: Step[];
  matchedItems?: (Product | ServiceOffering)[];
};

const PRODUCT_QUICK: Record<string, string[]> = {
  b1: ["What earbuds do you have?", "Best ANC earbuds?", "Do you have wireless headphones?", "What's your return policy?"],
  b2: ["Show me men's oversized tees", "Women's t-shirt sizes available?", "Do sizes run true?", "What fabric are the tees?"],
  b3: ["Show me running shoes", "Do you have vegan shoes?", "What formal shoes do you sell?", "Return policy for shoes?"],
  b4: ["What lawn suit sets do you have?", "Tell me about winter fabrics", "How much fabric in a suit set?", "Do you cut custom lengths?"],
  b5: ["Grain-free dog food?", "Cat food options?", "Dog harness for medium dogs?", "Tell me about your subscription"],
};

const SERVICE_QUICK: Record<string, string[]> = {
  svc1: ["I've spotted rats in my kitchen", "How quickly can you treat a wasp nest?", "I think I have bed bugs", "What does a pest survey include?"],
  svc2: ["Install a home EV charger", "Do I qualify for the OZEV grant?", "How long does installation take?", "What charger brands do you supply?"],
  svc3: ["Book a weekly cleaner", "What's included in a deep clean?", "I need end of tenancy cleaning", "Do you work weekends?"],
  svc4: ["I need a man and van this weekend", "Moving a 3-bed house next month", "Do you provide packing boxes?", "Can you move a piano?"],
  svc5: ["How much does solar installation cost?", "Do I need planning permission?", "How much will I save?", "Book a free solar survey"],
};

const WELCOME: Record<string, string> = {
  product: "Hi! Ask me anything about our products — availability, pricing, sizes, returns, or recommendations.",
  service: "Hi! I can help you understand our services, check availability, and get you a quote. What do you need?",
};

export function ChatWindow({
  mode,
  bizId,
}: {
  mode: "product" | "service";
  bizId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: WELCOME[mode] },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const quickPrompts = mode === "product"
    ? (PRODUCT_QUICK[bizId] ?? [])
    : (SERVICE_QUICK[bizId] ?? []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: Message = { id: assistantId, role: "assistant", content: "", steps: [], matchedItems: [] };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput("");
    setLoading(true);

    const historyForApi = messages
      .filter(m => m.id !== "welcome")
      .map(m => ({ role: m.role, content: m.content }));

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: historyForApi, message: text, mode, bizId }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const event = JSON.parse(raw);

            if (event.type === "step") {
              setMessages(prev => prev.map(m => {
                if (m.id !== assistantId) return m;
                const newStep: Step = {
                  id: event.id,
                  type: event.stepType,   // ← fix: use stepType not type
                  label: event.label,
                  detail: event.detail,
                  status: event.status,
                };
                const steps = [...(m.steps ?? [])];
                const idx = steps.findIndex(s => s.id === event.id);
                if (idx >= 0) steps[idx] = newStep;
                else steps.push(newStep);
                return { ...m, steps };
              }));
            } else if (event.type === "matched") {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, matchedItems: event.items } : m
              ));
            } else if (event.type === "content") {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: event.text } : m
              ));
            } else if (event.type === "error") {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: event.message } : m
              ));
            }
          } catch {
            // malformed JSON line — skip
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: "Connection error. Please check your internet and try again." } : m
        ));
      }
    } finally {
      setLoading(false);
    }
  }, [loading, messages, mode, bizId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const showQuickPrompts = messages.length <= 1 && quickPrompts.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-3 msg-in ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                background: msg.role === "assistant" ? "var(--accent-dim)" : "var(--surface-2)",
                border: "1px solid var(--border)",
              }}
            >
              {msg.role === "assistant"
                ? <Bot size={14} style={{ color: "var(--accent)" }} />
                : <User size={14} style={{ color: "var(--text-muted)" }} />}
            </div>

            {/* Content */}
            <div className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end max-w-[78%]" : "items-start max-w-[82%]"}`}>
              {/* Agent process steps */}
              {msg.role === "assistant" && msg.steps && msg.steps.length > 0 && (
                <div
                  className="rounded-lg px-3 py-2.5 w-full"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", minWidth: 220 }}
                >
                  <p className="text-[9px] font-semibold tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                    AGENT PROCESS
                  </p>
                  <AgentSteps steps={msg.steps} />
                </div>
              )}

              {/* Bubble */}
              {msg.content ? (
                <div
                  className="rounded-lg px-3.5 py-2.5 text-sm leading-relaxed"
                  style={{
                    background: msg.role === "user" ? "var(--accent)" : "var(--surface-2)",
                    color: msg.role === "user" ? "#fff" : "var(--text)",
                    border: msg.role === "user" ? "none" : "1px solid var(--border)",
                  }}
                >
                  {msg.content}
                </div>
              ) : msg.role === "assistant" && loading ? (
                <div
                  className="rounded-lg px-4 py-3 flex gap-1.5 items-center"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                >
                  <span className="thinking-dot w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                  <span className="thinking-dot w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                  <span className="thinking-dot w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                </div>
              ) : null}

              {/* Matched items */}
              {msg.matchedItems && msg.matchedItems.length > 0 && (
                <div className="flex flex-col gap-2 w-full">
                  <p className="text-[9px] font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
                    FROM CATALOGUE
                  </p>
                  {msg.matchedItems.map(item => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {showQuickPrompts && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {quickPrompts.map(p => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              className="text-xs px-2.5 py-1.5 rounded-full transition-colors hover:opacity-80"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <form
        onSubmit={handleSubmit}
        className="p-3 flex gap-2 items-center"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={mode === "product" ? "Ask about a product…" : "Describe what you need…"}
          className="flex-1 rounded-lg px-3.5 py-2.5 text-sm outline-none"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
          disabled={loading}
          autoFocus
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-opacity"
          style={{ background: "var(--accent)", opacity: !input.trim() || loading ? 0.4 : 1 }}
        >
          <Send size={14} color="#fff" />
        </button>
      </form>
    </div>
  );
}
