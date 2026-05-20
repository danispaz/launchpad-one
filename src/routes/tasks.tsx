import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Calendar, CheckSquare, Square, Star, Sun, AlignLeft, Clock, Rocket, Copy, Trash2, ArrowRight, Download, X, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { TaskSheet } from "@/components/launches/TaskSheet";
import { TaskKanban } from "@/components/tasks/TaskKanban";
import { TaskGantt } from "@/components/tasks/TaskGantt";
import { TaskList } from "@/components/tasks/TaskList";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ title: "Tarefas — LaunchHub" }] }),
  component: TasksPage,
});

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
  descricao?: string | null;
  colaboradores?: string[];
  seguidores?: string[];
  checklist?: any[];
  precisa_aprovacao?: boolean;
  anexos?: any[];
  assignee?: { nome: string | null } | null;
  launch?: { nome: string } | null;
}

interface Launch { id: string; nome: string; }

type Filter = "all" | "today" | "tomorrow" | "no_date" | string;

const STATUSES = [
  { value: "todo", label: "A fazer" },
  { value: "em_progresso", label: "Em progresso" },
  { value: "em_revisão", label: "Em revisão" },
  { value: "bloqueado", label: "Bloqueado" },
  { value: "concluído", label: "Concluído" },
];

const PAGE_SIZE = 50;

const today = new Date(); today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

function isToday(d: string | null) { if (!d) return false; const x = new Date(d); x.setHours(0,0,0,0); return x.getTime() === today.getTime(); }
function isTomorrow(d: string | null) { if (!d) return false; const x = new Date(d); x.setHours(0,0,0,0); return x.getTime() === tomorrow.getTime(); }
function isOverdue(d: string | null) { if (!d) return false; const x = new Date(d); x.setHours(0,0,0,0); return x.getTime() < today.getTime(); }

