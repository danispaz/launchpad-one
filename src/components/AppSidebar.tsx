import { Link, useRouterState } from "@tanstack/react-router";
import { Rocket, LayoutDashboard, Map, Users, AlertTriangle, Settings, Sparkles } from "lucide-react";

const items = [
  { title: "Visão geral", url: "/", icon: LayoutDashboard },
  { title: "Lançamentos", url: "/launches", icon: Rocket },
  { title: "Roadmap", url: "/roadmap", icon: Map },
  { title: "Times", url: "/teams", icon: Users },
  { title: "Riscos", url: "/risks", icon: AlertTriangle },
  { title: "Configurações", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  return (
    <aside className="w-60 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col">
      <div className="h-14 flex items-center gap-2 px-4 border-b border-sidebar-border">
        <div className="h-7 w-7 rounded-md bg-gradient-primary flex items-center justify-center shadow-glow">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">LaunchHub</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Acme Inc.</span>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Workspace</p>
        {items.map((item) => {
          const active = isActive(item.url);
          return (
            <Link
              key={item.url}
              to={item.url}
              className={`flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
        <p className="text-xs font-medium text-sidebar-foreground">Trial — 14 dias</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">Convide seu time e acompanhe lançamentos sem limites.</p>
        <button className="mt-2 w-full rounded-md bg-gradient-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90 transition">
          Fazer upgrade
        </button>
      </div>
    </aside>
  );
}
