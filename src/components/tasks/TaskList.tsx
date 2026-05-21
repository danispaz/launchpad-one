import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { TaskSheet } from "@/components/launches/TaskSheet";

interface Task {
  id: string;
  titulo: string;
  status: string;
  team: string | null;
  data_entrega: string | null;
  data_inicio: string | null;
  launch_id: string;
  assignee_id: string | null;
  prioridade: string;
  colaboradores?: string[];
  descricao?: string | null;
  seguidores?: string[];
  checklist?: any[];
  precisa_aprovacao?: boolean;
  anexos?: any[];
  created_at?: string;
  updated_at?: string;
  assignee?: { nome: string | null } | null;
  launch?: { nome: string } | null;
}

interface Launch { id: string; nome: string; }

interface Props {
  launches: Launch[];
  onRefresh?: () => void;
  filterTeam?: string;
  filterAssignee?: string;
  filterLaunch?: string;
  filterColaborador?: string;
}

const STATUS_LABELS: Record<string, string> = {
  "todo": "A fazer", "em_progresso": "Em progresso", "em_revisão": "Em revisão",
  "bloqueado": "Bloqueado", "concluído": "Concluído",
};

const STATUS_COLORS: Record<string, string> = {
  "todo": "bg-blue-100 text-blue-700", "em_progresso": "bg-yellow-100 text-yellow-700",
  "em_revisão": "bg-purple-100 text-purple-700", "bloqueado": "bg-red-100 text-red-700",
  "concluído": "bg-emerald-100 text-emerald-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  "crítica": "bg-rose-100 text-rose-700", "alta": "bg-orange-100 text-orange-700",
  "média": "bg-yellow-100 text-yellow-700", "baixa": "bg-slate-100 text-slate-500",
};

const TEAM_LABELS: Record<string, string> = {
  "marketing": "Marketing", "sales": "Vendas", "product": "Produto",
  "engineering": "Tecnologia", "executive": "Diretoria",
};

type SortField = "titulo" | "status" | "prioridade" | "team" | "assignee" | "data_inicio" | "data_entrega" | "launch";
type SortDir = "asc" | "desc";

