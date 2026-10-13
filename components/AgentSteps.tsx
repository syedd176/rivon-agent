"use client";

import { CheckCircle2, Circle, Loader2, Search, Cpu, Target, DollarSign, MessageSquare, AlertTriangle, ClipboardList } from "lucide-react";

export type Step = {
  id: string;
  type: string;
  label: string;
  detail?: string;
  status: "running" | "done" | "error";
};

const ICONS: Record<string, React.ElementType> = {
  thinking: Cpu,
  searching: Search,
  matching: Target,
  qualifying: ClipboardList,
  pricing: DollarSign,
  responding: MessageSquare,
  escalating: AlertTriangle,
};

export function AgentSteps({ steps }: { steps: Step[] }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {steps.map(step => {
        const Icon = ICONS[step.type] ?? Circle;
        return (
          <div key={step.id} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
            <span className="mt-0.5 flex-shrink-0">
              {step.status === "running" ? (
                <Loader2 size={11} className="animate-spin" style={{ color: "var(--accent)" }} />
              ) : step.status === "error" ? (
                <AlertTriangle size={11} style={{ color: "var(--red)" }} />
              ) : (
                <CheckCircle2 size={11} style={{ color: "var(--green)" }} />
              )}
            </span>
            <span className="flex items-start gap-1.5 min-w-0">
              <Icon size={10} className="flex-shrink-0 mt-0.5 opacity-55" />
              <span>
                {step.label}
                {step.detail && <span className="opacity-55"> — {step.detail}</span>}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
