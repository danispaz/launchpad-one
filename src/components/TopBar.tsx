import { Search, Bell, Plus, Command } from "lucide-react";

export function TopBar({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="h-14 bg-background sticky top-0 z-10 flex items-center justify-between px-6 border-b border-border/40">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <>
            <span className="text-border">|</span>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden md:flex items-center group">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            placeholder="Buscar..."
            className="h-8 w-64 rounded-md bg-surface border border-border/60 pl-8 pr-12 text-xs placeholder:text-muted-foreground focus:outline-none focus:border-foreground/20 transition-colors"
          />
          <kbd className="absolute right-2 flex items-center gap-0.5 text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </div>
        <div className="flex items-center gap-1">
          <button className="h-8 w-8 rounded hover:bg-surface flex items-center justify-center transition-colors">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </button>
          {actions}
        </div>
      </div>
    </div>
  );
}
