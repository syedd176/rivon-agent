"use client";

import { useState } from "react";
import { Check, X, Pencil, Send, Inbox, AlertTriangle, ReceiptText, Users } from "lucide-react";
import { InboxItem, Quote, Escalation, isQuote, formatGBP } from "@/lib/quotes";
import { Lead } from "@/lib/leads";
import { LeadPanel } from "./LeadPanel";

type Tab = "inbox" | "leads";

export function OwnerInbox({
  items,
  leads,
  mySessionId,
  mode,
  onApproveQuote,
  onRejectQuote,
  onAnswerEscalation,
}: {
  items: InboxItem[];
  leads: Lead[];
  mySessionId: string | null;
  mode: "product" | "service";
  onApproveQuote: (id: string, finalTotal: number) => void;
  onRejectQuote: (id: string) => void;
  onAnswerEscalation: (id: string, reply: string) => void;
}) {
  // Product mode has nothing to approve, so leads are the only thing to show.
  const [tab, setTab] = useState<Tab>(mode === "service" ? "inbox" : "leads");

  const pendingCount = items.filter(i =>
    isQuote(i) ? i.status === "pending" : i.status === "unanswered"
  ).length;

  const ranked = [...leads].sort((a, b) => b.score - a.score);

  return (
    <aside
      className="flex flex-col h-full"
      style={{ background: "var(--surface)", borderLeft: "1px solid var(--border)" }}
    >
      <header className="flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Owner view</span>
          {pendingCount > 0 && mode === "service" && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "var(--amber-dim)", color: "var(--amber)" }}
            >
              {pendingCount} waiting
            </span>
          )}
        </div>

        <div className="flex gap-1 px-3 pb-2">
          {mode === "service" && (
            <TabButton active={tab === "inbox"} onClick={() => setTab("inbox")} icon={<Inbox size={11} />} label="Inbox" count={pendingCount} />
          )}
          <TabButton active={tab === "leads"} onClick={() => setTab("leads")} icon={<Users size={11} />} label="Leads" count={leads.length} />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {tab === "inbox" ? (
          items.length === 0 ? (
            <EmptyState />
          ) : (
            items.map(item =>
              isQuote(item) ? (
                <QuoteCard key={item.id} quote={item} onApprove={onApproveQuote} onReject={onRejectQuote} />
              ) : (
                <EscalationCard key={item.id} escalation={item} onAnswer={onAnswerEscalation} />
              )
            )
          )
        ) : ranked.length === 0 ? (
          <EmptyLeads />
        ) : (
          ranked.map(lead => (
            <LeadPanel key={lead.sessionId} lead={lead} isYou={lead.sessionId === mySessionId} />
          ))
        )}
      </div>
    </aside>
  );
}

function TabButton({
  active, onClick, icon, label, count,
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count: number;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors"
      style={{
        background: active ? "var(--surface-2)" : "transparent",
        color: active ? "var(--text)" : "var(--text-muted)",
        border: `1px solid ${active ? "var(--border)" : "transparent"}`,
      }}
    >
      {icon}
      {label}
      {count > 0 && <span style={{ opacity: 0.6 }}>{count}</span>}
    </button>
  );
}

function EmptyLeads() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-10 gap-2">
      <Users size={22} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
      <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>No visitors yet</p>
      <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
        Every customer who chats appears here, scored on how close they are to
        buying, with what they asked about.
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-10 gap-2">
      <Inbox size={22} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
      <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Nothing waiting</p>
      <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
        Quotes the agent builds, and questions it cannot answer, arrive here for
        you to approve before the customer sees them.
      </p>
    </div>
  );
}

