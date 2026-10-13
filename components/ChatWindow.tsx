"use client";

import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { Send, Bot, User, Clock } from "lucide-react";
import { AgentSteps, Step } from "./AgentSteps";
import { ItemCard } from "./ProductCard";
import { Product, ServiceOffering } from "@/lib/data";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps?: Step[];
  matchedItems?: (Product | ServiceOffering)[];
  /** Customer is waiting on the owner; shown as a hold chip under the bubble. */
  awaiting?: boolean;
  /** Reached the customer only after the owner approved it. */
  ownerApproved?: boolean;
};

export type ChatHandle = {
  /** Deliver a message the owner approved or wrote. */
  pushOwnerMessage: (text: string) => void;
  /** Clear the hold chip once the owner has acted. */
  clearAwaiting: () => void;
};

const PRODUCT_QUICK: Record<string, string[]> = {
  b1: ["What earbuds do you have?", "Best ANC earbuds?", "Do you have wireless headphones?", "What's your return policy?"],
  b2: ["Show me men's oversized tees", "Women's t-shirt sizes available?", "Do sizes run true?", "What fabric are the tees?"],
  b3: ["Show me running shoes", "Do you have vegan shoes?", "What formal shoes do you sell?", "Return policy for shoes?"],
  b4: ["What lawn suit sets do you have?", "Tell me about winter fabrics", "How much fabric in a suit set?", "Do you cut custom lengths?"],
  b5: ["Grain-free dog food?", "Cat food options?", "Dog harness for medium dogs?", "Tell me about your subscription"],
};

const SERVICE_QUICK: Record<string, string[]> = {
  svc1: ["I've got rats in my kitchen, how much?", "Quote me for wasp nest removal", "I think I have bed bugs", "Do you treat pigeons on a roof?"],
  svc2: ["Quote me for a home EV charger", "Do I qualify for the OZEV grant?", "How long does installation take?", "Can you install at a listed building?"],
  svc3: ["How much for end of tenancy cleaning?", "Quote a weekly cleaner for a 2-bed", "What's included in a deep clean?", "Can you clean a hoarder property?"],
  svc4: ["Quote a 3-bed house move", "I need a man and van this weekend", "Do you provide packing boxes?", "Can you move a grand piano?"],
  svc5: ["How much for solar panels?", "Quote me for panels and a battery", "Do I need planning permission?", "Can you install on a thatched roof?"],
};

const WELCOME: Record<string, string> = {
  product: "Hi! Ask me anything about our products — availability, pricing, sizes, returns, or recommendations.",
  service: "Hi! Tell me what you need and I'll get you a price. I'll ask a few questions first so the quote is accurate.",
};

type Props = {
  mode: "product" | "service";
  bizId: string;
  onQuote?: (q: { serviceName: string; answers: Record<string, string>; lines: { label: string; amount: number }[]; total: number; notes?: string }) => void;
  onEscalation?: (e: { question: string; reason: string }) => void;
};

export const ChatWindow = forwardRef<ChatHandle, Props>(function ChatWindow(
  { mode, bizId, onQuote, onEscalation },
  ref
) {
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

  useImperativeHandle(ref, () => ({
    pushOwnerMessage: (text: string) => {
      setMessages(prev => [
        ...prev.map(m => ({ ...m, awaiting: false })),
        { id: `owner-${Date.now()}`, role: "assistant", content: text, ownerApproved: true },
      ]);
    },
    clearAwaiting: () => {
      setMessages(prev => prev.map(m => ({ ...m, awaiting: false })));
    },
  }), []);

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

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

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
          const rawLine = line.slice(6).trim();
          if (!rawLine) continue;
          try {
            const event = JSON.parse(rawLine);

            if (event.type === "step") {
              setMessages(prev => prev.map(m => {
                if (m.id !== assistantId) return m;
                const newStep: Step = {
                  id: event.id,
                  type: event.stepType,
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
            } else if (event.type === "quote") {
              onQuote?.(event.quote);
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, awaiting: true } : m
              ));
            } else if (event.type === "escalation") {
              onEscalation?.(event.escalation);
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, awaiting: true } : m
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
            // malformed SSE line — skip
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
  }, [loading, messages, mode, bizId, onQuote, onEscalation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const showQuickPrompts = messages.length <= 1 && quickPrompts.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-3 msg-in ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                background: msg.role === "assistant"
                  ? (msg.ownerApproved ? "var(--green-dim)" : "var(--accent-dim)")
                  : "var(--surface-2)",
                border: "1px solid var(--border)",
              }}
            >
              {msg.role === "assistant"
                ? <Bot size={14} style={{ color: msg.ownerApproved ? "var(--green)" : "var(--accent)" }} />
                : <User size={14} style={{ color: "var(--text-muted)" }} />}
            </div>

            <div className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end max-w-[78%]" : "items-start max-w-[85%]"}`}>
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

              {msg.ownerApproved && (
                <span
                  className="text-[9px] font-semibold tracking-widest px-1.5 py-0.5 rounded"
                  style={{ background: "var(--green-dim)", color: "var(--green)" }}
                >
                  APPROVED BY OWNER
                </span>
              )}

              {msg.content ? (
                <div
                  className="rounded-lg px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                  style={{
                    background: msg.role === "user" ? "var(--accent)" : "var(--surface-2)",
                    color: msg.role === "user" ? "#fff" : "var(--text)",
                    border: msg.role === "user"
                      ? "none"
                      : `1px solid ${msg.ownerApproved ? "#22c55e55" : "var(--border)"}`,
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

              {msg.awaiting && (
                <span
                  className="text-[10px] flex items-center gap-1 px-2 py-1 rounded-full"
                  style={{ background: "var(--amber-dim)", color: "var(--amber)" }}
                >
                  <Clock size={9} className="thinking-dot" />
                  Awaiting confirmation from the team
                </span>
              )}

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

      {showQuickPrompts && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {quickPrompts.map(p => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              className="text-xs px-2.5 py-1.5 rounded-full transition-colors hover:opacity-80"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="p-3 flex gap-2 items-center"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={mode === "product" ? "Ask about a product…" : "Describe what you need…"}
          className="flex-1 min-w-0 rounded-lg px-3.5 py-2.5 text-sm outline-none"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
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
});
