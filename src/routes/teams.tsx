import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { launches, teams, type TeamKey } from "@/lib/mockData";

export const Route = createFileRoute("/teams")({
  head: () => ({ meta: [{ title: "Times — LaunchHub" }, { name: "description", content: "Atividade por time" }] }),
  component: Teams,
});

function Teams() {
  const teamKeys = Object.keys(teams) as TeamKey[];
  return (
    <AppLayout>
      <TopBar title="Times" subtitle="Carga de trabalho e atividades por equipe" />
      <div className="flex-1 px-6 py-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-w-[1400px]">
        {teamKeys.map((t) => {
          const teamLaunches = launches.filter((l) => l.teams.includes(t));
          const activities = launches.flatMap((l) => l.activities.filter((a) => a.team === t));
          const open = activities.filter((a) => !a.done).length;
          return (
            <div key={t} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: teams[t].color }} />
                <h3 className="text-base font-semibold">{teams[t].label}</h3>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Stat n={teamLaunches.length} label="Lançamentos" />
                <Stat n={activities.length} label="Atividades" />
                <Stat n={open} label="Abertas" />
              </div>
              <div className="mt-4 space-y-1.5">
                {teamLaunches.slice(0, 4).map((l) => (
                  <div key={l.id} className="flex items-center justify-between text-xs">
                    <span className="truncate">{l.name}</span>
                    <span className="text-muted-foreground tabular-nums">{l.progress}%</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-lg bg-surface/60 border border-border py-2">
      <p className="text-lg font-semibold tabular-nums">{n}</p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}
