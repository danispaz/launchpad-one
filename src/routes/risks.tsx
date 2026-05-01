import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { launches, teams } from "@/lib/mockData";
import { AlertCircle } from "lucide-react";

export const Route = createFileRoute("/risks")({
  head: () => ({ meta: [{ title: "Riscos — LaunchHub" }] }),
  component: Risks,
});

function Risks() {
  const all = launches.flatMap((l) => l.risks.map((r) => ({ ...r, launch: l })));
  return (
    <AppLayout>
      <TopBar title="Riscos" subtitle="Incidentes monitorados" />
      <div className="flex-1 px-8 py-10 max-w-[1000px] mx-auto w-full">
        <div className="space-y-4">
          {all.map((r) => (
            <div key={r.launch.id + r.id} className="p-4 rounded-lg border border-border hover:bg-surface transition-colors flex items-start gap-4">
              <div className={`mt-1 p-1 rounded ${r.severity === "high" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning-foreground"}`}>
                <AlertCircle className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{teams[r.team].label}</span>
                  <span className="text-muted-foreground text-[10px]">·</span>
                  <Link to="/launches/$id" params={{ id: r.launch.id }} className="text-[10px] font-mono hover:underline">{r.launch.code}</Link>
                </div>
                <p className="text-sm font-semibold">{r.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">Responsável: {r.owner}</p>
              </div>
              <div className="shrink-0 pt-1">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${r.severity === "high" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning-foreground"}`}>
                  {r.severity}
                </span>
              </div>
            </div>
          ))}
          {all.length === 0 && (
            <div className="p-12 text-center border-2 border-dashed border-border rounded-xl">
              <p className="text-sm text-muted-foreground">Nenhum risco monitorado no momento.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
