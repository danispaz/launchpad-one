import { statusMeta, teams, type LaunchStatus, type TeamKey, type Priority } from "@/lib/mockData";

const toneStyles: Record<string, string> = {
  primary: "bg-surface-elevated text-foreground border-border",
  success: "bg-success/20 text-success-foreground border-success/30",
  warning: "bg-warning/20 text-warning-foreground border-warning/30",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  info: "bg-info/20 text-info-foreground border-info/30",
};

export function StatusBadge({ status }: { status: LaunchStatus }) {
  const meta = statusMeta[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium ${toneStyles[meta.tone]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {meta.label}
    </span>
  );
}

export function TeamChip({ team }: { team: TeamKey }) {
  const t = teams[team];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
      style={{ backgroundColor: t.color + "40" }} // Add some transparency to the team color variable
      title={t.label}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.color }} />
      {t.label}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: Priority }) {
  const map = {
    low: "bg-muted-foreground/30",
    medium: "bg-info-foreground",
    high: "bg-warning-foreground",
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
    <div className="h-2 w-full rounded-full bg-surface-elevated overflow-hidden border border-border/50">
      <div className="h-full bg-foreground/80 rounded-full transition-all" style={{ width: `${value}%` }} />
    </div>
  );
}

export function Avatar({ initials }: { initials: string }) {
  return (
    <div className="h-6 w-6 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-[10px] font-semibold text-foreground/70">
      {initials}
    </div>
  );
}
