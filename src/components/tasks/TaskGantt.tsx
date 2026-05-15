import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ChevronDown, ChevronRight } from "lucide-react";
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
  descricao?: string | null;
  colaboradores?: string[];
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
}

const STATUS_COLORS: Record<string, string> = {
  "todo": "#3761E9",
  "em_progresso": "#FFB400",
  "em_revisão": "#BA68C8",
  "bloqueado": "#EF314C",
  "concluído": "#16CFAE",
};

const DAY_WIDTH = 36;
const ROW_HEIGHT = 40;

function getDaysInRange(start: Date, end: Date) {
  const days = [];
  const cur = new Date(start);
  while (cur <= end) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function getMonthGroups(days: Date[]) {
  const groups: { label: string; count: number }[] = [];
  let cur = "";
  let count = 0;
  for (const d of days) {
    const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    if (label !== cur) {
      if (cur) groups.push({ label: cur, count });
      cur = label; count = 1;
    } else { count++; }
  }
  if (cur) groups.push({ label: cur, count });
  return groups;
}

export function TaskGantt({ launches, onRefresh }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data: tasksRaw } = await supabase.from("tasks").select("*").order("data_inicio", { ascending: true, nullsFirst: false });
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

  // Scroll para hoje
  useEffect(() => {
    if (!loading && scrollRef.current) {
      const todayOffset = Math.floor((today.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)) * DAY_WIDTH;
      scrollRef.current.scrollLeft = Math.max(0, todayOffset - 200);
    }
  }, [loading]);

  // Range de datas
  const allDates = tasks.flatMap(t => [t.data_inicio, t.data_entrega].filter(Boolean).map(d => new Date(d!)));
  const minDate = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => d.getTime()))) : new Date();
  const maxDate = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime()))) : new Date();
  minDate.setDate(minDate.getDate() - 7);
  maxDate.setDate(maxDate.getDate() + 14);
  const rangeStart = new Date(minDate); rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(maxDate); rangeEnd.setHours(0, 0, 0, 0);
  const days = getDaysInRange(rangeStart, rangeEnd);
  const monthGroups = getMonthGroups(days);
  const totalWidth = days.length * DAY_WIDTH;

  const todayOffset = Math.floor((today.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)) * DAY_WIDTH;

  // Agrupar por lançamento
  const grouped = launches.map(l => ({
    launch: l,
    tasks: tasks.filter(t => t.launch_id === l.id),
  })).filter(g => g.tasks.length > 0);

  const getBarStyle = (task: Task) => {
    if (!task.data_inicio && !task.data_entrega) return null;
    const start = task.data_inicio ? new Date(task.data_inicio) : new Date(task.data_entrega!);
    const end = task.data_entrega ? new Date(task.data_entrega) : new Date(task.data_inicio!);
    start.setHours(0, 0, 0, 0); end.setHours(0, 0, 0, 0);
    const left = Math.floor((start.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)) * DAY_WIDTH;
    const width = Math.max(DAY_WIDTH, (Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1) * DAY_WIDTH);
    return { left, width, color: STATUS_COLORS[task.status] || "#3761E9" };
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

  if (loading) return (
    <div className="flex items-center justify-center h-60">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
    </div>
  );

  if (tasks.length === 0) return (
    <div className="flex flex-col items-center justify-center h-60 text-center">
      <p className="text-sm font-medium text-slate-400">Nenhuma tarefa com datas definidas</p>
      <p className="text-xs text-slate-300 mt-1">Defina datas de início e término nas tarefas para visualizá-las aqui</p>
    </div>
  );

  const LABEL_WIDTH = 280;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Layout: label col + scroll col */}
      <div className="flex flex-1 overflow-hidden">

        {/* Label column — fixo */}
        <div className="shrink-0 border-r border-slate-200 bg-white z-10" style={{ width: LABEL_WIDTH }}>
          {/* Header */}
          <div className="flex border-b border-slate-200 bg-slate-50" style={{ height: ROW_HEIGHT * 2 }}>
            <div className="flex items-end px-4 pb-2 text-xs font-bold text-slate-500 uppercase tracking-widest" style={{ width: LABEL_WIDTH }}>
              Tarefa
            </div>
          </div>

          {/* Rows */}
          {grouped.map(g => (
            <div key={g.launch.id}>
              {/* Launch row */}
              <div
                className="flex items-center gap-2 px-3 cursor-pointer hover:bg-slate-50 border-b border-slate-100 font-semibold text-sm text-slate-700"
                style={{ height: ROW_HEIGHT }}
                onClick={() => setCollapsed(prev => { const n = new Set(prev); n.has(g.launch.id) ? n.delete(g.launch.id) : n.add(g.launch.id); return n; })}
              >
                {collapsed.has(g.launch.id) ? <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                <span className="truncate">{g.launch.nome}</span>
                <span className="text-xs text-slate-400 font-normal ml-auto shrink-0">{g.tasks.length}</span>
              </div>

              {/* Task rows */}
              {!collapsed.has(g.launch.id) && g.tasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 px-4 cursor-pointer hover:bg-slate-50 border-b border-slate-50 group"
                  style={{ height: ROW_HEIGHT }}
                  onClick={() => { setSelectedTask(task); setIsSheetOpen(true); }}
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[task.status] || "#ccc" }} />
                  <span className="text-sm text-slate-700 truncate flex-1 group-hover:text-slate-900">{task.titulo}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Gantt scroll area */}
        <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-auto">
          <div style={{ width: totalWidth, minWidth: totalWidth }}>

            {/* Month header */}
            <div className="flex border-b border-slate-200 bg-slate-50 sticky top-0 z-10" style={{ height: ROW_HEIGHT }}>
              {monthGroups.map((m, i) => (
                <div key={i} className="border-r border-slate-200 flex items-center px-3 text-xs font-semibold text-slate-600 capitalize shrink-0" style={{ width: m.count * DAY_WIDTH }}>
                  {m.label}
                </div>
              ))}
            </div>

            {/* Day header */}
            <div className="flex border-b border-slate-200 bg-slate-50 sticky top-10 z-10" style={{ height: ROW_HEIGHT }}>
              {days.map((d, i) => {
                const isToday = d.getTime() === today.getTime();
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div key={i} className={`flex items-center justify-center text-[11px] font-medium border-r border-slate-100 shrink-0 ${isToday ? "bg-blue-500 text-white" : isWeekend ? "text-slate-300" : "text-slate-400"}`} style={{ width: DAY_WIDTH }}>
                    {d.getDate()}
                  </div>
                );
              })}
            </div>

            {/* Gantt rows */}
            <div className="relative">
              {/* Today line */}
              <div className="absolute top-0 bottom-0 w-px bg-blue-400 z-10 pointer-events-none" style={{ left: todayOffset + DAY_WIDTH / 2 }} />

              {grouped.map(g => (
                <div key={g.launch.id}>
                  {/* Launch row */}
                  <div className="flex border-b border-slate-100 bg-slate-50/50" style={{ height: ROW_HEIGHT }}>
                    {days.map((d, i) => {
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      return <div key={i} className={`border-r border-slate-100 shrink-0 ${isWeekend ? "bg-slate-50" : ""}`} style={{ width: DAY_WIDTH }} />;
                    })}
                  </div>

                  {/* Task rows */}
                  {!collapsed.has(g.launch.id) && g.tasks.map(task => {
                    const bar = getBarStyle(task);
                    return (
                      <div key={task.id} className="flex border-b border-slate-50 relative hover:bg-slate-50/50 cursor-pointer" style={{ height: ROW_HEIGHT }}
                        onClick={() => { setSelectedTask(task); setIsSheetOpen(true); }}>
                        {days.map((d, i) => {
                          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                          return <div key={i} className={`border-r border-slate-100 shrink-0 ${isWeekend ? "bg-slate-50" : ""}`} style={{ width: DAY_WIDTH }} />;
                        })}
                        {bar && (
                          <div
                            className="absolute top-1/2 -translate-y-1/2 rounded-lg flex items-center px-2 text-white text-[11px] font-medium shadow-sm"
                            style={{ left: bar.left + 2, width: bar.width - 4, height: 24, background: bar.color }}
                            title={task.titulo}
                          >
                            <span className="truncate">{task.titulo}</span>
                          </div>
                        )}
                        {!bar && (
                          <div className="absolute top-1/2 -translate-y-1/2 flex items-center" style={{ left: todayOffset }}>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
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
