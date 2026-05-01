import { statusMeta, teams, type LaunchStatus, type TeamKey, type Priority } from "@/lib/mockData";

const toneStyles: Record<string, string> = {
  primary: "bg-primary/15 text-primary border-primary/30",
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  destructive: "bg-destructive/15 text-destructive border-destructive/30",
  info: "bg-info/15 text-info border-info/30",
};

export function StatusBadge({ status }: { status: LaunchStatus }) {
  const meta = statusMeta[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${toneStyles[meta.tone]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}

export function TeamChip({ team }: { team: TeamKey }) {
  const t = teams[team];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-foreground/85"
      title={t.label}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.color }} />
      {t.label}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: Priority }) {
  const map = {
    low: "bg-muted-foreground/40",
    medium: "bg-info",
    high: "bg-warning",
    critical: "bg-destructive",
  } as const;
  const labels = { low: "Baixa", medium: "Média", high: "Alta", critical: "Crítica" } as const;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground" title={labels[priority]}>
      <span className={`h-2 w-2 rounded-full ${map[priority]}`} />
      {labels[priority]}
    </span>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-surface-elevated overflow-hidden">
      <div className="h-full bg-gradient-primary rounded-full transition-all" style={{ width: `${value}%` }} />
    </div>
  );
}

export function Avatar({ initials }: { initials: string }) {
  return (
    <div className="h-6 w-6 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-[10px] font-semibold text-foreground/85">
      {initials}
    </div>
  );
}
