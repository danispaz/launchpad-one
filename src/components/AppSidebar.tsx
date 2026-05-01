import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Rocket, Map, Users, AlertTriangle, Settings, ChevronRight } from "lucide-react";

const items = [
  { title: "Visão geral", url: "/", icon: LayoutDashboard, emoji: "📊" },
  { title: "Lançamentos", url: "/launches", icon: Rocket, emoji: "🚀" },
  { title: "Roadmap", url: "/roadmap", icon: Map, emoji: "🗓️" },
  { title: "Times", url: "/teams", icon: Users, emoji: "👥" },
  { title: "Riscos", url: "/risks", icon: AlertTriangle, emoji: "⚠️" },
  { title: "Configurações", url: "/settings", icon: Settings, emoji: "⚙️" },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  return (
    <aside className="w-60 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col">
      <div className="h-14 flex items-center gap-2 px-4">
        <div className="h-6 w-6 rounded bg-foreground flex items-center justify-center">
          <span className="text-[10px] font-bold text-background">LH</span>
        </div>
        <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">LaunchHub</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {items.map((item) => {
          const active = isActive(item.url);
          return (
            <Link
              key={item.url}
              to={item.url}
              className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
              }`}
            >
              <span className="w-4 flex justify-center text-xs">{item.emoji}</span>
              <span className="flex-1">{item.title}</span>
              {active && <ChevronRight className="h-3 w-3 opacity-50" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-sidebar-accent/60 cursor-pointer transition-colors">
          <div className="h-6 w-6 rounded-full bg-surface-elevated flex items-center justify-center text-[10px] font-bold">
            MR
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">Marina Reis</p>
            <p className="text-[10px] text-muted-foreground truncate">Plano Pro</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
