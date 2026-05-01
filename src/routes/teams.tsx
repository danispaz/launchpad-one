import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { launches, teams, type TeamKey } from "@/lib/mockData";

export const Route = createFileRoute("/teams")({
  head: () => ({ meta: [{ title: "Times — LaunchHub" }] }),
  component: Teams,
});

function Teams() {
  const teamKeys = Object.keys(teams) as TeamKey[];
  return (
    <AppLayout>
      <TopBar title="Times" subtitle="Distribuição de carga" />
      <div className="flex-1 px-8 py-10 max-w-[1200px] mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {teamKeys.map((t) => {
          const teamLaunches = launches.filter((l) => l.teams.includes(t));
          const activities = launches.flatMap((l) => l.activities.filter((a) => a.team === t));
          const open = activities.filter((a) => !a.done).length;
          return (
            <div key={t} className="p-6 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 mb-6">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: teams[t].color }} />
                <h3 className="text-lg font-bold">{teams[t].label}</h3>
              </div>
              <div className="flex gap-6 mb-8">
                <div>
                  <p className="text-2xl font-bold">{teamLaunches.length}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Lançamentos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{open}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tarefas</p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Projetos ativos</p>
                {teamLaunches.slice(0, 3).map((l) => (
                  <div key={l.id} className="text-xs flex items-center justify-between">
                    <span className="truncate pr-2">{l.name}</span>
                    <span className="text-muted-foreground shrink-0">{l.progress}%</span>
                  </div>
                ))}
                {teamLaunches.length === 0 && <p className="text-xs text-muted-foreground italic">Sem projetos no momento.</p>}
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
