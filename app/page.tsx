"use client";

import { useState } from "react";
import { Zap, ChevronRight, ChevronLeft, ShoppingBag, Wrench } from "lucide-react";
import { ChatWindow } from "@/components/ChatWindow";
import { businesses, serviceBusinesses } from "@/lib/data";

type Mode = "product" | "service";

export default function Home() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [bizId, setBizId] = useState<string | null>(null);

  if (!mode) return <LandingScreen onSelect={setMode} />;
  if (!bizId) return <BizSelect mode={mode} onBack={() => setMode(null)} onSelect={setBizId} />;

  const biz = mode === "product"
    ? businesses.find(b => b.id === bizId)
    : serviceBusinesses.find(b => b.id === bizId);

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setBizId(null)}
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
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--green)", animation: "pulse-dot 2s infinite" }} />
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Live</span>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <ChatWindow mode={mode} bizId={bizId} />
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
            AI-powered storefront & service assistant
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <ModeCard
          icon={<ShoppingBag size={20} style={{ color: "var(--green)" }} />}
          title="Product Chat"
          description="Browse 5 ecommerce businesses — audio, clothing, shoes, fabric, pet supplies. Ask about products, stock, pricing, returns."
          badge="Shop"
          badgeColor="var(--green)"
          badgeBg="var(--green-dim)"
          onClick={() => onSelect("product")}
        />
        <ModeCard
          icon={<Wrench size={20} style={{ color: "var(--accent)" }} />}
          title="Service Booking"
          description="Pest control, EV charging, cleaning, removals, solar. Get qualified, ask FAQs, and request a quote."
          badge="Services"
          badgeColor="var(--accent)"
          badgeBg="var(--accent-dim)"
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
            className="w-full rounded-xl p-4 text-left flex items-start gap-3 group transition-all"
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
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>{biz.name}</span>
              </div>
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
      className="w-full rounded-xl p-4 text-left flex items-start gap-3 group transition-all"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#6c63ff55"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; }}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--surface-2)" }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>{title}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: badgeBg, color: badgeColor }}>{badge}</span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{description}</p>
      </div>
      <ChevronRight size={16} className="flex-shrink-0 mt-1" style={{ color: "var(--text-muted)" }} />
    </button>
  );
}
