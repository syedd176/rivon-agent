export type LeadStage = "browsing" | "comparing" | "intent" | "qualified" | "ready";

export interface LeadSignal {
  label: string;
  /** Positive signals push the score up; negative ones hold it down. */
  positive: boolean;
}

export interface Lead {
  sessionId: string;
  bizId: string;
  mode: "product" | "service";
  /** 0–100. Recomputed by the model on every customer turn. */
  score: number;
  stage: LeadStage;
  /** What the customer is actually after, in their terms. */
  interest: string;
  /** Items or services they have engaged with by name. */
  mentionedItems: string[];
  /** Facts worth keeping: postcode, timing, budget, property size. */
  facts: Record<string, string>;
  signals: LeadSignal[];
  messageCount: number;
  firstSeen: number;
  lastSeen: number;
}

export const STAGE_ORDER: LeadStage[] = ["browsing", "comparing", "intent", "qualified", "ready"];

export const STAGE_LABEL: Record<LeadStage, string> = {
  browsing: "Browsing",
  comparing: "Comparing",
  intent: "Showing intent",
  qualified: "Qualified",
  ready: "Ready to buy",
};

export function scoreColor(score: number): string {
  if (score >= 70) return "var(--green)";
  if (score >= 40) return "var(--amber)";
  return "var(--text-muted)";
}

export function scoreBg(score: number): string {
  if (score >= 70) return "var(--green-dim)";
  if (score >= 40) return "var(--amber-dim)";
  return "var(--surface-2)";
}

/** A lead with nothing in it yet, so the sidebar has something to render. */
export function emptyLead(sessionId: string, bizId: string, mode: "product" | "service"): Lead {
  const now = Date.now();
  return {
    sessionId,
    bizId,
    mode,
    score: 0,
    stage: "browsing",
    interest: "",
    mentionedItems: [],
    facts: {},
    signals: [],
    messageCount: 0,
    firstSeen: now,
    lastSeen: now,
  };
}
