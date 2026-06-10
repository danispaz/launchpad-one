import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { usePermissions } from "@/lib/usePermissions";
import { PerfilList } from "@/components/permissoes/PerfilList";
import { PermissionsMatrix } from "@/components/permissoes/PermissionsMatrix";
import { useState } from "react";

export const Route = createFileRoute("/permissoes")({
  head: () => ({ meta: [{ title: "Permissões — LaunchHub" }] }),
  component: PermissoesPage,
});

function PermissoesPage() {
  const { can, loading } = usePermissions();
  const [selectedPerfilId, setSelectedPerfilId] = useState<string | null>(null);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!can("permissoes", "ver")) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] text-center p-6">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🚫</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Acesso Negado</h2>
          <p className="text-slate-500">Você não tem acesso a esta área.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <TopBar title="Permissões" subtitle="Gerenciamento de perfis e acessos" />
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50/30">
        <div className="w-full md:w-80 border-r border-slate-100 bg-white">
          <PerfilList 
            selectedId={selectedPerfilId} 
            onSelect={setSelectedPerfilId} 
          />
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {selectedPerfilId ? (
            <PermissionsMatrix perfilId={selectedPerfilId} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <span className="text-xl">👤</span>
              </div>
              <p className="text-sm font-medium">Selecione um perfil para gerenciar as permissões</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
