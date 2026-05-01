export type Role = "executive" | "product_manager" | "marketing" | "sales" | "engineering" | "viewer";

export type TeamKey = "marketing" | "sales" | "dev" | "product" | "exec";
export type LaunchStatus = "planning" | "in_progress" | "at_risk" | "blocked" | "launched";
export type Priority = "low" | "medium" | "high" | "critical";

export const teams: Record<TeamKey, { label: string; color: string }> = {
  marketing: { label: "Marketing", color: "var(--color-team-marketing)" },
  sales: { label: "Vendas", color: "var(--color-team-sales)" },
  dev: { label: "Desenvolvimento", color: "var(--color-team-dev)" },
  product: { label: "Produto", color: "var(--color-team-product)" },
  exec: { label: "Diretoria", color: "var(--color-team-exec)" },
};

export const statusMeta: Record<LaunchStatus, { label: string; tone: string }> = {
  planning: { label: "Planejamento", tone: "info" },
  in_progress: { label: "Em execução", tone: "primary" },
  at_risk: { label: "Em risco", tone: "warning" },
  blocked: { label: "Bloqueado", tone: "destructive" },
  launched: { label: "Lançado", tone: "success" },
};

export type Activity = {
  id: string;
  team: TeamKey;
  title: string;
  owner: string;
  due: string;
  done: boolean;
};

export type Risk = {
  id: string;
  title: string;
  severity: "low" | "medium" | "high";
  team: TeamKey;
  owner: string;
};

export type Launch = {
  id: string;
  code: string;
  name: string;
  description: string;
  status: LaunchStatus;
  priority: Priority;
  progress: number;
  targetDate: string;
  owner: { name: string; initials: string };
  teams: TeamKey[];
  activities: Activity[];
  risks: Risk[];
  updates: { at: string; author: string; text: string }[];
};

export type User = {
  id: string;
  name: string;
  role: Role;
  team?: TeamKey;
  avatar?: string;
};

export const permissions: Record<Role, {
  canCreateLaunch: boolean;
  canApproveMilestones: boolean;
  canDefineScope: boolean;
  canManageTeamTasks: TeamKey[];
  canViewAll: boolean;
}> = {
  executive: {
    canCreateLaunch: true,
    canApproveMilestones: true,
    canDefineScope: true,
    canManageTeamTasks: ["marketing", "sales", "dev", "product", "exec"],
    canViewAll: true,
  },
  product_manager: {
    canCreateLaunch: true,
    canApproveMilestones: false,
    canDefineScope: true,
    canManageTeamTasks: ["marketing", "sales", "dev", "product", "exec"],
    canViewAll: true,
  },
  marketing: {
    canCreateLaunch: false,
    canApproveMilestones: false,
    canDefineScope: false,
    canManageTeamTasks: ["marketing"],
    canViewAll: true,
  },
  sales: {
    canCreateLaunch: false,
    canApproveMilestones: false,
    canDefineScope: false,
    canManageTeamTasks: ["sales"],
    canViewAll: true,
  },
  engineering: {
    canCreateLaunch: false,
    canApproveMilestones: false,
    canDefineScope: false,
    canManageTeamTasks: ["dev"],
    canViewAll: true,
  },
  viewer: {
    canCreateLaunch: false,
    canApproveMilestones: false,
    canDefineScope: false,
    canManageTeamTasks: [],
    canViewAll: true,
  },
};

export const rolesMeta: Record<Role, { label: string; description: string }> = {
  executive: {
    label: "Diretoria",
    description: "Vê tudo, cria lançamentos, aprova marcos críticos, foca em dashboards e KPIs.",
  },
  product_manager: {
    label: "Gerente de Produto",
    description: "Dono do lançamento, define escopo, datas, responsáveis e dependências.",
  },
  marketing: {
    label: "Marketing",
    description: "Gerencia tarefas de campanha, conteúdo, mídia, lançamento de comunicação.",
  },
  sales: {
    label: "Vendas",
    description: "Gerencia treinamento de time, materiais comerciais, pipeline pré-lançamento.",
  },
  engineering: {
    label: "Desenvolvimento",
    description: "Gerencia entregáveis técnicos, sprints, releases.",
  },
  viewer: {
    label: "Membro Geral",
    description: "Visualiza e contribui nas tarefas que lhe forem atribuídas.",
  },
};

