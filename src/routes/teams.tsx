import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { useTeams } from "@/hooks/useTeams";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/teams")({
  head: () => ({ meta: [{ title: "Times — LaunchHub" }] }),
  component: Teams,
});

function Teams() {
  const { teams, isLoading } = useTeams();

  return (
    <AppLayout>
      <TopBar title="Times" subtitle="Distribuição de carga" />
      <div className="flex-1 px-8 py-10 max-w-[1200px] mx-auto w-full">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teams.map((team) => (
              <div key={team.id} className="p-6 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2 mb-6">
                  <span 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: team.color }} 
                  />
                  <h3 className="text-lg font-bold">{team.name}</h3>
                </div>
                
                <div className="flex gap-6 mb-8">
                  <div>
                    <p className="text-2xl font-bold">{team.launchesCount}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Lançamentos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{team.tasksCount}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tarefas</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Projetos ativos</p>
                  {team.activeProjects.map((project) => (
                    <div key={project.id} className="text-xs flex items-center justify-between">
                      <span className="truncate pr-2">{project.name}</span>
                      <span className="text-muted-foreground shrink-0">{project.progress}%</span>
                    </div>
                  ))}
                  {team.activeProjects.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">Sem projetos no momento.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

