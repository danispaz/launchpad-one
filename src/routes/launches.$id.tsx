import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { StatusBadge, TeamChip, ProgressBar, Avatar, PriorityDot } from "@/components/Badges";
import { getLaunch, teams, type TeamKey } from "@/lib/mockData";
import { ChevronLeft, Calendar, Target, Users as UsersIcon, AlertTriangle, CheckCircle2, Circle, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/launches/$id")({
  loader: ({ params }) => {
    const launch = getLaunch(params.id);
    if (!launch) throw notFound();
    return { launch };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.launch.name ?? "Lançamento"} — LaunchHub` },
      { name: "description", content: loaderData?.launch.description ?? "" },
    ],
  }),
  notFoundComponent: () => (
    <AppLayout>
      <TopBar title="Lançamento não encontrado" />
      <div className="p-12 text-center">
        <p className="text-sm text-muted-foreground">Esse lançamento não existe ou foi removido.</p>
        <Link to="/launches" className="mt-4 inline-block text-sm text-primary hover:underline">← Voltar para lançamentos</Link>
      </div>
    </AppLayout>
  ),
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{error.message}</div>,
  component: LaunchDetail,
});

function LaunchDetail() {
  const { launch: l } = Route.useLoaderData();

  const byTeam = l.teams.reduce<Record<TeamKey, typeof l.activities>>((acc, t) => {
    acc[t] = l.activities.filter((a) => a.team === t);
    return acc;
  }, {} as Record<TeamKey, typeof l.activities>);

  const done = l.activities.filter((a) => a.done).length;

  return (
    <AppLayout>
      <TopBar title={l.name} subtitle={`${l.code} · Owner ${l.owner.name}`} />
      <div className="flex-1 px-6 py-6 max-w-[1400px]">
        <Link to="/launches" className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-3 w-3" /> Lançamentos
        </Link>

        {/* Hero */}
        <div className="rounded-xl border border-border bg-card p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-glow opacity-50 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{l.code}</span>
              <StatusBadge status={l.status} />
              <PriorityDot priority={l.priority} />
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance">{l.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{l.description}</p>

            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
              <Meta icon={Target} label="Progresso" value={`${l.progress}%`} />
              <Meta icon={Calendar} label="Prazo" value={new Date(l.targetDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })} />
              <Meta icon={CheckCircle2} label="Atividades" value={`${done} / ${l.activities.length}`} />
              <Meta icon={AlertTriangle} label="Riscos abertos" value={l.risks.length.toString()} />
            </div>

            <div className="mt-5">
              <ProgressBar value={l.progress} />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex flex-wrap gap-1.5">
                {l.teams.map((t) => <TeamChip key={t} team={t} />)}
              </div>
              <div className="flex items-center gap-2">
                <Avatar initials={l.owner.initials} />
                <span className="text-xs text-muted-foreground">{l.owner.name}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Activities by team */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Atividades por time</h3>
            </div>

            {l.teams.map((t) => {
              const acts = byTeam[t];
              if (!acts || acts.length === 0) return null;
              return (
                <div key={t} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: teams[t].color }} />
                      <h4 className="text-sm font-medium">{teams[t].label}</h4>
                      <span className="text-[10px] text-muted-foreground">{acts.length} atividades</span>
                    </div>
                  </div>
                  <ul className="divide-y divide-border">
                    {acts.map((a) => (
                      <li key={a.id} className="px-4 py-3 flex items-center gap-3">
                        {a.done ? <CheckCircle2 className="h-4 w-4 text-success shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${a.done ? "line-through text-muted-foreground" : ""}`}>{a.title}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{a.owner} · prazo {new Date(a.due).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            {/* Updates */}
            <div className="rounded-xl border border-border bg-card">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Updates recentes</h3>
              </div>
              <ul className="divide-y divide-border">
                {l.updates.map((u, i) => (
                  <li key={i} className="px-4 py-3">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground">{u.author}</span>
                      <span>·</span>
                      <span>{u.at}</span>
                    </div>
                    <p className="mt-1 text-sm text-foreground/90">{u.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Risks sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <h3 className="text-sm font-semibold">Riscos</h3>
              </div>
              {l.risks.length === 0 ? (
                <div className="px-4 py-6 text-xs text-muted-foreground text-center">Nenhum risco aberto 🎉</div>
              ) : (
                <ul className="divide-y divide-border">
                  {l.risks.map((r) => (
                    <li key={r.id} className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${r.severity === "high" ? "bg-destructive" : r.severity === "medium" ? "bg-warning" : "bg-muted-foreground"}`} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium leading-snug">{r.title}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground">{teams[r.team].label} · {r.owner}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold">Stakeholders</h3>
              <div className="mt-3 space-y-2">
                {l.teams.map((t) => (
                  <div key={t} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: teams[t].color }} />
                      <span>{teams[t].label}</span>
                    </div>
                    <span className="text-muted-foreground">{byTeam[t]?.length ?? 0} ativ.</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Meta({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="mt-1 text-base font-semibold tracking-tight">{value}</p>
    </div>
  );
}
