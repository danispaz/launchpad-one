import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { StatusBadge } from "@/components/Badges";
import { launches } from "@/lib/mockData";

export const Route = createFileRoute("/roadmap")({
  head: () => ({ meta: [{ title: "Roadmap — LaunchHub" }] }),
  component: Roadmap,
});

function Roadmap() {
  const sorted = [...launches].sort((a, b) => a.targetDate.localeCompare(b.targetDate));
  const months = Array.from(new Set(sorted.map((l) => l.targetDate.slice(0, 7))));

  return (
    <AppLayout>
      <TopBar title="Roadmap" subtitle="Cronograma de lançamentos" />
      <div className="flex-1 px-8 py-10 max-w-[1000px] mx-auto w-full">
        <div className="space-y-12">
          {months.map((m) => {
            const items = sorted.filter((l) => l.targetDate.startsWith(m));
            const monthLabel = new Date(m + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
            return (
              <div key={m}>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-6 pb-2 border-b border-border">
                  {monthLabel}
                </h3>
                <div className="space-y-2">
                  {items.map((l) => (
                    <Link
                      key={l.id}
                      to="/launches/$id"
                      params={{ id: l.id }}
                      className="flex items-center gap-4 p-3 rounded hover:bg-surface transition-colors group"
                    >
                      <div className="w-10 h-10 rounded border border-border bg-surface flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] uppercase text-muted-foreground leading-none">{new Date(l.targetDate).toLocaleString("pt-BR", { month: "short" }).replace(".", "")}</span>
                        <span className="text-sm font-bold leading-none mt-1">{new Date(l.targetDate).getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold group-hover:underline">{l.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{l.description}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-[11px] font-mono text-muted-foreground tabular-nums">{l.progress}%</span>
                        <StatusBadge status={l.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
