import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ROLES: Record<string, string> = {
  executive: "Executivo",
  product: "Produto",
  marketing: "Marketing",
  sales: "Vendas",
  engineering: "Engenharia",
  viewer: "Visualizador",
};

const TEAMS: Record<string, string> = {
  marketing: "Marketing",
  sales: "Vendas",
  engineering: "Engenharia",
  product: "Produto",
  executive: "Diretoria",
};

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Meu Perfil — LaunchHub" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [team, setTeam] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function fetchProfile() {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();
      if (error) {
        toast.error("Erro ao carregar perfil", { description: error.message });
      } else {
        setNome(data.nome || "");
        setEmail(data.email || "");
        setRole(data.role || "");
        setTeam(data.team || "");
      }
      setLoading(false);
    }
    fetchProfile();
  }, [user]);

  const handleSaveNome = async () => {
    if (!nome.trim()) {
      toast.error("O nome não pode estar vazio");
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ nome })
        .eq("id", user?.id);
      if (error) {
        toast.error("Erro ao salvar nome", { description: error.message });
      } else {
        toast.success("Nome atualizado com sucesso");
      }
    } catch (err: any) {
      toast.error("Erro ao salvar nome", { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Preencha os dois campos");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A senha precisa ter no mínimo 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error("Erro ao alterar senha", { description: error.message });
      } else {
        toast.success("Senha alterada com sucesso");
        setIsPasswordOpen(false);
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      toast.error("Erro ao alterar senha", { description: err.message });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <TopBar title="Meu Perfil" subtitle="Suas informações de conta" />
        <div className="flex items-center justify-center h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <TopBar title="Meu Perfil" subtitle="Suas informações de conta" />
      <div className="flex-1 px-8 py-10 max-w-[640px] mx-auto w-full space-y-6">

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-500">
            {nome ? nome[0].toUpperCase() : "?"}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{nome || "—"}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
        </div>

        {/* Card nome */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Informações pessoais</h2>
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome completo"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} disabled className="bg-slate-50 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">O email não pode ser alterado aqui.</p>
          </div>
          <Button onClick={handleSaveNome} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar nome"}
          </Button>
        </div>

        {/* Card role/team (read-only) */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Cargo e time</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Role</p>
              <p className="text-sm font-medium">{ROLES[role] || role || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Time</p>
              <p className="text-sm font-medium">{TEAMS[team] || team || "—"}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Role e time só podem ser alterados por um administrador.</p>
        </div>

        {/* Card senha */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Segurança</h2>
          <p className="text-sm text-muted-foreground">Altere sua senha de acesso ao LaunchHub.</p>
          <Button variant="outline" onClick={() => setIsPasswordOpen(true)}>
            Alterar senha
          </Button>
        </div>

      </div>

      {/* Modal trocar senha */}
      <Dialog open={isPasswordOpen} onOpenChange={(open) => { setIsPasswordOpen(open); if (!open) { setNewPassword(""); setConfirmPassword(""); } }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Alterar senha</DialogTitle>
            <DialogDescription>Digite a nova senha duas vezes para confirmar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova senha</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordOpen(false)} disabled={isChangingPassword}>Cancelar</Button>
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>{isChangingPassword ? "Salvando..." : "Alterar senha"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
