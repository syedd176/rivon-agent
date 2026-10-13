"use client";

import { useState } from "react";
import { ShoppingBag, Wrench, Zap, ChevronRight } from "lucide-react";
import { ChatWindow } from "@/components/ChatWindow";

type Mode = "product" | "service" | null;

export default function Home() {
  const [mode, setMode] = useState<Mode>(null);

  if (!mode) {
    return <ModeSelect onSelect={setMode} />;
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--accent-dim)" }}
          >
            <Zap size={14} style={{ color: "var(--accent)" }} />
          </div>
          <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>
            Rivon
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: mode === "product" ? "var(--green-dim)" : "var(--accent-dim)",
              color: mode === "product" ? "var(--green)" : "var(--accent)",
            }}
          >
            {mode === "product" ? "Products" : "Services"}
          </span>
        </div>
        <button
          onClick={() => setMode(null)}
          className="text-xs flex items-center gap-1 transition-opacity hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
        >
          Switch mode
          <ChevronRight size={12} />
        </button>
      </header>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <ChatWindow mode={mode} />
      </div>
    </div>
  );
}

function ModeSelect({ onSelect }: { onSelect: (m: "product" | "service") => void }) {
  return (
    <div
      className="min-h-full flex flex-col items-center justify-center px-6 py-12"
      style={{ background: "var(--background)" }}
    >
      {/* Logo */}
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
            AI-powered assistant for UK home services
          </p>
        </div>
      </div>

      {/* Mode cards */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <ModeCard
          icon={<ShoppingBag size={20} style={{ color: "var(--green)" }} />}
          title="Product Enquiry"
          description="Browse and ask about products — pest control, EV charging, cleaning, removals."
          badge="Shop"
          badgeColor="var(--green)"
          badgeBg="var(--green-dim)"
          onClick={() => onSelect("product")}
        />
        <ModeCard
          icon={<Wrench size={20} style={{ color: "var(--accent)" }} />}
          title="Book a Service"
          description="Get qualified and booked for pest control, EV charger install, cleaning, or a move."
          badge="Services"
          badgeColor="var(--accent)"
          badgeBg="var(--accent-dim)"
          onClick={() => onSelect("service")}
        />
      </div>

      {/* Footer note */}
      <p className="text-xs mt-8 text-center" style={{ color: "var(--text-muted)" }}>
        Simulates WhatsApp · Instagram · Facebook Messenger channels
      </p>
    </div>
  );
}

function ModeCard({
  icon,
  title,
  description,
  badge,
  badgeColor,
  badgeBg,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl p-4 text-left flex items-start gap-3 group transition-all"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "#6c63ff55";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
      }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: "var(--surface-2)" }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>{title}</span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full"
            style={{ background: badgeBg, color: badgeColor }}
          >
            {badge}
          </span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {description}
        </p>
      </div>
      <ChevronRight
        size={16}
        className="flex-shrink-0 mt-1 transition-transform group-hover:translate-x-0.5"
        style={{ color: "var(--text-muted)" }}
      />
    </button>
  );
}
