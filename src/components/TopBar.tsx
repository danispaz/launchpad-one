import { Search, Bell, Plus, Command, UserCircle, Settings, LogOut } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopBar({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  const { user } = useAuth();
  const [initials, setInitials] = useState("??");

  useEffect(() => {
    if (!user) return;
    async function fetchProfile() {
      const { data } = await supabase
        .from("profiles")
        .select("nome")
        .eq("id", user?.id)
        .single();
      if (data?.nome) {
        setInitials(data.nome.substring(0, 2).toUpperCase());
      } else if (user?.email) {
        setInitials(user.email.substring(0, 2).toUpperCase());
      }
    }
    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 rounded-full bg-surface-elevated flex items-center justify-center text-[10px] font-bold hover:opacity-80 transition-opacity ml-1">
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                  <UserCircle className="h-4 w-4" />
                  <span>Meu perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  <span>Configurações</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-rose-500 focus:text-rose-500">
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