export const launches: Launch[] = [
  {
    id: "l-1",
    code: "LH-101",
    name: "Aurora — Plano Enterprise",
    description: "Lançamento do plano Enterprise com SSO, auditoria e suporte dedicado.",
    status: "in_progress",
    priority: "critical",
    progress: 68,
    targetDate: "2026-05-22",
    owner: { name: "Marina Reis", initials: "MR" },
    teams: ["product", "dev", "marketing", "sales", "exec"],
    activities: [
      { id: "a1", team: "product", title: "Finalizar PRD do módulo de auditoria", owner: "João P.", due: "2026-05-05", done: true },
      { id: "a2", team: "dev", title: "Integração SAML/SSO em produção", owner: "Lia S.", due: "2026-05-12", done: false },
      { id: "a3", team: "marketing", title: "Landing page Enterprise + estudos de caso", owner: "Beatriz L.", due: "2026-05-15", done: false },
      { id: "a4", team: "sales", title: "Treinamento do time comercial e playbook", owner: "Rafa C.", due: "2026-05-18", done: false },
      { id: "a5", team: "exec", title: "Aprovar pricing final e comunicado público", owner: "Diretoria", due: "2026-05-19", done: false },
    ],
    risks: [
      { id: "r1", title: "Atraso na homologação do provedor SSO", severity: "high", team: "dev", owner: "Lia S." },
      { id: "r2", title: "Material de vendas ainda sem revisão jurídica", severity: "medium", team: "sales", owner: "Rafa C." },
    ],
    updates: [
      { at: "há 2h", author: "Marina Reis", text: "Migramos a integração SSO para o ambiente de staging. Time de QA validando hoje." },
      { at: "ontem", author: "Beatriz L.", text: "Primeira versão da landing pronta. Aguardando review da diretoria." },
    ],
  },
  {
    id: "l-2",
    code: "LH-102",
    name: "Mobile App 2.0",
    description: "Redesign completo do app mobile com offline-first e novos onboarding flows.",
    status: "at_risk",
    priority: "high",
    progress: 42,
    targetDate: "2026-06-10",
    owner: { name: "Diego Antunes", initials: "DA" },
    teams: ["product", "dev", "marketing"],
    activities: [
      { id: "a1", team: "dev", title: "Implementar sync offline", owner: "Caio M.", due: "2026-05-20", done: false },
      { id: "a2", team: "product", title: "Validação de usabilidade com 8 clientes", owner: "Helena P.", due: "2026-05-08", done: true },
      { id: "a3", team: "marketing", title: "Campanha de pré-lançamento", owner: "Beatriz L.", due: "2026-06-01", done: false },
    ],
    risks: [
      { id: "r1", title: "Performance abaixo da meta no Android", severity: "high", team: "dev", owner: "Caio M." },
    ],
    updates: [
      { at: "há 5h", author: "Diego Antunes", text: "Reorganizando escopo da v2.0. Vamos cortar feature de widgets para garantir prazo." },
    ],
  },
  {
    id: "l-3",
    code: "LH-103",
    name: "Integração com HubSpot",
    description: "Sincronização bi-direcional de contatos, deals e atividades.",
    status: "planning",
    priority: "medium",
    progress: 18,
    targetDate: "2026-07-04",
    owner: { name: "Sofia Andrade", initials: "SA" },
    teams: ["dev", "sales", "product"],
    activities: [
      { id: "a1", team: "product", title: "Mapeamento de campos e regras de merge", owner: "Helena P.", due: "2026-05-25", done: false },
      { id: "a2", team: "dev", title: "Spike técnico: rate limits da API", owner: "Lia S.", due: "2026-05-30", done: false },
    ],
    risks: [],
    updates: [
      { at: "há 1d", author: "Sofia Andrade", text: "Kickoff realizado com o time comercial. Definimos escopo da v1." },
    ],
  },
  {
    id: "l-4",
    code: "LH-104",
    name: "Nova Pricing Page",
    description: "Reestruturação completa da pricing com calculadora ROI e comparador.",
    status: "blocked",
    priority: "medium",
    progress: 30,
    targetDate: "2026-05-30",
    owner: { name: "Beatriz Lima", initials: "BL" },
    teams: ["marketing", "exec", "product"],
    activities: [
      { id: "a1", team: "marketing", title: "Wireframes finais aprovados", owner: "Beatriz L.", due: "2026-05-02", done: true },
      { id: "a2", team: "exec", title: "Definição final de pricing tiers", owner: "Diretoria", due: "2026-05-04", done: false },
    ],
    risks: [
      { id: "r1", title: "Pricing não definido — bloqueia desenvolvimento", severity: "high", team: "exec", owner: "Diretoria" },
    ],
    updates: [
      { at: "há 3d", author: "Beatriz Lima", text: "Aguardando bate-papo final com a diretoria sobre os preços do tier Pro." },
    ],
  },
  {
    id: "l-5",
    code: "LH-100",
    name: "Programa de Parceiros",
    description: "Lançamento oficial do programa de afiliados e revendedores.",
    status: "launched",
    priority: "high",
    progress: 100,
    targetDate: "2026-04-15",
    owner: { name: "Rafael Costa", initials: "RC" },
    teams: ["sales", "marketing", "exec"],
    activities: [],
    risks: [],
    updates: [
      { at: "há 2sem", author: "Rafael Costa", text: "Lançamento concluído com 47 parceiros ativos no primeiro mês 🎉" },
    ],
  },
  {
    id: "l-6",
    code: "LH-105",
    name: "API Pública v3",
    description: "Nova versão da API com webhooks, OAuth 2.0 e rate limits dinâmicos.",
    status: "in_progress",
    priority: "high",
    progress: 55,
    targetDate: "2026-06-20",
    owner: { name: "Lia Souza", initials: "LS" },
    teams: ["dev", "product"],
    activities: [
      { id: "a1", team: "dev", title: "OAuth 2.0 flow completo", owner: "Caio M.", due: "2026-05-25", done: false },
      { id: "a2", team: "product", title: "Documentação técnica revisada", owner: "Helena P.", due: "2026-06-05", done: false },
    ],
    risks: [],
    updates: [
      { at: "há 6h", author: "Lia Souza", text: "Endpoints v3 deployados em sandbox. Coletando feedback de devs beta." },
    ],
  },
];

export function getLaunch(id: string) {
  return launches.find((l) => l.id === id || l.code.toLowerCase() === id.toLowerCase());
}
