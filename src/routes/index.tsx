import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { StatusBadge, TeamChip, ProgressBar, Avatar, PriorityDot } from "@/components/Badges";
import { launches, teams } from "@/lib/mockData";
import { Rocket, AlertTriangle, CheckCircle2, Clock, ArrowUpRight, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LaunchHub — Painel de lançamentos de produto" },
      { name: "description", content: "Coordene Marketing, Vendas, Dev, Produto e Diretoria em um único painel de lançamento." },
      { property: "og:title", content: "LaunchHub" },
      { property: "og:description", content: "A fonte única da verdade para os lançamentos do seu produto." },
    ],
  }),
  component: Overview,
});

function Overview() {
  const active = launches.filter((l) => l.status !== "launched");
  const atRisk = launches.filter((l) => l.status === "at_risk" || l.status === "blocked");
  const launched = launches.filter((l) => l.status === "launched");
  const allRisks = launches.flatMap((l) => l.risks.map((r) => ({ ...r, launch: l })));

  const upcoming = [...active]
    .sort((a, b) => a.targetDate.localeCompare(b.targetDate))
    .slice(0, 4);

  return (
    <AppLayout>
      <TopBar title="Visão geral" subtitle="Pulse de todos os lançamentos em andamento" />
      <div className="flex-1 px-6 py-6 space-y-6 max-w-[1400px]">
        {/* Hero stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Stat icon={Rocket} label="Lançamentos ativos" value={active.length.toString()} hint="+2 este mês" tone="primary" />
          <Stat icon={AlertTriangle} label="Em risco / bloqueados" value={atRisk.length.toString()} hint="requer atenção" tone="warning" />
          <Stat icon={CheckCircle2} label="Lançados (90d)" value={launched.length.toString()} hint="meta: 4" tone="success" />
          <Stat icon={TrendingUp} label="On-track" value={`${Math.round((active.filter(l=>l.status==="in_progress").length/active.length)*100)}%`} hint="dos ativos" tone="info" />
        </div>

        {/* Active launches */}
        <section>
          <SectionHeader title="Lançamentos ativos" cta={{ label: "Ver todos", to: "/launches" }} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {active.slice(0, 4).map((l) => (
              <Link
                key={l.id}
                to="/launches/$id"
                params={{ id: l.id }}
                className="group rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-elevated transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">{l.code}</span>
                      <StatusBadge status={l.status} />
                    </div>
                    <h3 className="mt-1 text-sm font-semibold tracking-tight truncate">{l.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{l.description}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{l.progress}% completo</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {fmtDate(l.targetDate)}</span>
                </div>
                <div className="mt-1.5"><ProgressBar value={l.progress} /></div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {l.teams.slice(0, 4).map((t) => <TeamChip key={t} team={t} />)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Avatar initials={l.owner.initials} />
                    <PriorityDot priority={l.priority} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Upcoming */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold">Próximos prazos</h3>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Próximos 30 dias</span>
            </div>
            <div className="divide-y divide-border">
              {upcoming.map((l) => (
                <Link key={l.id} to="/launches/$id" params={{ id: l.id }} className="flex items-center gap-3 px-4 py-3 hover:bg-surface/50 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-surface-elevated flex flex-col items-center justify-center border border-border">
                    <span className="text-[9px] uppercase text-muted-foreground leading-none">{new Date(l.targetDate).toLocaleString("pt-BR", { month: "short" }).replace(".", "")}</span>
                    <span className="text-xs font-semibold leading-none mt-0.5">{new Date(l.targetDate).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">{l.code}</span>
                      <span className="text-sm font-medium truncate">{l.name}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">Owner {l.owner.name} · {l.progress}%</div>
                  </div>
                  <StatusBadge status={l.status} />
                </Link>
              ))}
            </div>
          </div>

          {/* Risks */}
          <div className="rounded-xl border border-border bg-card">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold">Riscos abertos</h3>
              <Link to="/risks" className="text-[10px] uppercase tracking-widest text-primary hover:underline">Ver todos</Link>
            </div>
            <div className="divide-y divide-border">
              {allRisks.slice(0, 5).map((r) => (
                <div key={r.id} className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${r.severity === "high" ? "bg-destructive" : r.severity === "medium" ? "bg-warning" : "bg-muted-foreground"}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium leading-snug">{r.title}</p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{teams[r.team].label}</span>
                        <span>·</span>
                        <span>{r.owner}</span>
                        <span>·</span>
                        <span className="font-mono">{r.launch.code}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ icon: Icon, label, value, hint, tone }: { icon: any; label: string; value: string; hint: string; tone: "primary" | "success" | "warning" | "info" }) {
  const colors = {
    primary: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    info: "text-info bg-info/10",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
        </div>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${colors[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, cta }: { title: string; cta?: { label: string; to: string } }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      {cta && (
        <Link to={cta.to} className="text-[11px] text-primary hover:underline inline-flex items-center gap-1">
          {cta.label} <ArrowUpRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
