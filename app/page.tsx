"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Zap, ChevronRight, ChevronLeft, ShoppingBag, Wrench, PanelRight } from "lucide-react";
import { ChatWindow, ChatHandle } from "@/components/ChatWindow";
import { OwnerInbox } from "@/components/OwnerInbox";
import { businesses, serviceBusinesses } from "@/lib/data";
import { InboxItem, isQuote } from "@/lib/quotes";
import { Lead } from "@/lib/leads";

type Mode = "product" | "service";

type RestoredMessage = { role: "user" | "assistant"; content: string; ownerApproved?: boolean };

export default function Home() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [bizId, setBizId] = useState<string | null>(null);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [restored, setRestored] = useState<RestoredMessage[] | undefined>();
  const [mobilePane, setMobilePane] = useState<"chat" | "inbox">("chat");
  const chatRef = useRef<ChatHandle>(null);

  /** Pulls this browser's conversation plus every lead for the business. */
  const refresh = useCallback(async (id: string, m: Mode, withMessages = false) => {
    try {
      const res = await fetch(`/api/session?bizId=${id}&mode=${m}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setSessionId(data.sessionId);
      setLeads(data.leads ?? []);
      setItems(data.allInbox ?? []);
      if (withMessages && data.messages?.length) setRestored(data.messages);
    } catch {
      // Offline or the route is unreachable — the chat still works without it.
    }
  }, []);

  useEffect(() => {
    if (bizId && mode) refresh(bizId, mode, true);
  }, [bizId, mode, refresh]);

  const reset = () => {
    setBizId(null);
    setItems([]);
    setLeads([]);
    setRestored(undefined);
    setMobilePane("chat");
  };

  const onTurnComplete = useCallback(() => {
    if (bizId && mode) refresh(bizId, mode);
  }, [bizId, mode, refresh]);

  /** Owner actions go through the API so the change persists for everyone. */
  const ownerAct = useCallback(async (
    item: InboxItem,
    action: "approve" | "reject" | "answer",
    extra?: { finalTotal?: number; reply?: string }
  ) => {
    const targetSessionId = (item as InboxItem & { sessionId?: string }).sessionId;
    if (!bizId || !targetSessionId) return;

    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bizId, targetSessionId, itemId: item.id, action, ...extra }),
    });
    if (!res.ok) return;
    const data = await res.json();

    // Only this browser's own chat updates live; other visitors see it on reload.
    if (data.customerMessage && targetSessionId === sessionId) {
      chatRef.current?.pushOwnerMessage(data.customerMessage);
    }
    if (mode) refresh(bizId, mode);
  }, [bizId, mode, sessionId, refresh]);

  const approveQuote = useCallback((id: string, finalTotal: number) => {
    const item = items.find(i => i.id === id);
    if (item) ownerAct(item, "approve", { finalTotal });
  }, [items, ownerAct]);

  const rejectQuote = useCallback((id: string) => {
    const item = items.find(i => i.id === id);
    if (item) ownerAct(item, "reject");
  }, [items, ownerAct]);

  const answerEscalation = useCallback((id: string, reply: string) => {
    const item = items.find(i => i.id === id);
    if (item) ownerAct(item, "answer", { reply });
  }, [items, ownerAct]);

  if (!mode) return <LandingScreen onSelect={setMode} />;
  if (!bizId) return <BizSelect mode={mode} onBack={() => setMode(null)} onSelect={setBizId} />;

  const biz = mode === "product"
    ? businesses.find(b => b.id === bizId)
    : serviceBusinesses.find(b => b.id === bizId);

  const pendingCount = items.filter(i =>
    isQuote(i) ? i.status === "pending" : i.status === "unanswered"
  ).length;

  // Product mode has no approvals, but still has leads worth watching.
  const showInbox = true;

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      <header
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={reset}
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-70"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            <ChevronLeft size={14} style={{ color: "var(--text-muted)" }} />
          </button>
          <span className="text-lg flex-shrink-0">{biz?.icon}</span>
          <span className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>{biz?.name}</span>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
            style={{
              background: mode === "product" ? "var(--green-dim)" : "var(--accent-dim)",
              color: mode === "product" ? "var(--green)" : "var(--accent)",
            }}
          >
            {mode === "product" ? "Shop" : "Services"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {showInbox && (
            <button
              onClick={() => setMobilePane(p => (p === "chat" ? "inbox" : "chat"))}
              className="md:hidden flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px]"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              <PanelRight size={11} />
              {mobilePane === "chat" ? "Owner" : "Chat"}
              {pendingCount > 0 && mobilePane === "chat" && (
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                  style={{ background: "var(--amber)", color: "#1a1200" }}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--green)", animation: "pulse-dot 2s infinite" }} />
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Live</span>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex">
        <div
          className={`flex-1 min-w-0 ${showInbox && mobilePane === "inbox" ? "hidden md:flex" : "flex"} flex-col`}
          style={{ background: "var(--surface)" }}
        >
          <ChatWindow
            ref={chatRef}
            mode={mode}
            bizId={bizId}
            restored={restored}
            onTurnComplete={onTurnComplete}
          />
        </div>

        {showInbox && (
          <div
            className={`${mobilePane === "inbox" ? "flex w-full" : "hidden"} md:flex md:w-[320px] lg:w-[360px] flex-shrink-0`}
          >
            <div className="w-full">
              <OwnerInbox
                items={items}
                leads={leads}
                mySessionId={sessionId}
                mode={mode}
                onApproveQuote={approveQuote}
                onRejectQuote={rejectQuote}
                onAnswerEscalation={answerEscalation}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LandingScreen({ onSelect }: { onSelect: (m: Mode) => void }) {
  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-12" style={{ background: "var(--background)" }}>
      <div className="mb-10 flex flex-col items-center gap-3">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--accent-dim)", border: "1px solid var(--border)" }}
        >
          <Zap size={26} style={{ color: "var(--accent)" }} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Rivon Agent</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            AI-powered storefront &amp; service assistant
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <ModeCard
          icon={<ShoppingBag size={20} style={{ color: "var(--green)" }} />}
          title="Product Chat"
          description="Five storefronts — audio, clothing, shoes, fabric, pet supplies. Ask about stock, pricing, sizes and returns."
          badge="Shop"
          badgeColor="var(--green)"
          badgeBg="var(--green-dim)"
          onClick={() => onSelect("product")}
        />
        <ModeCard
          icon={<Wrench size={20} style={{ color: "var(--accent)" }} />}
          title="Service Booking"
          description="Five trades. The agent qualifies the job, builds a quote, and holds it for the owner to approve before the customer sees a price."
          badge="Owner approval"
          badgeColor="var(--amber)"
          badgeBg="var(--amber-dim)"
          onClick={() => onSelect("service")}
        />
      </div>

      <p className="text-xs mt-8 text-center" style={{ color: "var(--text-muted)" }}>
        Simulates WhatsApp · Instagram · Facebook Messenger
      </p>
    </div>
  );
}

function BizSelect({ mode, onBack, onSelect }: { mode: Mode; onBack: () => void; onSelect: (id: string) => void }) {
  const list = mode === "product" ? businesses : serviceBusinesses;

  return (
    <div className="min-h-full flex flex-col" style={{ background: "var(--background)" }}>
      <header
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <button
          onClick={onBack}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
        >
          <ChevronLeft size={14} style={{ color: "var(--text-muted)" }} />
        </button>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            {mode === "product" ? "Choose a store" : "Choose a service"}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {list.length} {mode === "product" ? "businesses" : "providers"} available
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {list.map(biz => (
          <button
            key={biz.id}
            onClick={() => onSelect(biz.id)}
            className="w-full rounded-xl p-4 text-left flex items-start gap-3 transition-all"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = biz.color + "55"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: biz.color + "18" }}
            >
              {biz.icon}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-sm block mb-1" style={{ color: "var(--text)" }}>{biz.name}</span>
              <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{biz.tagline}</p>
              <div className="flex flex-wrap gap-1">
                {biz.categories.slice(0, 4).map(cat => (
                  <span
                    key={cat}
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ background: biz.color + "18", color: biz.color }}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
            <ChevronRight size={15} className="flex-shrink-0 mt-1" style={{ color: "var(--text-muted)" }} />
          </button>
        ))}
      </div>
    </div>
  );
}

function ModeCard({
  icon, title, description, badge, badgeColor, badgeBg, onClick,
}: {
  icon: React.ReactNode; title: string; description: string;
  badge: string; badgeColor: string; badgeBg: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl p-4 text-left flex items-start gap-3 transition-all"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#6c63ff55"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; }}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--surface-2)" }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>{title}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: badgeBg, color: badgeColor }}>{badge}</span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{description}</p>
      </div>
      <ChevronRight size={16} className="flex-shrink-0 mt-1" style={{ color: "var(--text-muted)" }} />
    </button>
  );
}
