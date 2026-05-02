export interface RoleMeta {
  label: string;
  description: string;
  permissions: string[];
}

export const rolesMeta: Record<string, RoleMeta> = {
  admin: {
    label: "Administrador",
    description: "Acesso total ao sistema, gerenciamento de usuários e configurações globais.",
    permissions: ["all"],
  },
  manager: {
    label: "Gerente de Lançamento",
    description: "Cria e edita lançamentos, gerencia times e visualiza todos os cronogramas.",
    permissions: ["create_launch", "edit_launch", "manage_teams"],
  },
  contributor: {
    label: "Contribuidor",
    description: "Atualiza o progresso de suas tarefas e visualiza cronogramas de lançamentos.",
    permissions: ["update_task", "view_roadmap"],
  },
  viewer: {
    label: "Visualizador",
    description: "Acesso apenas leitura para acompanhar o progresso dos lançamentos.",
    permissions: ["view_all"],
  },
};

export function canCreateLaunch(role: string): boolean {
  return role === 'admin' || role === 'manager';
}

export function canEditTask(role: string): boolean {
  return role === 'admin' || role === 'manager' || role === 'contributor';
}
