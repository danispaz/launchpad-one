import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePermissions } from "@/lib/usePermissions";
import { 
  LayoutDashboard, Rocket, Users, Settings, ChevronRight, 
  ChevronLeft, Package, LogOut, CheckSquare, Megaphone, ShieldCheck 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mainItems = [
  { title: "Visão geral", url: "/", icon: LayoutDashboard, resource: "dashboard" },
  { title: "Produtos", url: "/products", icon: Package, resource: "produtos" },
  { title: "Projetos", url: "/launches", icon: Rocket, resource: "projetos" },
  { title: "Tarefas", url: "/tasks", icon: CheckSquare, resource: "tarefas" },
  { title: "Marketing", url: "/marketing", icon: Megaphone, resource: "marketing", isGroup: true, subitems: [
    { title: "Conteúdo", resource: "marketing_conteudo" },
    { title: "Campanhas", resource: "marketing_campanhas" },
    { title: "Influenciadores", resource: "marketing_influenciadores" }
  ]},
  { title: "Times", url: "/teams", icon: Users, resource: "times" },
  { title: "Configurações", url: "/settings", icon: Settings, resource: "configuracoes" },
  { title: "Permissões", url: "/permissoes", icon: ShieldCheck, resource: "permissoes" },
];

export function AppSidebar() {
  const { user } = useAuth();
  const { can, loading } = usePermissions();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = mainItems.filter(item => {
    if (item.isGroup && item.subitems) {
      return item.subitems.some(sub => can(sub.resource, "ver"));
    }
    return can(item.resource, "ver");
  });

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <aside className={`${collapsed ? "w-14" : "w-60"} shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col transition-all duration-200`}>
      <div className="h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-6 w-6 rounded bg-foreground flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-background">LH</span>
          </div>
          {!collapsed && <span className="text-sm font-semibold tracking-tight text-sidebar-foreground truncate">LaunchHub</span>}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-6 w-6 rounded flex items-center justify-center hover:bg-sidebar-accent/60 transition-colors shrink-0"
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5 text-sidebar-foreground/60" /> : <ChevronLeft className="h-3.5 w-3.5 text-sidebar-foreground/60" />}
        </button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {!loading && visibleItems.map((item) => {
          const active = isActive(item.url || "");
          return (
            <Link
              key={item.url || item.title}
              to={item.url}
              title={collapsed ? item.title : undefined}
              className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="flex-1">{item.title}</span>}
              {!collapsed && active && <ChevronRight className="h-3 w-3 opacity-50" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-sidebar-accent/60 cursor-pointer transition-colors ${collapsed ? "justify-center" : ""}`}>
              <div className="h-6 w-6 rounded-full bg-surface-elevated flex items-center justify-center text-[10px] font-bold shrink-0">
                {user?.email ? user.email.substring(0, 2).toUpperCase() : '??'}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{user?.email ? user.email.split('@')[0] : 'Usuário'}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email || 'Desconectado'}</p>
                </div>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
