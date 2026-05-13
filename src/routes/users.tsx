import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ROLES = [
  { value: "executive", label: "Executivo" },
  { value: "product", label: "Produto" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Vendas" },
  { value: "engineering", label: "Engenharia" },
  { value: "viewer", label: "Visualizador" },
];

const TEAMS = [
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Vendas" },
  { value: "engineering", label: "Engenharia" },
  { value: "product", label: "Produto" },
  { value: "executive", label: "Diretoria" },
];

interface Profile {
  id: string;
  nome: string | null;
  email: string | null;
  role: string;
  team: string | null;
}

export const Route = createFileRoute("/users")({
  head: () => ({ meta: [{ title: "Usuários — LaunchHub" }] }),
  component: UsersPage,
});

function UsersPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [formNome, setFormNome] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formTeam, setFormTeam] = useState("");

  useEffect(() => {
    fetchProfiles();
  }, []);

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

  async function fetchProfiles() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("nome", { ascending: true });
    if (error) {
      toast.error("Erro ao buscar usuários", { description: error.message });
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  }

  const canCreate = userRole === "executive";

  const handleSubmit = async () => {
    if (!formNome || !formEmail || !formPassword || !formRole || !formTeam) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (formPassword.length < 6) {
      toast.error("A senha precisa ter no mínimo 6 caracteres");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("bright-handler", {
        body: { email: formEmail, password: formPassword, nome: formNome, role: formRole, team: formTeam },
      });
      if (error) {
        toast.error("Erro ao criar usuário", { description: error.message });
      } else if (data?.error) {
        toast.error("Erro ao criar usuário", { description: data.error });
      } else {
        toast.success("Usuário criado com sucesso");
        setIsCreateOpen(false);
        setFormNome(""); setFormEmail(""); setFormPassword(""); setFormRole(""); setFormTeam("");
        fetchProfiles();
      }
    } catch (err: any) {
      toast.error("Erro ao criar usuário", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (profile: Profile) => {
    setEditingUser(profile);
    setFormNome(profile.nome || "");
    setFormEmail(profile.email || "");
    setFormPassword("");
    setFormRole(profile.role);
    setFormTeam(profile.team || "");
    setIsCreateOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingUser) return;
    if (!formNome || !formEmail || !formRole || !formTeam) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (formPassword && formPassword.length < 6) {
      toast.error("A senha precisa ter no mínimo 6 caracteres");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("bright-handler", {
        body: {
          action: "update",
          userId: editingUser.id,
          email: formEmail,
          password: formPassword || undefined,
          nome: formNome,
          role: formRole,
          team: formTeam,
        },
      });
      if (error) {
        toast.error("Erro ao atualizar usuário", { description: error.message });
      } else if (data?.error) {
        toast.error("Erro ao atualizar usuário", { description: data.error });
      } else {
        toast.success("Usuário atualizado com sucesso");
        setIsCreateOpen(false);
        setEditingUser(null);
        setFormNome(""); setFormEmail(""); setFormPassword(""); setFormRole(""); setFormTeam("");
        fetchProfiles();
      }
    } catch (err: any) {
      toast.error("Erro ao atualizar usuário", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const { data, error } = await supabase.functions.invoke("bright-handler", {
        body: { action: "delete", userId: userToDelete },
      });
      if (error || data?.error) {
        toast.error("Erro ao deletar usuário", { description: error?.message || data?.error });
      } else {
        toast.success("Usuário deletado");
        setUserToDelete(null);
        fetchProfiles();
      }
    } catch (err: any) {
      toast.error("Erro ao deletar usuário", { description: err.message });
    }
  };

  return (
    <AppLayout>
      <TopBar
        title="Usuários"
        subtitle="Gerencie os membros da equipe"
        actions={canCreate && (
          <button onClick={() => setIsCreateOpen(true)} className="h-8 px-3 rounded bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Convidar
          </button>
        )}
      />
      <div className="flex-1 px-8 py-10 max-w-[1200px] mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center h-[40vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="w-full overflow-x-auto bg-white rounded-xl border border-border shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border bg-slate-50/50 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                  <th className="px-6 py-4 text-left">Nome</th>
                  <th className="px-6 py-4 text-left">Email</th>
                  <th className="px-6 py-4 text-left">Role</th>
                  <th className="px-6 py-4 text-left">Time</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">{p.nome || "—"}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{p.email || "—"}</td>
                    <td className="px-6 py-4 text-xs uppercase font-bold">{ROLES.find((r) => r.value === p.role)?.label || p.role}</td>
                    <td className="px-6 py-4 text-xs uppercase font-bold">{TEAMS.find((t) => t.value === p.team)?.label || p.team || "—"}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(p)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors" title="Editar">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setUserToDelete(p.id)} className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors" title="Deletar">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {profiles.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground italic">Nenhum usuário cadastrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) { setEditingUser(null); setFormNome(""); setFormEmail(""); setFormPassword(""); setFormRole(""); setFormTeam(""); } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
            <DialogDescription>{editingUser ? "Edite os dados. Deixe a senha em branco pra manter a atual." : "Preencha os dados para criar uma conta de acesso."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label htmlFor="nome">Nome</Label><Input id="nome" value={formNome} onChange={(e) => setFormNome(e.target.value)} placeholder="Nome completo" /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@empresa.com" /></div>
            <div className="space-y-2"><Label htmlFor="password">{editingUser ? "Nova senha (opcional)" : "Senha"}</Label><Input id="password" type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder={editingUser ? "Deixe em branco pra manter" : "Mínimo 6 caracteres"} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="role">Role</Label><Select value={formRole} onValueChange={setFormRole}><SelectTrigger id="role"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="team">Time</Label><Select value={formTeam} onValueChange={setFormTeam}><SelectTrigger id="team"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{TEAMS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button onClick={editingUser ? handleUpdate : handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Salvando..." : (editingUser ? "Salvar alterações" : "Criar usuário")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este usuário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-rose-500 hover:bg-rose-600">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}