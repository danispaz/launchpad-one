import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { StatusBadge } from "@/components/Badges";
import { useRoadmap } from "@/hooks/useRoadmap";
import { useMemo } from "react";

export const Route = createFileRoute("/roadmap")({
  head: () => ({ meta: [{ title: "Roadmap — LaunchHub" }] }),
  component: Roadmap,
});

function Roadmap() {
  const { data: launches, loading, error } = useRoadmap();

  const roadmapByMonth = useMemo(() => {
    if (!launches) return {};

    return launches.reduce((acc, l) => {
      const date = new Date(l.data_lancamento_prevista);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) acc[monthKey] = [];
      acc[monthKey].push(l);
      return acc;
    }, {} as Record<string, typeof launches>);
  }, [launches]);

  const months = useMemo(() => Object.keys(roadmapByMonth).sort(), [roadmapByMonth]);

  if (loading) {
    return (
      <AppLayout>
        <TopBar title="Roadmap" subtitle="Cronograma de lançamentos" />
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <TopBar title="Roadmap" subtitle="Cronograma de lançamentos" />
        <div className="flex flex-col items-center justify-center h-[50vh] space-y-4 text-destructive">
          <p className="font-bold">Erro ao carregar o roadmap</p>
          <button onClick={() => window.location.reload()} className="text-sm text-primary hover:underline font-medium">Tentar novamente</button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <TopBar title="Roadmap" subtitle="Cronograma de lançamentos" />
      <div className="flex-1 px-8 py-10 max-w-[1000px] mx-auto w-full">
        {launches.length === 0 ? (
          <div className="text-center py-20 bg-surface rounded-2xl border border-dashed border-border">
            <p className="text-muted-foreground italic">Nenhum lançamento agendado no roadmap.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {months.map((m) => {
              const items = roadmapByMonth[m];
              const monthLabel = new Date(m + "-02").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
              
              return (
                <div key={m}>
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-6 pb-2 border-b border-border capitalize">
                    {monthLabel}
                  </h3>
                  <div className="space-y-2">
                    {items.map((l) => {
                      const dateObj = new Date(l.data_lancamento_prevista);
                      return (
                        <Link
                          key={l.id}
                          to="/launches/$id"
                          params={{ id: l.id }}
                          className="flex items-center gap-4 p-3 rounded hover:bg-surface transition-colors group"
                        >
                          <div className="w-10 h-10 rounded border border-border bg-surface flex flex-col items-center justify-center shrink-0">
                            <span className="text-[10px] uppercase text-muted-foreground leading-none">
                              {dateObj.toLocaleString("pt-BR", { month: "short" }).replace(".", "")}
                            </span>
                            <span className="text-sm font-bold leading-none mt-1">{dateObj.getDate()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold group-hover:underline">{l.nome}</p>
                            <p className="text-xs text-muted-foreground truncate">{l.descricao || 'Sem descrição.'}</p>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <span className="text-[11px] font-mono text-muted-foreground tabular-nums">{l.progresso}%</span>
                            <StatusBadge status={l.status as any} />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
