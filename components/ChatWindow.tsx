"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User } from "lucide-react";
import { AgentSteps, Step } from "./AgentSteps";
import { ItemCard } from "./ProductCard";
import { Product, Service } from "@/lib/data";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps?: Step[];
  matchedItems?: (Product | Service)[];
};

const QUICK_PROMPTS: Record<string, string[]> = {
  product: [
    "What rat traps do you sell?",
    "Show me EV charger options",
    "Do you have bed bug kits?",
    "What's included in end of tenancy clean?",
  ],
  service: [
    "I have a wasp nest — can you help?",
    "Book a regular cleaner for my flat",
    "I need a removal van next week",
    "Install an EV charger at home",
  ],
};

const WELCOME: Record<string, string> = {
  product: "Hi! I can help you find and learn about Rivon's products — pest control, EV charging, cleaning, and removals. What are you looking for?",
  service: "Hi! I can help you book a service — pest control, EV charger installation, cleaning, or removals. What do you need done?",
};

export function ChatWindow({ mode }: { mode: "product" | "service" }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: WELCOME[mode] },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };

    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      steps: [],
      matchedItems: [],
    };

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
        body: JSON.stringify({ history: historyForApi, message: text, mode }),
        signal: abortRef.current.signal,
      });

      const reader = res.body!.getReader();
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
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === "step") {
              setMessages(prev => prev.map(m => {
                if (m.id !== assistantId) return m;
                const existingIdx = (m.steps ?? []).findIndex(s => s.id === event.id);
                const newStep: Step = {
                  id: event.id,
                  type: event.type,
                  label: event.label,
                  detail: event.detail,
                  status: event.status,
                };
                if (existingIdx >= 0) {
                  const steps = [...(m.steps ?? [])];
                  steps[existingIdx] = newStep;
                  return { ...m, steps };
                }
                return { ...m, steps: [...(m.steps ?? []), newStep] };
              }));
            } else if (event.type === "matched") {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, matchedItems: event.items } : m
              ));
            } else if (event.type === "content") {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: event.text } : m
              ));
            }
          } catch {}
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: "Sorry, something went wrong. Please try again." } : m
        ));
      }
    } finally {
      setLoading(false);
    }
  }, [loading, messages, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--surface)" }}>
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
              {msg.role === "assistant" ? (
                <Bot size={14} style={{ color: "var(--accent)" }} />
              ) : (
                <User size={14} style={{ color: "var(--text-muted)" }} />
              )}
            </div>

            {/* Bubble */}
            <div className={`flex flex-col gap-2 max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
              {msg.role === "assistant" && msg.steps && msg.steps.length > 0 && (
                <div
                  className="rounded-lg px-3 py-2 w-full"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    minWidth: "200px",
                  }}
                >
                  <p className="text-[10px] font-medium mb-2" style={{ color: "var(--text-muted)" }}>
                    AGENT PROCESS
                  </p>
                  <AgentSteps steps={msg.steps} />
                </div>
              )}

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
                  className="rounded-lg px-4 py-3 flex gap-1 items-center"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                >
                  <span className="thinking-dot w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                  <span className="thinking-dot w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                  <span className="thinking-dot w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                </div>
              ) : null}

              {msg.matchedItems && msg.matchedItems.length > 0 && (
                <div className="flex flex-col gap-2 w-full">
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>MATCHED FROM CATALOGUE</p>
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
      {messages.length <= 2 && (
        <div className="px-4 pb-2 flex gap-2 flex-wrap">
          {QUICK_PROMPTS[mode].map(p => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              className="text-xs px-2.5 py-1 rounded-full transition-colors"
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

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-3 flex gap-2 items-center"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <input
          ref={inputRef}
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
          style={{
            background: "var(--accent)",
            opacity: !input.trim() || loading ? 0.4 : 1,
          }}
        >
          <Send size={14} color="#fff" />
        </button>
      </form>
    </div>
  );
}
