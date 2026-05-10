import { z } from "zod";

export const TASK_STATUSES = ["todo", "em_progresso", "em_revisão", "concluído", "bloqueado"] as const;
export type TaskStatusEnum = typeof TASK_STATUSES[number];

export const TASK_PRIORITIES = ["baixa", "média", "alta", "crítica"] as const;
export type TaskPriorityEnum = typeof TASK_PRIORITIES[number];

export const TASK_STATUS_LABELS: Record<TaskStatusEnum, string> = {
  todo: "A Fazer",
  em_progresso: "Em Progresso",
  em_revisão: "Em Revisão",
  concluído: "Concluído",
  bloqueado: "Bloqueado",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriorityEnum, string> = {
  baixa: "Baixa",
  média: "Média",
  alta: "Alta",
  crítica: "Crítica",
};

const emptyToUndefined = (val: unknown) => (val === "" ? undefined : val);

export const newTaskSchema = z.object({
  launch_id: z.string().uuid("ID de lançamento inválido"),
  titulo: z
    .string()
    .min(2, "Título precisa ter pelo menos 2 caracteres")
    .max(500, "Título muito longo"),
  descricao: z.preprocess(
    emptyToUndefined,
    z.string().max(5000, "Descrição muito longa").nullable().optional()
  ),
  status: z.enum(TASK_STATUSES).default("todo"),
  prioridade: z.enum(TASK_PRIORITIES).default("média"),
  team: z.preprocess(emptyToUndefined, z.string().nullable().optional()),
  assignee_id: z.preprocess(emptyToUndefined, z.string().uuid().nullable().optional()),
  phase_id: z.preprocess(emptyToUndefined, z.string().uuid().nullable().optional()),
  data_inicio: z.preprocess(emptyToUndefined, z.string().nullable().optional()),
  data_entrega: z.preprocess(emptyToUndefined, z.string().nullable().optional()),
});

export const updateTaskSchema = newTaskSchema.partial().extend({
  id: z.string().uuid(),
});

export type NewTaskInput = z.infer<typeof newTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;