import { z } from "zod";

export const TASK_STATUSES = ["a_fazer", "em_andamento", "bloqueado", "concluido"] as const;
export type TaskStatusEnum = typeof TASK_STATUSES[number];

export const TASK_PRIORITIES = ["baixa", "média", "alta", "crítica"] as const;
export type TaskPriorityEnum = typeof TASK_PRIORITIES[number];

export const TASK_STATUS_LABELS: Record<TaskStatusEnum, string> = {
  a_fazer: "A Fazer",
  em_andamento: "Em Andamento",
  bloqueado: "Bloqueado",
  concluido: "Concluído",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriorityEnum, string> = {
  baixa: "Baixa",
  média: "Média",
  alta: "Alta",
  crítica: "Crítica",
};

export const newTaskSchema = z.object({
  launch_id: z.string().uuid("ID de lançamento inválido"),
  titulo: z
    .string()
    .min(2, "Título precisa ter pelo menos 2 caracteres")
    .max(500, "Título muito longo"),
  descricao: z.string().max(5000, "Descrição muito longa").nullable().optional(),
  status: z.enum(TASK_STATUSES).default("a_fazer"),
  prioridade: z.enum(TASK_PRIORITIES).default("média"),
  team: z.string().nullable().optional(),
  assignee_id: z.string().uuid().nullable().optional(),
  phase_id: z.string().uuid().nullable().optional(),
  data_inicio: z.string().nullable().optional(),
  data_entrega: z.string().nullable().optional(),
});

export const updateTaskSchema = newTaskSchema.partial().extend({
  id: z.string().uuid(),
});

export type NewTaskInput = z.infer<typeof newTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;