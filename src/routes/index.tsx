import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { StatusBadge, TeamChip, ProgressBar, Avatar, PriorityDot } from "@/components/Badges";
import { launches, teams } from "@/lib/mockData";
import { Rocket, AlertTriangle, CheckCircle2, TrendingUp, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LaunchHub — Home" },
    ],
  }),
  component: Overview,
});

function Overview() {
  const active = launches.filter((l) => l.status !== "launched");
  const atRisk = launches.filter((l) => l.status === "at_risk" || l.status === "blocked");
  const allRisks = launches.flatMap((l) => l.risks.map((r) => ({ ...r, launch: l })));

  return (
    <AppLayout>
      <TopBar title="Página Inicial" subtitle="Acompanhe o progresso global" />
      <div className="flex-1 px-8 py-10 max-w-[1200px] mx-auto w-full">
        <div className="mb-10">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Bem-vinda, Marina! 👋</h2>
          <p className="text-muted-foreground">Você tem {active.length} lançamentos ativos e {atRisk.length} que precisam de atenção.</p>
        </div>

        {/* Hero stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Stat icon={Rocket} label="Ativos" value={active.length.toString()} tone="primary" />
          <Stat icon={AlertTriangle} label="Riscos" value={atRisk.length.toString()} tone="warning" />
          <Stat icon={CheckCircle2} label="Lançados" value="12" tone="success" />
          <Stat icon={TrendingUp} label="Eficiência" value="92%" tone="info" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* Recent launches */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Lançamentos em destaque</h3>
                <Link to="/launches" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                  Ver todos <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {active.slice(0, 4).map((l) => (
                  <Link
                    key={l.id}
                    to="/launches/$id"
                    params={{ id: l.id }}
                    className="group block p-5 rounded-lg border border-border hover:bg-surface transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-muted-foreground">{l.code}</span>
                      <StatusBadge status={l.status} />
                    </div>
                    <h4 className="font-semibold mb-1 group-hover:underline">{l.name}</h4>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{l.progress}%</span>
                        <span>{fmtDate(l.targetDate)}</span>
                      </div>
                      <ProgressBar value={l.progress} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-10">
            {/* Risks */}
            <section>
              <h3 className="text-lg font-semibold mb-6">Riscos críticos</h3>
              <div className="space-y-4">
                {allRisks.slice(0, 3).map((r) => (
                  <div key={r.id} className="p-4 rounded-lg bg-surface border border-border/50">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${r.severity === "high" ? "bg-destructive" : "bg-warning"}`} />
                      <div>
                        <p className="text-sm font-medium leading-snug">{r.title}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground uppercase tracking-wider">{r.launch.code} · {teams[r.team].label}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {allRisks.length === 0 && <p className="text-sm text-muted-foreground">Tudo limpo por aqui.</p>}
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: string }) {
  return (
    <div className="p-5 rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
