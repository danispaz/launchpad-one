import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Plus, Calendar } from "lucide-react";
import { TaskSheet } from "@/components/launches/TaskSheet";

const COLUMNS = [
  { value: "todo", label: "A fazer", color: "#3761E9", bg: "#3761E91a" },
  { value: "em_progresso", label: "Em progresso", color: "#FFB400", bg: "#FFB4001a" },
  { value: "em_revisão", label: "Em revisão", color: "#BA68C8", bg: "#BA68C81a" },
  { value: "bloqueado", label: "Bloqueado", color: "#EF314C", bg: "#EF314C1a" },
  { value: "concluído", label: "Concluído", color: "#16CFAE", bg: "#16CFAE1a" },
];

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

const today = new Date(); today.setHours(0, 0, 0, 0);
function isOverdue(d: string | null) { if (!d) return false; const x = new Date(d); x.setHours(0,0,0,0); return x.getTime() < today.getTime(); }
function isToday(d: string | null) { if (!d) return false; const x = new Date(d); x.setHours(0,0,0,0); return x.getTime() === today.getTime(); }
function formatDate(d: string | null) {
  if (!d) return null;
  if (isToday(d)) return "Hoje";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function TaskKanban({ launches, onRefresh, filterTeam, filterAssignee, filterLaunch, filterColaborador }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [quickCreate, setQuickCreate] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState("");

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

  const filteredTasks = tasks.filter(t => {
    if (filterTeam && t.team !== filterTeam) return false;
    if (filterAssignee && t.assignee_id !== filterAssignee) return false;
    if (filterLaunch && t.launch_id !== filterLaunch) return false;
    if (filterColaborador && !(t.colaboradores || []).includes(filterColaborador)) return false;
    return true;
  });

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggingId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, col: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(col);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggingId) return;
    const task = tasks.find(t => t.id === draggingId);
    if (!task || task.status === newStatus) { setDraggingId(null); setDragOverCol(null); return; }
    setTasks(prev => prev.map(t => t.id === draggingId ? { ...t, status: newStatus } : t));
    try {
      await supabase.from("tasks").update({ status: newStatus }).eq("id", draggingId);
    } catch (err: any) {
      toast.error("Erro ao mover tarefa", { description: err.message });
      fetchTasks();
    } finally { setDraggingId(null); setDragOverCol(null); }
  };

  const handleQuickCreate = async (status: string) => {
    if (!quickTitle.trim()) { setQuickCreate(null); return; }
    if (!launches[0]) { toast.error("Crie um projeto primeiro"); return; }
    try {
      await supabase.from("tasks").insert({
        titulo: quickTitle.trim(), status,
        launch_id: filterLaunch || launches[0].id,
        team: filterTeam || "product", prioridade: "média",
        assignee_id: filterAssignee || null,
      });
      setQuickTitle(""); setQuickCreate(null); fetchTasks();
      toast.success("Tarefa criada");
    } catch (err: any) { toast.error("Erro ao criar", { description: err.message }); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-60">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 px-6 pt-4 h-full">
      {COLUMNS.map(col => {
        const colTasks = filteredTasks.filter(t => t.status === col.value);
        const isOver = dragOverCol === col.value;

        return (
          <div key={col.value}
            className={`flex flex-col rounded-xl shrink-0 w-72 transition-all ${isOver ? "ring-2 ring-offset-1" : ""}`}
            style={{ background: col.bg }}
            onDragOver={e => handleDragOver(e, col.value)}
            onDrop={e => handleDrop(e, col.value)}
            onDragLeave={() => setDragOverCol(null)}>
            <div className="px-4 pt-4 pb-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                  <span className="text-sm font-bold text-slate-800">{col.label}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 ml-4">{colTasks.length} tarefa{colTasks.length !== 1 ? "s" : ""}</p>
              </div>
              <button onClick={() => { setQuickCreate(col.value); setQuickTitle(""); }}
                className="p-1 rounded-lg hover:bg-white/60 text-slate-400 hover:text-slate-600 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
              {colTasks.map(task => (
                <div key={task.id} draggable onDragStart={e => handleDragStart(e, task.id)}
                  onClick={() => { setSelectedTask(task); setIsSheetOpen(true); }}
                  className={`bg-white rounded-xl p-3 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all group ${draggingId === task.id ? "opacity-40" : ""}`}>
                  <p className="text-sm font-medium text-slate-800 mb-2 leading-snug">{task.titulo}</p>
                  {task.launch && <p className="text-[10px] text-slate-400 mb-2 truncate">{task.launch.nome}</p>}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {task.assignee && (
                        <div className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500">
                          {task.assignee.nome?.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "??"}
                        </div>
                      )}
                      {task.data_entrega && (
                        <div className={`flex items-center gap-1 text-[10px] font-medium ${isOverdue(task.data_entrega) && !isToday(task.data_entrega) ? "text-rose-500" : isToday(task.data_entrega) ? "text-amber-500" : "text-slate-400"}`}>
                          <Calendar className="w-3 h-3" />{formatDate(task.data_entrega)}
                        </div>
                      )}
                    </div>
                    <div className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${task.prioridade === "crítica" ? "bg-rose-100 text-rose-600" : task.prioridade === "alta" ? "bg-orange-100 text-orange-600" : task.prioridade === "média" ? "bg-yellow-100 text-yellow-600" : "bg-slate-100 text-slate-500"}`}>
                      {task.prioridade}
                    </div>
                  </div>
                </div>
              ))}

              {quickCreate === col.value && (
                <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                  <input type="text" value={quickTitle} onChange={e => setQuickTitle(e.target.value)} autoFocus
                    onKeyDown={e => { if (e.key === "Enter") handleQuickCreate(col.value); if (e.key === "Escape") { setQuickCreate(null); setQuickTitle(""); } }}
                    placeholder="Nome da tarefa..."
                    className="w-full text-sm outline-none bg-transparent placeholder:text-slate-300" />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleQuickCreate(col.value)} className="text-xs px-2 py-1 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors">Criar</button>
                    <button onClick={() => { setQuickCreate(null); setQuickTitle(""); }} className="text-xs px-2 py-1 text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
                  </div>
                </div>
              )}

              {colTasks.length === 0 && quickCreate !== col.value && (
                <div className={`h-16 rounded-xl border-2 border-dashed flex items-center justify-center transition-all ${isOver ? "border-slate-400 bg-white/40" : "border-transparent"}`}>
                  {isOver && <p className="text-xs text-slate-400">Soltar aqui</p>}
                </div>
              )}
            </div>
          </div>
        );
      })}

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
