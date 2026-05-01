import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Configurações — LaunchHub" }] }),
  component: Settings,
});

function Settings() {
  return (
    <AppLayout>
      <TopBar title="Configurações" subtitle="Workspace, times e integrações" />
      <div className="flex-1 px-6 py-6 max-w-3xl space-y-4">
        {[
          { t: "Workspace", d: "Nome, logo e domínio do workspace." },
          { t: "Times", d: "Gerenciar Marketing, Vendas, Dev, Produto e Diretoria." },
          { t: "Integrações", d: "Conectar Slack, Linear, Jira, HubSpot e Notion." },
          { t: "Notificações", d: "Quando e como o time recebe updates de lançamento." },
        ].map((s) => (
          <div key={s.t} className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">{s.t}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
