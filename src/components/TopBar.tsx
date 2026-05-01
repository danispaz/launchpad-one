import { Search, Bell, Plus, Command } from "lucide-react";

export function TopBar({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="h-14 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10 flex items-center justify-between px-6">
      <div>
        <h1 className="text-sm font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            placeholder="Buscar lançamentos, atividades…"
            className="h-8 w-72 rounded-md bg-surface pl-8 pr-14 text-xs placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <kbd className="absolute right-2 flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>
        <button className="h-8 w-8 rounded-md border border-border bg-surface hover:bg-surface-elevated flex items-center justify-center">
          <Bell className="h-4 w-4 text-muted-foreground" />
        </button>
        {actions ?? (
          <button className="h-8 inline-flex items-center gap-1.5 rounded-md bg-gradient-primary px-3 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90">
            <Plus className="h-3.5 w-3.5" /> Novo lançamento
          </button>
        )}
        <div className="ml-1 h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-[11px] font-semibold text-primary-foreground">
          MR
        </div>
      </div>
    </div>
  );
}
