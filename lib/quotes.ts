export type QuoteStatus = "pending" | "approved" | "rejected";
export type EscalationStatus = "unanswered" | "answered";

export interface QuoteLine {
  label: string;
  amount: number;
}

export interface Quote {
  id: string;
  kind: "quote";
  bizId: string;
  serviceName: string;
  /** What the customer told us, as question → answer. */
  answers: Record<string, string>;
  lines: QuoteLine[];
  /** Total the agent computed from the rate card. The owner may change it. */
  total: number;
  /** Set when the owner edits the price, so the original stays visible. */
  originalTotal?: number;
  notes?: string;
  status: QuoteStatus;
  createdAt: number;
  resolvedAt?: number;
}

export interface Escalation {
  id: string;
  kind: "escalation";
  bizId: string;
  /** The customer's question, verbatim. */
  question: string;
  /** Why the agent could not answer it. */
  reason: string;
  ownerReply?: string;
  status: EscalationStatus;
  createdAt: number;
  resolvedAt?: number;
}

export type InboxItem = Quote | Escalation;

export function isQuote(item: InboxItem): item is Quote {
  return item.kind === "quote";
}

export function formatGBP(n: number): string {
  return "£" + n.toFixed(2);
}
