import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { StatusBadge, TeamChip, ProgressBar, Avatar } from "@/components/Badges";
import { getLaunch, teams, type TeamKey } from "@/lib/mockData";
import { ChevronLeft, Calendar, Target, CheckCircle2, Circle, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/launches/$id")({
  loader: ({ params }) => {
    const launch = getLaunch(params.id);
    if (!launch) throw notFound();
    return { launch };
  },
  component: LaunchDetail,
});

function LaunchDetail() {
  const { launch: l } = Route.useLoaderData();

  const byTeam = l.teams.reduce<Partial<Record<TeamKey, typeof l.activities>>>((acc, t) => {
    acc[t] = l.activities.filter((a: any) => a.team === t);
    return acc;
  }, {});

  return (
    <AppLayout>
      <TopBar title={l.name} />
      <div className="flex-1 px-8 py-10 max-w-[1000px] mx-auto w-full">
        <Link to="/launches" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-8">
          <ChevronLeft className="h-3 w-3" /> Lançamentos
        </Link>

        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-mono text-muted-foreground">{l.code}</span>
            <StatusBadge status={l.status} />
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-4">{l.name}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl">{l.description}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          <div className="space-y-6">
            <Meta icon={Target} label="Progresso" value={`${l.progress}%`} />
            <div className="pt-2"><ProgressBar value={l.progress} /></div>
          </div>
          <Meta icon={Calendar} label="Data Alvo" value={new Date(l.targetDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })} />
          <Meta icon={Avatar} label="Responsável" value={l.owner.name} />
        </div>

        <div className="space-y-16">
          {/* Activities */}
          <section>
            <h3 className="text-xl font-bold mb-8">Atividades</h3>
            <div className="space-y-10">
              {l.teams.map((t: TeamKey) => {
                const acts = byTeam[t];
                if (!acts || acts.length === 0) return null;
                return (
                  <div key={t}>
                    <div className="flex items-center gap-2 mb-4">
                      <TeamChip team={t} />
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{acts.length} tarefas</span>
                    </div>
                    <ul className="space-y-3">
                      {acts.map((a: any) => (
                        <li key={a.id} className="flex items-start gap-3 group">
                          {a.done ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> : <Circle className="h-5 w-5 text-muted-foreground shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${a.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{a.title}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{a.owner} · {fmtDate(a.due)}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Timeline / Updates */}
          <section>
            <div className="flex items-center gap-2 mb-8">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-xl font-bold">Registro de Atividades</h3>
            </div>
            <div className="space-y-6 border-l border-border pl-6 relative">
              {l.updates.map((u: any, i: number) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[31px] top-1.5 h-2 w-2 rounded-full bg-border" />
                  <p className="text-xs font-medium text-muted-foreground mb-1">{u.author} · {u.at}</p>
                  <p className="text-sm text-foreground/90">{u.text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}

function Meta({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="text-base font-semibold">{value}</p>
    </div>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