function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [quickTitle, setQuickTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [view, setView] = useState<"list" | "kanban" | "gantt" | "list_table">("list");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [showMoveSelect, setShowMoveSelect] = useState(false);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: tasksRaw } = await supabase.from("tasks").select("*").neq("status", "concluído").order("data_entrega", { ascending: true, nullsFirst: false });
      const { data: launchesRaw } = await supabase.from("launches").select("id, nome").order("nome");
      setLaunches(launchesRaw || []);
      const launchMap = Object.fromEntries((launchesRaw || []).map((l: Launch) => [l.id, l]));
      const assigneeIds = [...new Set((tasksRaw || []).map((t: any) => t.assignee_id).filter(Boolean))];
      let profileMap: Record<string, { nome: string }> = {};
      if (assigneeIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, nome").in("id", assigneeIds);
        profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]));
      }
      setTasks((tasksRaw || []).map((t: any) => ({ ...t, launch: launchMap[t.launch_id] || null, assignee: t.assignee_id ? profileMap[t.assignee_id] || null : null })));
    } catch (err: any) {
      toast.error("Erro ao carregar tarefas", { description: err.message });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [activeFilter, view]);

  const filteredTasks = tasks.filter(t => {
    if (activeFilter === "all") return true;
    if (activeFilter === "today") return isToday(t.data_entrega) || isOverdue(t.data_entrega);
    if (activeFilter === "tomorrow") return isTomorrow(t.data_entrega);
    if (activeFilter === "no_date") return !t.data_entrega;
    return t.launch_id === activeFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE));
  const paginatedTasks = filteredTasks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const countFilter = (f: Filter) => {
    if (f === "all") return tasks.length;
    if (f === "today") return tasks.filter(t => isToday(t.data_entrega) || isOverdue(t.data_entrega)).length;
    if (f === "tomorrow") return tasks.filter(t => isTomorrow(t.data_entrega)).length;
    if (f === "no_date") return tasks.filter(t => !t.data_entrega).length;
    return tasks.filter(t => t.launch_id === f).length;
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const clearSelection = () => setSelected(new Set());

  const handleQuickCreate = async () => {
    if (!quickTitle.trim()) return;
    if (!launches[0]) { toast.error("Crie um projeto primeiro"); return; }
    setCreating(true);
    try {
      const launchId = activeFilter !== "all" && activeFilter !== "today" && activeFilter !== "tomorrow" && activeFilter !== "no_date" ? activeFilter : launches[0].id;
      const { error } = await supabase.from("tasks").insert({ titulo: quickTitle.trim(), status: "todo", launch_id: launchId, assignee_id: user?.id || null, team: "product", prioridade: "média" });
      if (error) throw error;
      setQuickTitle(""); fetchData(); toast.success("Tarefa criada");
    } catch (err: any) { toast.error("Erro ao criar tarefa", { description: err.message }); }
    finally { setCreating(false); }
  };

  const handleDeleteSelected = async () => {
    try {
      const ids = Array.from(selected);
      const { error } = await supabase.from("tasks").delete().in("id", ids);
      if (error) throw error;
      toast.success(`${ids.length} tarefa(s) excluída(s)`);
      clearSelection(); fetchData();
    } catch (err: any) { toast.error("Erro ao excluir", { description: err.message }); }
    finally { setDeleteConfirm(false); }
  };

  const handleDuplicateSelected = async () => {
    try {
      const selectedTasks = tasks.filter(t => selected.has(t.id));
      const copies = selectedTasks.map(t => ({ titulo: `${t.titulo} (cópia)`, status: "todo", team: t.team, assignee_id: t.assignee_id, launch_id: t.launch_id, data_inicio: t.data_inicio, data_entrega: t.data_entrega, prioridade: t.prioridade, descricao: t.descricao }));
      const { error } = await supabase.from("tasks").insert(copies);
      if (error) throw error;
      toast.success(`${copies.length} tarefa(s) duplicada(s)`);
      clearSelection(); fetchData();
    } catch (err: any) { toast.error("Erro ao duplicar", { description: err.message }); }
  };

  const handleMoveSelected = async (newStatus: string) => {
    try {
      const ids = Array.from(selected);
      const { error } = await supabase.from("tasks").update({ status: newStatus }).in("id", ids);
      if (error) throw error;
      toast.success(`${ids.length} tarefa(s) movida(s)`);
      clearSelection(); fetchData(); setShowMoveSelect(false);
    } catch (err: any) { toast.error("Erro ao mover", { description: err.message }); }
  };

  const handleExportSelected = () => {
    const selectedTasks = tasks.filter(t => selected.has(t.id));
    const csv = ["Título,Status,Time,Responsável,Data Entrega,Projeto",
      ...selectedTasks.map(t => `"${t.titulo}","${t.status}","${t.team || ""}","${t.assignee?.nome || ""}","${t.data_entrega || ""}","${t.launch?.nome || ""}"`)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "tarefas.csv"; a.click();
    toast.success("Exportado com sucesso");
  };

  const formatDate = (d: string | null) => {
    if (!d) return null;
    if (isToday(d)) return "Hoje";
    if (isTomorrow(d)) return "Amanhã";
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const todayCount = countFilter("today");
  const allSelected = paginatedTasks.length > 0 && paginatedTasks.every(t => selected.has(t.id));

  return (
    <AppLayout>
      <TopBar title="Tarefas" subtitle="Painel global" actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            <button onClick={() => setView("list")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === "list" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>Lista</button>
            <button onClick={() => setView("kanban")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === "kanban" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>Kanban</button>
            <button onClick={() => setView("gantt")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === "gantt" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>Gantt</button>
            <button onClick={() => setView("list_table")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === "list_table" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>Tabela</button>
          </div>
          <button onClick={() => { setEditingTask(null); setIsSheetOpen(true); }} className="h-8 px-3 rounded bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Nova Tarefa
          </button>
        </div>
      } />

      {view === "kanban" && <TaskKanban launches={launches} onRefresh={fetchData} />}
      {view === "gantt" && <TaskGantt launches={launches} onRefresh={fetchData} />}
      {view === "list_table" && <TaskList launches={launches} onRefresh={fetchData} />}

      <div className={`flex flex-1 overflow-hidden ${view !== "list" ? "hidden" : ""}`}>
        {/* Sidebar */}
        <div className="w-56 shrink-0 border-r border-slate-100 bg-slate-50/50 overflow-y-auto py-4 px-3">
          <div className="space-y-0.5">
            <SideItem icon={<AlignLeft className="w-4 h-4" />} label="Todos" count={countFilter("all")} active={activeFilter === "all"} onClick={() => setActiveFilter("all")} />
            <SideItem icon={<Star className="w-4 h-4" />} label="Hoje" count={todayCount} active={activeFilter === "today"} onClick={() => setActiveFilter("today")} badge={todayCount > 0} />
            <SideItem icon={<Sun className="w-4 h-4" />} label="Amanhã" count={countFilter("tomorrow")} active={activeFilter === "tomorrow"} onClick={() => setActiveFilter("tomorrow")} />
            <SideItem icon={<Clock className="w-4 h-4" />} label="Sem data" count={countFilter("no_date")} active={activeFilter === "no_date"} onClick={() => setActiveFilter("no_date")} />
          </div>
          {launches.length > 0 && (
            <div className="mt-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 mb-2">Projetos</p>
              <div className="space-y-0.5">
                {launches.map(l => <SideItem key={l.id} icon={<Rocket className="w-4 h-4" />} label={l.nome} count={countFilter(l.id)} active={activeFilter === l.id} onClick={() => setActiveFilter(l.id)} />)}
              </div>
            </div>
          )}
        </div>

        {/* Main */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Quick create */}
          <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-3 flex items-center gap-3 z-10">
            <input
              type="text" value={quickTitle} onChange={e => setQuickTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleQuickCreate()}
              placeholder="Digite uma nova tarefa e pressione Enter..."
              className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-slate-400 focus:bg-white transition-all placeholder:text-slate-400"
            />
            <button onClick={handleQuickCreate} disabled={creating || !quickTitle.trim()} className="h-9 px-4 rounded-lg bg-foreground text-background text-xs font-medium hover:opacity-90 disabled:opacity-40 transition-opacity">
              {creating ? "..." : "Criar"}
            </button>
          </div>

          {/* Header da lista */}
          {filteredTasks.length > 0 && (
            <div className="flex items-center gap-3 px-6 py-2 border-b border-slate-50 bg-slate-50/30 shrink-0">
              <button onClick={() => allSelected ? clearSelection() : setSelected(new Set(paginatedTasks.map(t => t.id)))} className="shrink-0 text-slate-300 hover:text-slate-600 transition-colors">
                {allSelected ? <CheckSquare className="w-4 h-4 text-slate-700" /> : <Square className="w-4 h-4" />}
              </button>
              <span className="text-xs text-slate-400 font-medium">{filteredTasks.length} tarefa{filteredTasks.length !== 1 ? "s" : ""}</span>
            </div>
          )}

          {/* Task list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div></div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 text-center">
                <CheckSquare className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-sm font-medium text-slate-400">Nenhuma tarefa aqui</p>
                <p className="text-xs text-slate-300 mt-1">Crie uma tarefa acima ou mude o filtro</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {paginatedTasks.map(task => (
                  <div key={task.id} className={`flex items-center gap-3 px-6 py-3 hover:bg-slate-50/80 group transition-colors ${selected.has(task.id) ? "bg-blue-50/50" : ""}`}>
                    <button onClick={() => toggleSelect(task.id)} className="shrink-0 text-slate-300 hover:text-slate-600 transition-colors">
                      {selected.has(task.id) ? <CheckSquare className="w-4 h-4 text-slate-700" /> : <Square className="w-4 h-4" />}
                    </button>
                    <button onClick={() => { setEditingTask(task); setIsSheetOpen(true); }} className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-slate-800 group-hover:text-slate-900 truncate">{task.titulo}</p>
                      {task.launch && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{task.launch.nome}</p>}
                    </button>
                    <div className="flex items-center gap-3 shrink-0">
                      {task.data_entrega && (
                        <div className={`flex items-center gap-1 text-[11px] font-medium ${isOverdue(task.data_entrega) && !isToday(task.data_entrega) ? "text-rose-500" : isToday(task.data_entrega) ? "text-amber-500" : "text-slate-400"}`}>
                          <Calendar className="w-3 h-3" />
                          {formatDate(task.data_entrega)}
                        </div>
                      )}
                      <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500" title={task.assignee?.nome || "Sem responsável"}>
                        {task.assignee?.nome?.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "??"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-white shrink-0">
              <span className="text-xs text-slate-400">
                Exibindo {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredTasks.length)} de {filteredTasks.length}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                </button>
                <span className="text-xs text-slate-600 font-medium">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barra de seleção flutuante */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-slate-900 text-white rounded-2xl shadow-2xl px-4 py-3">
          <div className="flex items-center gap-2 pr-4 border-r border-slate-700">
            <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">{selected.size}</div>
            <span className="text-sm font-medium">selecionada{selected.size !== 1 ? "s" : ""}</span>
          </div>
          <button onClick={handleDuplicateSelected} title="Duplicar" className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-colors">
            <Copy className="w-4 h-4" />
            <span className="text-[10px]">Duplicar</span>
          </button>
          <div className="relative">
            <button onClick={() => setShowMoveSelect(!showMoveSelect)} title="Mover de etapa" className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-colors">
              <ArrowRight className="w-4 h-4" />
              <span className="text-[10px]">Mover</span>
            </button>
            {showMoveSelect && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden min-w-[160px]">
                {STATUSES.map(s => (
                  <button key={s.value} onClick={() => handleMoveSelected(s.value)} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleExportSelected} title="Exportar CSV" className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-colors">
            <Download className="w-4 h-4" />
            <span className="text-[10px]">Exportar</span>
          </button>
          <button onClick={() => setDeleteConfirm(true)} title="Excluir" className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-rose-900 text-rose-400 hover:text-rose-300 transition-colors">
            <Trash2 className="w-4 h-4" />
            <span className="text-[10px]">Excluir</span>
          </button>
          <button onClick={() => { const ids = Array.from(selected); supabase.from("tasks").update({ status: "concluído" }).in("id", ids).then(() => { toast.success(`${ids.length} tarefa(s) concluída(s)`); clearSelection(); fetchData(); }); }} title="Concluir" className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-emerald-900 text-emerald-400 hover:text-emerald-300 transition-colors">
            <Check className="w-4 h-4" />
            <span className="text-[10px]">Concluir</span>
          </button>
          <button onClick={clearSelection} className="ml-2 pl-4 border-l border-slate-700 text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefas</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir {selected.size} tarefa(s)? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSelected} className="bg-rose-500 hover:bg-rose-600">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TaskSheet
        open={isSheetOpen}
        onOpenChange={(open) => { setIsSheetOpen(open); if (!open) setEditingTask(null); }}
        launchId={editingTask?.launch_id || launches[0]?.id || ""}
        launches={launches}
        task={editingTask}
        onSuccess={() => { fetchData(); setIsSheetOpen(false); setEditingTask(null); }}
      />
    </AppLayout>
  );
}

function SideItem({ icon, label, count, active, onClick, badge }: { icon: React.ReactNode; label: string; count: number; active: boolean; onClick: () => void; badge?: boolean; }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-all ${active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
      <span className={active ? "text-white" : "text-slate-400"}>{icon}</span>
      <span className="flex-1 text-xs font-medium truncate">{label}</span>
      {count > 0 && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badge ? "bg-rose-500 text-white" : active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"}`}>{count}</span>}
    </button>
  );
}
