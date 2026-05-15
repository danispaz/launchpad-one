import { useState, useEffect, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Calendar, CheckSquare, Square, Inbox, Star, Sun, AlignLeft, Clock, ChevronRight, Rocket } from "lucide-react";
import { TaskFormDialog } from "@/components/launches/TaskFormDialog";

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
  launch_id: string;
  assignee_id: string | null;
  assignee?: { nome: string | null } | null;
  launch?: { nome: string } | null;
}

interface Launch {
  id: string;
  nome: string;
}

type Filter = "all" | "today" | "tomorrow" | "no_date" | string;

const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const dayAfter = new Date(tomorrow);
dayAfter.setDate(dayAfter.getDate() + 1);

function isToday(dateStr: string | null) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d.getTime() === today.getTime();
}

function isTomorrow(dateStr: string | null) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d.getTime() === tomorrow.getTime();
}

function isOverdue(dateStr: string | null) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [quickTitle, setQuickTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: tasksRaw, error: tErr } = await supabase
        .from("tasks")
        .select("*")
        .neq("status", "concluído")
        .order("data_entrega", { ascending: true, nullsFirst: false });
      if (tErr) throw tErr;

      const { data: launchesRaw, error: lErr } = await supabase
        .from("launches")
        .select("id, nome")
        .order("nome");
      if (lErr) throw lErr;

      setLaunches(launchesRaw || []);

      const launchMap = Object.fromEntries((launchesRaw || []).map((l: Launch) => [l.id, l]));

      const assigneeIds = [...new Set((tasksRaw || []).map(t => t.assignee_id).filter(Boolean))];
      let profileMap: Record<string, { nome: string }> = {};
      if (assigneeIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, nome")
          .in("id", assigneeIds);
        profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
      }

      setTasks((tasksRaw || []).map(t => ({
        ...t,
        launch: launchMap[t.launch_id] || null,
        assignee: t.assignee_id ? profileMap[t.assignee_id] || null : null,
      })));
    } catch (err: any) {
      toast.error("Erro ao carregar tarefas", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredTasks = tasks.filter(t => {
    if (activeFilter === "all") return true;
    if (activeFilter === "today") return isToday(t.data_entrega) || isOverdue(t.data_entrega);
    if (activeFilter === "tomorrow") return isTomorrow(t.data_entrega);
    if (activeFilter === "no_date") return !t.data_entrega;
    return t.launch_id === activeFilter;
  });

  const countFilter = (f: Filter) => {
    if (f === "all") return tasks.length;
    if (f === "today") return tasks.filter(t => isToday(t.data_entrega) || isOverdue(t.data_entrega)).length;
    if (f === "tomorrow") return tasks.filter(t => isTomorrow(t.data_entrega)).length;
    if (f === "no_date") return tasks.filter(t => !t.data_entrega).length;
    return tasks.filter(t => t.launch_id === f).length;
  };

  const handleQuickCreate = async () => {
    if (!quickTitle.trim()) return;
    if (!launches[0]) { toast.error("Crie um lançamento primeiro"); return; }
    setCreating(true);
    try {
      const { error } = await supabase.from("tasks").insert({
        titulo: quickTitle.trim(),
        status: "todo",
        launch_id: activeFilter !== "all" && activeFilter !== "today" && activeFilter !== "tomorrow" && activeFilter !== "no_date"
          ? activeFilter : launches[0].id,
        assignee_id: user?.id || null,
      });
      if (error) throw error;
      setQuickTitle("");
      fetchData();
      toast.success("Tarefa criada");
    } catch (err: any) {
      toast.error("Erro ao criar tarefa", { description: err.message });
    } finally {
      setCreating(false);
    }
  };

  const handleComplete = async (task: Task) => {
    try {
      await supabase.from("tasks").update({ status: "concluído" }).eq("id", task.id);
      setTasks(prev => prev.filter(t => t.id !== task.id));
      toast.success("Tarefa concluída");
    } catch (err: any) {
      toast.error("Erro", { description: err.message });
    }
  };

  const todayCount = countFilter("today");

  return (
    <AppLayout>
      <TopBar title="Tarefas" subtitle="Painel global" actions={
        <button onClick={() => setIsDialogOpen(true)} className="h-8 px-3 rounded bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Nova Tarefa
        </button>
      } />

      <div className="flex flex-1 overflow-hidden">
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
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 mb-2">Lançamentos</p>
              <div className="space-y-0.5">
                {launches.map(l => (
                  <SideItem key={l.id} icon={<Rocket className="w-4 h-4" />} label={l.nome} count={countFilter(l.id)} active={activeFilter === l.id} onClick={() => setActiveFilter(l.id)} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main */}
        <div className="flex-1 overflow-y-auto">
          {/* Quick create */}
          <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-3 flex items-center gap-3 z-10">
            <input
              type="text"
              value={quickTitle}
              onChange={e => setQuickTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleQuickCreate()}
              placeholder="Digite uma nova tarefa e pressione Enter..."
              className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-slate-400 focus:bg-white transition-all placeholder:text-slate-400"
            />
            <button
              onClick={handleQuickCreate}
              disabled={creating || !quickTitle.trim()}
              className="h-9 px-4 rounded-lg bg-foreground text-background text-xs font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {creating ? "..." : "Criar"}
            </button>
          </div>

          {/* Task list */}
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 text-center">
              <CheckSquare className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-sm font-medium text-slate-400">Nenhuma tarefa aqui</p>
              <p className="text-xs text-slate-300 mt-1">Crie uma tarefa acima ou mude o filtro</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredTasks.map(task => (
                <TaskRow key={task.id} task={task} onComplete={handleComplete} onEdit={() => { setEditingTask(task); setIsDialogOpen(true); }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {isDialogOpen && (
        <TaskFormDialog
          open={isDialogOpen}
          onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingTask(null); }}
          launchId={editingTask?.launch_id || launches[0]?.id || ""}
          phases={[]}
          taskToEdit={editingTask as any}
          onSuccess={() => { fetchData(); setIsDialogOpen(false); setEditingTask(null); }}
        />
      )}
    </AppLayout>
  );
}

function SideItem({ icon, label, count, active, onClick, badge }: {
  icon: React.ReactNode; label: string; count: number; active: boolean; onClick: () => void; badge?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-all ${active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
    >
      <span className={active ? "text-white" : "text-slate-400"}>{icon}</span>
      <span className="flex-1 text-xs font-medium truncate">{label}</span>
      {count > 0 && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badge ? "bg-rose-500 text-white" : active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function TaskRow({ task, onComplete, onEdit }: { task: Task; onComplete: (t: Task) => void; onEdit: () => void }) {
  const overdue = isOverdue(task.data_entrega) && !isToday(task.data_entrega);
  const todayTask = isToday(task.data_entrega);
  const initials = task.assignee?.nome?.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "??";

  const formatDate = (d: string | null) => {
    if (!d) return null;
    if (isToday(d)) return "Hoje";
    if (isTomorrow(d)) return "Amanhã";
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return (
    <div className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50/80 group transition-colors">
      <button onClick={() => onComplete(task)} className="shrink-0 text-slate-300 hover:text-emerald-500 transition-colors">
        <Square className="w-4 h-4" />
      </button>

      <button onClick={onEdit} className="flex-1 text-left min-w-0">
        <p className="text-sm font-medium text-slate-800 group-hover:text-slate-900 truncate">{task.titulo}</p>
        {task.launch && (
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{task.launch.nome}</p>
        )}
      </button>

      <div className="flex items-center gap-3 shrink-0">
        {task.data_entrega && (
          <div className={`flex items-center gap-1 text-[11px] font-medium ${overdue ? "text-rose-500" : todayTask ? "text-amber-500" : "text-slate-400"}`}>
            <Calendar className="w-3 h-3" />
            {formatDate(task.data_entrega)}
          </div>
        )}
        <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500" title={task.assignee?.nome || "Sem responsável"}>
          {initials}
        </div>
      </div>
    </div>
  );
}
