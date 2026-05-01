import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { launches, teams } from "@/lib/mockData";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/risks")({
  head: () => ({ meta: [{ title: "Riscos — LaunchHub" }, { name: "description", content: "Riscos abertos em todos os lançamentos" }] }),
  component: Risks,
});

function Risks() {
  const all = launches.flatMap((l) => l.risks.map((r) => ({ ...r, launch: l })));
  return (
    <AppLayout>
      <TopBar title="Riscos" subtitle={`${all.length} riscos abertos`} />
      <div className="flex-1 px-6 py-6 max-w-[1400px]">
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {all.map((r) => (
            <div key={r.launch.id + r.id} className="px-4 py-3 flex items-start gap-3">
              <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${r.severity === "high" ? "bg-destructive" : r.severity === "medium" ? "bg-warning" : "bg-muted-foreground"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{r.title}</p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{teams[r.team].label}</span>
                  <span>·</span>
                  <span>{r.owner}</span>
                  <span>·</span>
                  <Link to="/launches/$id" params={{ id: r.launch.id }} className="font-mono hover:text-primary">{r.launch.code} {r.launch.name}</Link>
                </div>
              </div>
              <span className={`text-[10px] uppercase tracking-widest ${r.severity === "high" ? "text-destructive" : r.severity === "medium" ? "text-warning" : "text-muted-foreground"}`}>
                {r.severity === "high" ? "Alta" : r.severity === "medium" ? "Média" : "Baixa"}
              </span>
            </div>
          ))}
          {all.length === 0 && (
            <div className="p-12 text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Nenhum risco aberto.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
