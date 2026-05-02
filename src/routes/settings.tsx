import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { rolesMeta } from "@/lib/permissions";
import { Shield, Users, Bell, Zap, Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Configurações — LaunchHub" }] }),
  component: Settings,
});

function Settings() {
  return (
    <AppLayout>
      <TopBar title="Configurações" subtitle="Gerencie as permissões e workspace" />
      <div className="flex-1 px-8 py-10 max-w-5xl space-y-12">
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Papéis e Permissões</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(rolesMeta).map(([role, meta]) => (
              <div key={role} className="rounded-lg border border-border bg-white p-5 hover:border-primary/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-foreground capitalize">{meta.label}</h3>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground uppercase tracking-wider">
                    {role.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{meta.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-6">
            <SettingsIcon className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Workspace</h2>
          </div>
          <div className="space-y-4">
            {[
              { t: "Configurações Gerais", d: "Nome, logo e domínio do workspace.", icon: SettingsIcon },
              { t: "Gestão de Times", d: "Gerenciar Marketing, Vendas, Dev, Produto e Diretoria.", icon: Users },
              { t: "Integrações", d: "Conectar Slack, Linear, Jira, HubSpot e Notion.", icon: Zap },
              { t: "Notificações", d: "Quando e como o time recebe updates de lançamento.", icon: Bell },
            ].map((s) => (
              <div key={s.t} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-white hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center group-hover:bg-white transition-colors">
                  <s.icon className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{s.t}</h3>
                  <p className="text-xs text-muted-foreground">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
