"use client";

import { CheckCircle2, Circle, Loader2, Search, Cpu, DollarSign, MessageSquare, AlertTriangle } from "lucide-react";

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
  matching: Search,
  pricing: DollarSign,
  responding: MessageSquare,
  escalating: AlertTriangle,
};

export function AgentSteps({ steps }: { steps: Step[] }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 mb-3">
      {steps.map((step) => {
        const Icon = ICONS[step.type] ?? Circle;
        return (
          <div
            key={step.id}
            className="flex items-start gap-2 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            <span className="mt-0.5 flex-shrink-0">
              {step.status === "running" ? (
                <Loader2 size={12} className="animate-spin" style={{ color: "var(--accent)" }} />
              ) : step.status === "error" ? (
                <AlertTriangle size={12} style={{ color: "var(--red)" }} />
              ) : (
                <CheckCircle2 size={12} style={{ color: "var(--green)" }} />
              )}
            </span>
            <span>
              <Icon size={10} className="inline mr-1 opacity-60" />
              {step.label}
              {step.detail && (
                <span className="ml-1 opacity-50">— {step.detail}</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