const today = new Date(); today.setHours(0, 0, 0, 0);
function isOverdue(d: string | null) { if (!d) return false; const x = new Date(d); x.setHours(0,0,0,0); return x.getTime() < today.getTime(); }
function isToday(d: string | null) { if (!d) return false; const x = new Date(d); x.setHours(0,0,0,0); return x.getTime() === today.getTime(); }
function formatDate(d: string | null) {
  if (!d) return "—";
  if (isToday(d)) return "Hoje";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function TaskList({ launches, onRefresh, filterTeam, filterAssignee, filterLaunch, filterColaborador }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("data_entrega");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [search, setSearch] = useState("");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data: tasksRaw } = await supabase.from("tasks").select("*").order("created_at");
      const launchMap = Object.fromEntries(launches.map(l => [l.id, l]));
      const assigneeIds = [...new Set((tasksRaw || []).map((t: any) => t.assignee_id).filter(Boolean))];
      let profileMap: Record<string, { nome: string }> = {};
      if (assigneeIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, nome").in("id", assigneeIds);
        profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]));
      }
      setTasks((tasksRaw || []).map((t: any) => ({
        ...t,
        launch: launchMap[t.launch_id] || null,
        assignee: t.assignee_id ? profileMap[t.assignee_id] || null : null,
      })));
    } catch (err: any) {
      toast.error("Erro ao carregar tarefas", { description: err.message });
    } finally { setLoading(false); }
  }, [launches]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(prev => prev === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const sorted = [...tasks]
    .filter(t => {
      if (filterTeam && t.team !== filterTeam) return false;
      if (filterAssignee && t.assignee_id !== filterAssignee) return false;
      if (filterLaunch && t.launch_id !== filterLaunch) return false;
      if (filterColaborador && !(t.colaboradores || []).includes(filterColaborador)) return false;
      if (search && !t.titulo.toLowerCase().includes(search.toLowerCase()) && !t.launch?.nome?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let av = "", bv = "";
      if (sortField === "titulo") { av = a.titulo; bv = b.titulo; }
      else if (sortField === "status") { av = STATUS_LABELS[a.status] || ""; bv = STATUS_LABELS[b.status] || ""; }
      else if (sortField === "prioridade") { const order = ["crítica","alta","média","baixa"]; av = String(order.indexOf(a.prioridade)); bv = String(order.indexOf(b.prioridade)); }
      else if (sortField === "team") { av = TEAM_LABELS[a.team || ""] || ""; bv = TEAM_LABELS[b.team || ""] || ""; }
      else if (sortField === "assignee") { av = a.assignee?.nome || ""; bv = b.assignee?.nome || ""; }
      else if (sortField === "data_inicio") { av = a.data_inicio || ""; bv = b.data_inicio || ""; }
      else if (sortField === "data_entrega") { av = a.data_entrega || "9999"; bv = b.data_entrega || "9999"; }
      else if (sortField === "launch") { av = a.launch?.nome || ""; bv = b.launch?.nome || ""; }
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 text-slate-300" />;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-slate-600" /> : <ChevronDown className="w-3 h-3 text-slate-600" />;
  };

  const ThButton = ({ field, label }: { field: SortField; label: string }) => (
    <button onClick={() => handleSort(field)} className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
      {label} <SortIcon field={field} />
    </button>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-60">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-3 shrink-0">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Pesquisar tarefas..."
          className="w-64 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-slate-400 focus:bg-white transition-all placeholder:text-slate-400" />
        <span className="text-xs text-slate-400 ml-auto">{sorted.length} tarefa{sorted.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white border-b border-slate-200 z-10">
            <tr>
              <th className="text-left px-6 py-3 w-[280px]"><ThButton field="titulo" label="Nome" /></th>
              <th className="text-left px-4 py-3 w-[130px]"><ThButton field="status" label="Etapa" /></th>
              <th className="text-left px-4 py-3 w-[120px]"><ThButton field="prioridade" label="Prioridade" /></th>
              <th className="text-left px-4 py-3 w-[120px]"><ThButton field="team" label="Time" /></th>
              <th className="text-left px-4 py-3 w-[140px]"><ThButton field="assignee" label="Responsável" /></th>
              <th className="text-left px-4 py-3 w-[120px]"><ThButton field="data_inicio" label="Início" /></th>
              <th className="text-left px-4 py-3 w-[120px]"><ThButton field="data_entrega" label="Término" /></th>
              <th className="text-left px-4 py-3"><ThButton field="launch" label="Projeto" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-16 text-sm text-slate-300">Nenhuma tarefa encontrada</td></tr>
            ) : sorted.map(task => (
              <tr key={task.id} onClick={() => { setSelectedTask(task); setIsSheetOpen(true); }}
                className="hover:bg-slate-50 cursor-pointer transition-colors group">
                <td className="px-6 py-3">
                  <span className="font-medium text-slate-800 group-hover:text-slate-900 truncate block max-w-[260px]">{task.titulo}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${STATUS_COLORS[task.status] || "bg-slate-100 text-slate-500"}`}>
                    {STATUS_LABELS[task.status] || task.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${PRIORITY_COLORS[task.prioridade] || "bg-slate-100 text-slate-500"}`}>
                    {task.prioridade}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-slate-600">{TEAM_LABELS[task.team || ""] || "—"}</span>
                </td>
                <td className="px-4 py-3">
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500 shrink-0">
                        {task.assignee.nome?.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "??"}
                      </div>
                      <span className="text-xs text-slate-600 truncate max-w-[90px]">{task.assignee.nome}</span>
                    </div>
                  ) : <span className="text-xs text-slate-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-slate-500">{formatDate(task.data_inicio)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${isOverdue(task.data_entrega) && task.status !== "concluído" ? "text-rose-500" : isToday(task.data_entrega) ? "text-amber-500" : "text-slate-500"}`}>
                    {formatDate(task.data_entrega)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-slate-500 truncate max-w-[160px] block">{task.launch?.nome || "—"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TaskSheet
        open={isSheetOpen}
        onOpenChange={(open) => { setIsSheetOpen(open); if (!open) setSelectedTask(null); }}
        launchId={selectedTask?.launch_id || launches[0]?.id || ""}
        launches={launches}
        task={selectedTask}
        onSuccess={() => { fetchTasks(); onRefresh?.(); }}
      />
    </div>
  );
}
