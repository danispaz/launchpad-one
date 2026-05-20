import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { useLaunches } from "@/hooks/useLaunches";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Search, Trash2, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { NewLaunchSheet } from "@/components/launches/NewLaunchSheet";
import { useLaunchMutations } from "@/hooks/useLaunchMutations";
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

const STATUS_LABELS: Record<string, string> = {
  "em_andamento": "Ativo",
  "planejamento": "Planejamento",
  "em_risco": "Em risco",
  "atrasado": "Atrasado",
  "concluido": "Concluído",
};

const STATUS_COLORS: Record<string, string> = {
  "em_andamento": "bg-emerald-100 text-emerald-700",
  "planejamento": "bg-blue-100 text-blue-700",
  "em_risco": "bg-orange-100 text-orange-700",
  "atrasado": "bg-rose-100 text-rose-700",
  "concluido": "bg-slate-100 text-slate-500",
};

const PRIORIDADE_COLORS: Record<string, string> = {
  "crítica": "bg-rose-100 text-rose-700",
  "alta": "bg-orange-100 text-orange-700",
  "média": "bg-yellow-100 text-yellow-600",
  "baixa": "bg-slate-100 text-slate-500",
};

type TabType = "lista" | "arquivados";

export const Route = createFileRoute("/launches/")({
  component: LaunchesList,
});

function LaunchesList() {
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [launchToDelete, setLaunchToDelete] = useState<string | null>(null);
  const [tab, setTab] = useState<TabType>("lista");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { deleteLaunch } = useLaunchMutations();
  const { launches, loading } = useLaunches();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("role").eq("id", user.id).single()
      .then(({ data }) => setUserRole(data?.role || null));
  }, [user]);

  const canDelete = userRole === "executive" || userRole === "product";

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const isOverdue = (dateStr: string | null) => {
    if (!dateStr) return false;
    const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
    return d.getTime() < today.getTime();
  };

  const getDaysLeft = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
    const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const filtered = (launches || []).filter(l => {
    const isArchived = l.status === "concluido";
    if (tab === "arquivados") return isArchived;
    if (tab === "lista") {
      if (isArchived) return false;
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (search && !l.nome.toLowerCase().includes(search.toLowerCase()) && !(l.produto || "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }
    return true;
  });

  const handleConfirmDelete = async () => {
    if (!launchToDelete) return;
    try {
      await deleteLaunch(launchToDelete);
      setLaunchToDelete(null);
      window.location.reload();
    } catch { setLaunchToDelete(null); }
  };

  if (loading) return (
    <AppLayout>
      <TopBar title="Projetos" subtitle="Base de dados central" />
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <TopBar
        title="Projetos"
        subtitle="Base de dados central"
        actions={
          <button onClick={() => setIsNewOpen(true)} className="h-8 px-4 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5">
            + Criar
          </button>
        }
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Abas */}
        <div className="flex items-center gap-0 border-b border-slate-200 px-6 bg-white shrink-0">
          {(["lista", "arquivados"] as TabType[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-all capitalize ${tab === t ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
              {t === "lista" ? "Lista" : "Arquivados"}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        {tab === "lista" && (
          <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-white shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Pesquisar..."
                className="pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-400 focus:bg-white transition-all w-56 placeholder:text-slate-400" />
            </div>

            <div className="flex items-center gap-1">
              {[
                { key: "all", label: "Todos" },
                { key: "em_andamento", label: "Ativo" },
                { key: "planejamento", label: "Planejamento" },
                { key: "em_risco", label: "Em risco" },
                { key: "atrasado", label: "Atrasado" },
              ].map(f => (
                <button key={f.key} onClick={() => setStatusFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === f.key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"}`}>
                  {f.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-400 ml-auto">{filtered.length} Projetos{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        )}

        {/* Tabela */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white border-b border-slate-200 z-10">
              <tr>
                <th className="text-left px-6 py-3 w-8">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Projeto</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Produto</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Data de início</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Antes da data de término</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Prioridade</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Gerente</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-16 text-sm text-slate-300">Nenhum projeto encontrado</td></tr>
              ) : filtered.map(l => {
                const daysLeft = getDaysLeft(l.data_lancamento_prevista);
                const overdue = isOverdue(l.data_lancamento_prevista);
                return (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-3">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <Link to="/launches/$id" params={{ id: l.id }}
                        className="font-semibold text-slate-800 hover:text-slate-900 transition-colors">
                        {l.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${STATUS_COLORS[l.status] || "bg-slate-100 text-slate-500"}`}>
                        {STATUS_LABELS[l.status] || l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">{l.produto || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">{formatDate(l.data_lancamento_prevista)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {daysLeft !== null ? (
                        <span className={`text-xs font-medium ${overdue ? "text-rose-500" : daysLeft <= 7 ? "text-amber-500" : "text-slate-500"}`}>
                          {overdue ? `${Math.abs(daysLeft)} dias atrás` : daysLeft === 0 ? "Hoje" : `${daysLeft} dias`}
                        </span>
                      ) : <span className="text-xs text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${PRIORIDADE_COLORS[l.prioridade] || "bg-slate-100 text-slate-500"}`}>
                        {l.prioridade}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500">
                          {l.owner?.initials || "??"}
                        </div>
                        <span className="text-xs text-slate-500 truncate max-w-[100px]">{l.owner?.nome || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canDelete && (
                          <button onClick={e => { e.preventDefault(); setLaunchToDelete(l.id); }}
                            className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <Link to="/launches/$id" params={{ id: l.id }}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <NewLaunchSheet open={isNewOpen} onOpenChange={setIsNewOpen} />

      <AlertDialog open={!!launchToDelete} onOpenChange={open => !open && setLaunchToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar projeto</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza? Todas as tarefas, marcos e riscos associados serão removidos. Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-rose-500 hover:bg-rose-600">Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
