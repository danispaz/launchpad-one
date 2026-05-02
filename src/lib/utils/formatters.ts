export const TASK_STATUS_DONE = 'concluído' as const;
export const TASK_STATUS_IN_PROGRESS = 'em_andamento' as const;
export const TASK_STATUS_TODO = 'a_fazer' as const;
export const TASK_STATUS_BLOCKED = 'bloqueado' as const;

/**
 * Definições manuais dos Enums do banco para evitar erros de importação
 * enquanto o arquivo de tipos do Supabase não é gerado ou sincronizado.
 */

export type TeamName =
  | "marketing"
  | "engineering"
  | "product"
  | "design"
  | "sales"
  | "customer_success"
  | "executive"
  | "growth";

export type LaunchStatus =
  | "planejamento"
  | "em_andamento"
  | "concluido"
  | "em_risco"
  | "atrasado";

export type PriorityLevel = "baixa" | "media" | "alta" | "critica";

export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";

// Cores e configurações visuais
export const teamStyles: Record<string, { label: string; color: string }> = {
  marketing: { label: "Marketing", color: "#ec4899" },
  engineering: { label: "Desenvolvimento", color: "#3b82f6" },
  product: { label: "Produto", color: "#a855f7" },
  design: { label: "Design", color: "#f43f5e" },
  sales: { label: "Vendas", color: "#22c55e" },
  customer_success: { label: "CS", color: "#06b6d4" },
  executive: { label: "Diretoria", color: "#eab308" },
  growth: { label: "Growth", color: "#f97316" },
};

export const statusStyles: Record<string, { label: string; tone: "primary" | "success" | "warning" | "destructive" | "info" }> = {
  planejamento: { label: "Planejamento", tone: "info" },
  em_andamento: { label: "Execução", tone: "primary" },
  em_risco: { label: "Em Risco", tone: "warning" },
  atrasado: { label: "Atrasado", tone: "destructive" },
  concluido: { label: "Concluído", tone: "success" },
};

/**
 * Mapeamento de Times (Database -> UI)
 */
export const teamMap: Record<TeamName, string> = {
  marketing: "Marketing",
  engineering: "Desenvolvimento",
  product: "Produto",
  design: "Design",
  sales: "Vendas",
  customer_success: "CS",
  executive: "Diretoria",
  growth: "Growth",
};

/**
 * Mapeamento de Status de Lançamento (Database -> UI)
 */
export const launchStatusMap: Record<LaunchStatus, string> = {
  planejamento: "Planejamento",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
  em_risco: "Em Risco",
  atrasado: "Atrasado",
};

/**
 * Mapeamento de Prioridade (Database -> UI)
 */
export const priorityMap: Record<PriorityLevel, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

/**
 * Mapeamento de Status de Tarefa (Database -> UI)
 */
export const taskStatusMap: Record<TaskStatus, string> = {
  todo: "A fazer",
  in_progress: "Em andamento",
  blocked: "Bloqueado",
  done: "Concluído",
};

/**
 * Gera um código visual para o lançamento (ex: LH-ABC)
 */
export const formatLaunchCode = (id: string): string => {
  return `LH-${id.substring(0, 3).toUpperCase()}`;
};

/**
 * Formata data para o padrão brasileiro
 */
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("pt-BR");
};
