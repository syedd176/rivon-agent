"use client";

import { TrendingUp, User, Tag, MessageCircle } from "lucide-react";
import { Lead, STAGE_LABEL, STAGE_ORDER, scoreColor, scoreBg } from "@/lib/leads";

export function LeadPanel({ lead, isYou }: { lead: Lead; isYou?: boolean }) {
  const color = scoreColor(lead.score);
  const stageIdx = STAGE_ORDER.indexOf(lead.stage);

  return (
    <div
      className="rounded-lg p-3 flex flex-col gap-2.5"
      style={{
        background: "var(--surface-2)",
        border: `1px solid ${isYou ? "#6c63ff44" : "var(--border)"}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <User size={11} style={{ color: "var(--text-muted)" }} />
          <span className="text-[10px] font-semibold tracking-wider truncate" style={{ color: "var(--text-muted)" }}>
            {isYou ? "THIS BROWSER" : "VISITOR " + lead.sessionId.slice(0, 6).toUpperCase()}
          </span>
        </div>
        <span
          className="text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 flex-shrink-0"
          style={{ background: scoreBg(lead.score), color, fontVariantNumeric: "tabular-nums" }}
        >
          <TrendingUp size={9} />
          {lead.score}
        </span>
      </div>

      {/* Stage track */}
      <div className="flex flex-col gap-1">
        <div className="flex gap-0.5">
          {STAGE_ORDER.map((s, i) => (
            <div
              key={s}
              className="h-1 flex-1 rounded-full"
              style={{ background: i <= stageIdx ? color : "var(--border)" }}
            />
          ))}
        </div>
        <span className="text-[10px]" style={{ color }}>{STAGE_LABEL[lead.stage]}</span>
      </div>

      {lead.interest && (
        <p className="text-[11px] leading-snug" style={{ color: "var(--text)" }}>
          {lead.interest}
        </p>
      )}

      {Object.keys(lead.facts).length > 0 && (
        <div className="flex flex-col gap-0.5 pt-1.5" style={{ borderTop: "1px solid var(--border)" }}>
          {Object.entries(lead.facts).slice(0, 5).map(([k, v]) => (
            <div key={k} className="flex items-start justify-between gap-2 text-[10px]">
              <span style={{ color: "var(--text-muted)" }}>{k}</span>
              <span className="text-right" style={{ color: "var(--text)" }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {lead.mentionedItems.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {lead.mentionedItems.slice(0, 4).map(item => (
            <span
              key={item}
              className="text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1"
              style={{ background: "var(--background)", color: "var(--text-muted)" }}
            >
              <Tag size={7} />
              {item.length > 24 ? item.slice(0, 24) + "…" : item}
            </span>
          ))}
        </div>
      )}

      {lead.signals.length > 0 && (
        <div className="flex flex-col gap-0.5">
          {lead.signals.slice(0, 3).map((s, i) => (
            <span
              key={i}
              className="text-[10px] flex items-start gap-1.5 leading-snug"
              style={{ color: s.positive ? "var(--green)" : "var(--text-muted)" }}
            >
              <span style={{ opacity: 0.7 }}>{s.positive ? "+" : "−"}</span>
              {s.label}
            </span>
          ))}
        </div>
      )}

      <span className="text-[9px] flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
        <MessageCircle size={8} />
        {lead.messageCount} message{lead.messageCount !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