function QuoteCard({
  quote,
  onApprove,
  onReject,
}: {
  quote: Quote;
  onApprove: (id: string, total: number) => void;
  onReject: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(quote.total.toFixed(2));

  const pending = quote.status === "pending";
  const statusColor =
    quote.status === "approved" ? "var(--green)"
    : quote.status === "rejected" ? "var(--red)"
    : "var(--amber)";
  const statusBg =
    quote.status === "approved" ? "var(--green-dim)"
    : quote.status === "rejected" ? "#ef444422"
    : "var(--amber-dim)";

  const commit = () => {
    const parsed = parseFloat(draft);
    if (!isNaN(parsed) && parsed >= 0) {
      onApprove(quote.id, parsed);
    }
  };

  return (
    <div
      className="rounded-lg p-3 flex flex-col gap-2.5"
      style={{
        background: "var(--surface-2)",
        border: `1px solid ${pending ? "var(--amber)" : "var(--border)"}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ReceiptText size={11} style={{ color: "var(--amber)" }} />
          <span className="text-[10px] font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>
            QUOTE
          </span>
        </div>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full"
          style={{ background: statusBg, color: statusColor }}
        >
          {quote.status}
        </span>
      </div>

      <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>{quote.serviceName}</p>

      {Object.keys(quote.answers).length > 0 && (
        <div className="flex flex-col gap-0.5">
          {Object.entries(quote.answers).map(([q, a]) => (
            <p key={q} className="text-[10px] leading-snug" style={{ color: "var(--text-muted)" }}>
              <span style={{ opacity: 0.65 }}>{q}</span> {a}
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
        {quote.lines.map((line, i) => (
          <div key={i} className="flex items-center justify-between text-[11px]">
            <span style={{ color: "var(--text-muted)" }}>{line.label}</span>
            <span style={{ color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
              {formatGBP(line.amount)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1.5" style={{ borderTop: "1px solid var(--border)" }}>
        <span className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>Total</span>
        {editing ? (
          <div className="flex items-center gap-1">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>£</span>
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") commit(); }}
              className="w-16 rounded px-1.5 py-0.5 text-xs outline-none text-right"
              style={{ background: "var(--background)", border: "1px solid var(--accent)", color: "var(--text)" }}
              autoFocus
            />
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            {quote.originalTotal !== undefined && quote.originalTotal !== quote.total && (
              <span className="text-[10px]" style={{ color: "var(--text-muted)", textDecoration: "line-through" }}>
                {formatGBP(quote.originalTotal)}
              </span>
            )}
            <span className="text-sm font-bold" style={{ color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
              {formatGBP(quote.total)}
            </span>
            {pending && (
              <button
                onClick={() => { setDraft(quote.total.toFixed(2)); setEditing(true); }}
                className="p-0.5 rounded transition-opacity hover:opacity-70"
                title="Change the price"
              >
                <Pencil size={10} style={{ color: "var(--text-muted)" }} />
              </button>
            )}
          </div>
        )}
      </div>

      {quote.notes && (
        <p className="text-[10px] italic leading-snug" style={{ color: "var(--text-muted)" }}>
          {quote.notes}
        </p>
      )}

      {pending && (
        <div className="flex gap-1.5">
          <button
            onClick={commit}
            className="flex-1 flex items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-medium transition-opacity hover:opacity-85"
            style={{ background: "var(--green)", color: "#07140c" }}
          >
            <Check size={11} />
            {editing ? "Approve at this price" : "Approve & send"}
          </button>
          {!editing && (
            <button
              onClick={() => onReject(quote.id)}
              className="px-2.5 rounded-md transition-opacity hover:opacity-70"
              style={{ background: "var(--background)", border: "1px solid var(--border)" }}
              title="Reject"
            >
              <X size={12} style={{ color: "var(--text-muted)" }} />
            </button>
          )}
        </div>
      )}

      {quote.status === "approved" && (
        <p className="text-[10px] flex items-center gap-1" style={{ color: "var(--green)" }}>
          <Check size={10} /> Sent to the customer
        </p>
      )}
      {quote.status === "rejected" && (
        <p className="text-[10px] flex items-center gap-1" style={{ color: "var(--red)" }}>
          <X size={10} /> Declined — customer told you will follow up
        </p>
      )}
    </div>
  );
}

function EscalationCard({
  escalation,
  onAnswer,
}: {
  escalation: Escalation;
  onAnswer: (id: string, reply: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const open = escalation.status === "unanswered";

  return (
    <div
      className="rounded-lg p-3 flex flex-col gap-2"
      style={{
        background: "var(--surface-2)",
        border: `1px solid ${open ? "#6c63ff66" : "var(--border)"}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <AlertTriangle size={11} style={{ color: "var(--accent)" }} />
          <span className="text-[10px] font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>
            ESCALATION
          </span>
        </div>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full"
          style={{
            background: open ? "var(--accent-dim)" : "var(--green-dim)",
            color: open ? "var(--accent)" : "var(--green)",
          }}
        >
          {open ? "needs you" : "answered"}
        </span>
      </div>

      <p className="text-xs leading-snug" style={{ color: "var(--text)" }}>
        &ldquo;{escalation.question}&rdquo;
      </p>

      <p className="text-[10px] leading-snug" style={{ color: "var(--text-muted)" }}>
        Agent could not answer: {escalation.reason}
      </p>

      {open ? (
        <div className="flex gap-1.5">
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && draft.trim()) onAnswer(escalation.id, draft.trim()); }}
            placeholder="Your answer to the customer…"
            className="flex-1 min-w-0 rounded-md px-2 py-1.5 text-[11px] outline-none"
            style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
          <button
            onClick={() => draft.trim() && onAnswer(escalation.id, draft.trim())}
            disabled={!draft.trim()}
            className="px-2 rounded-md flex items-center justify-center transition-opacity"
            style={{ background: "var(--accent)", opacity: draft.trim() ? 1 : 0.4 }}
          >
            <Send size={11} color="#fff" />
          </button>
        </div>
      ) : (
        <p className="text-[10px] leading-snug pt-1" style={{ color: "var(--green)", borderTop: "1px solid var(--border)" }}>
          You replied: {escalation.ownerReply}
        </p>
      )}
    </div>
  );
}
