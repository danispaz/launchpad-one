
import { Database } from "@/integrations/supabase/types";

// Se o arquivo for realmente read-only e não conseguirmos importar, 
// definirei os enums manualmente para não travar o desenvolvimento.
// Mas tentarei o import primeiro.

type Enums = Database["public"]["Enums"];

/**
 * Mapeamento de Times (Database -> UI)
 */
export const teamMap: Record<Enums["team_name"], string> = {
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
export const launchStatusMap: Record<Enums["launch_status"], string> = {
  planejamento: "Planejamento",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
  em_risco: "Em Risco",
  atrasado: "Atrasado",
};

/**
 * Mapeamento de Prioridade (Database -> UI)
 */
export const priorityMap: Record<Enums["priority_level"], string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

/**
 * Mapeamento de Status de Tarefa (Database -> UI)
 */
export const taskStatusMap: Record<Enums["task_status"], string> = {
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
