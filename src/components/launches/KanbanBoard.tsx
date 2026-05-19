import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from "@dnd-kit/core";
import { TeamChip } from "@/components/Badges";
import { Calendar, Trash2 } from "lucide-react";
import { TASK_STATUSES, TASK_STATUS_LABELS, type TaskStatusEnum } from "@/lib/schemas/task-schema";
import type { ReactNode, CSSProperties } from "react";

interface KanbanTask {
  id: string;
  titulo: string;
  status: string;
  team: string | null;
  data_entrega: string | null;
  assignee?: { nome: string | null } | null;
}

interface KanbanBoardProps {
  tasks: KanbanTask[];
  onTaskClick: (task: KanbanTask) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatusEnum) => Promise<void>;
  onTaskDelete: (taskId: string) => Promise<void>;
  onRefresh: () => void;
}

const COLUMN_COLORS: Record<TaskStatusEnum, string> = {
  todo: "bg-slate-100",
  em_progresso: "bg-blue-50",
  em_revisão: "bg-amber-50",
  bloqueado: "bg-rose-50",
  concluído: "bg-emerald-50",
};

function Column({ status, label, color, count, children }: { status: TaskStatusEnum; label: string; color: string; count: number; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div className="flex-shrink-0 w-72">
      <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 px-2 mb-4">{label} · {count}</h4>
      <div ref={setNodeRef} className={`space-y-3 p-3 rounded-2xl border min-h-[400px] transition-colors ${isOver ? `${color} border-primary` : `${color}/30 border-slate-100`}`}>
        {children}
      </div>
    </div>
  );
}

function Card({ task, onClick, onDelete }: { task: KanbanTask; onClick: () => void; onDelete: (e: React.MouseEvent) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style: CSSProperties = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.5 : 1, cursor: "grab", zIndex: isDragging ? 50 : "auto" } : { cursor: "grab" };
  const initials = task.assignee?.nome?.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() || "??";
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} onClick={onClick} className="relative bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
      <button onClick={onDelete} onPointerDown={(e) => e.stopPropagation()} className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-opacity z-10" title="Deletar tarefa">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      <div className="flex items-center gap-2 mb-2 pr-6"><TeamChip team={(task.team as any) || "product"} /></div>
      <p className="text-sm font-bold text-slate-800 leading-tight mb-3 group-hover:text-primary transition-colors">{task.titulo}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase">
          <Calendar className="w-3 h-3" />
          {task.data_entrega ? new Date(task.data_entrega).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "S/D"}
        </div>
        <div className="h-5 w-5 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[8px] font-bold text-slate-500" title={task.assignee?.nome || "N/A"}>{initials}</div>
      </div>
    </div>
  );
}

export function KanbanBoard({ tasks, onTaskClick, onStatusChange, onTaskDelete, onRefresh }: KanbanBoardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const tasksByStatus: Record<TaskStatusEnum, KanbanTask[]> = {
    todo: tasks.filter((t) => t.status === "todo"),
    em_progresso: tasks.filter((t) => t.status === "em_progresso"),
    em_revisão: tasks.filter((t) => t.status === "em_revisão"),
    bloqueado: tasks.filter((t) => t.status === "bloqueado"),
    concluído: tasks.filter((t) => t.status === "concluído"),
  };
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as TaskStatusEnum;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;
    try {
      await onStatusChange(taskId, newStatus);
      onRefresh();
    } catch (err) {
      console.error("[ERROR KanbanBoard drag]", err);
    }
  };
  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 pb-4 overflow-x-auto">
        {TASK_STATUSES.map((status) => (
          <Column key={status} status={status} label={TASK_STATUS_LABELS[status]} color={COLUMN_COLORS[status]} count={tasksByStatus[status].length}>
            {tasksByStatus[status].map((task) => <Card key={task.id} task={task} onClick={() => onTaskClick(task)} onDelete={(e) => { e.stopPropagation(); onTaskDelete(task.id); }} />)}
          </Column>
        ))}
      </div>
    </DndContext>
  );
}
