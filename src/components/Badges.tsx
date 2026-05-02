import { type LaunchStatus, type TeamName, type PriorityLevel, statusStyles, teamStyles } from "@/lib/utils/formatters";

const toneStyles: Record<string, string> = {
  primary: "bg-surface-elevated text-foreground border-border",
  success: "bg-success/20 text-success-foreground border-success/30",
  warning: "bg-warning/20 text-warning-foreground border-warning/30",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  info: "bg-info/20 text-info-foreground border-info/30",
};

export function StatusBadge({ status }: { status: LaunchStatus }) {
  const meta = statusStyles[status] || statusStyles['planejamento'];
  
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium ${toneStyles[meta.tone] || toneStyles.info}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {meta.label}
    </span>
  );
}

export function TeamChip({ team }: { team: string }) {
  const mapping: Record<string, TeamName> = {
    'marketing': 'marketing',
    'sales': 'sales',
    'vendas': 'sales',
    'engineering': 'engineering',
    'dev': 'engineering',
    'desenvolvimento': 'engineering',
    'product': 'product',
    'produto': 'product',
    'executive': 'executive',
    'diretoria': 'executive',
    'exec': 'executive'
  };

  const normalizedTeam = mapping[team.toLowerCase()] || 'product';
  const t = teamStyles[normalizedTeam];
  
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
      style={{ backgroundColor: t?.color ? t.color + "40" : "transparent" }}
      title={t?.label || team}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t?.color || "currentColor" }} />
      {t?.label || team}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: string }) {
  const mapping: Record<string, PriorityLevel> = {
    'baixa': 'baixa',
    'low': 'baixa',
    'média': 'media',
    'médio': 'media',
    'medium': 'media',
    'media': 'media',
    'alta': 'alta',
    'high': 'alta',
    'crítica': 'critica',
    'critica': 'critica',
    'critical': 'critica'
  };

  const normalizedPriority = mapping[priority.toLowerCase()] || 'media';
  
  const map = {
    baixa: "bg-muted-foreground/30",
    media: "bg-info-foreground",
    alta: "bg-warning-foreground",
    critica: "bg-destructive",
  } as const;
  
  const labels = { baixa: "Baixa", media: "Média", alta: "Alta", critica: "Crítica" } as const;
  
  const currentClass = map[normalizedPriority];
  const currentLabel = labels[normalizedPriority];

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground" title={currentLabel}>
      <span className={`h-2 w-2 rounded-full ${currentClass}`} />
      {currentLabel}
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
