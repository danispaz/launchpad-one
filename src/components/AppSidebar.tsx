import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard, Rocket, Map, Users, AlertTriangle, Settings, ChevronRight, Package, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const items = [
  { title: "Visão geral", url: "/", icon: LayoutDashboard },
  { title: "Produtos", url: "/products", icon: Package },
  { title: "Lançamentos", url: "/launches", icon: Rocket },
  { title: "Roadmap", url: "/roadmap", icon: Map },
  { title: "Times", url: "/teams", icon: Users },
  { title: "Riscos", url: "/risks", icon: AlertTriangle },
  { title: "Configurações", url: "/settings", icon: Settings, requiredRoles: ["executive"] },
];

export function AppSidebar() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    async function fetchRole() {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user?.id)
        .single();
      setUserRole(data?.role || null);
    }
    fetchRole();
  }, [user]);

  const visibleItems = items.filter((item: any) => {
    if (!item.requiredRoles) return true;
    return userRole && item.requiredRoles.includes(userRole);
  });

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <aside className="w-60 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col">
      <div className="h-14 flex items-center gap-2 px-4">
        <div className="h-6 w-6 rounded bg-foreground flex items-center justify-center">
          <span className="text-[10px] font-bold text-background">LH</span>
        </div>
        <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">LaunchHub</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleItems.map((item) => {
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
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.title}</span>
              {active && <ChevronRight className="h-3 w-3 opacity-50" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-sidebar-accent/60 cursor-pointer transition-colors">
              <div className="h-6 w-6 rounded-full bg-surface-elevated flex items-center justify-center text-[10px] font-bold">
                {user?.email ? user.email.substring(0, 2).toUpperCase() : '??'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user?.email ? user.email.split('@')[0] : 'Usuário'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email || 'Desconectado'}</p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuItem asChild>
              <Link to="/profile">Meu perfil</Link>
            </DropdownMenuItem>
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
