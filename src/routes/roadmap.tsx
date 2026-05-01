import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { StatusBadge } from "@/components/Badges";
import { launches } from "@/lib/mockData";

export const Route = createFileRoute("/roadmap")({
  head: () => ({ meta: [{ title: "Roadmap — LaunchHub" }, { name: "description", content: "Roadmap visual dos lançamentos." }] }),
  component: Roadmap,
});

function Roadmap() {
  const sorted = [...launches].sort((a, b) => a.targetDate.localeCompare(b.targetDate));
  const months = Array.from(new Set(sorted.map((l) => l.targetDate.slice(0, 7))));

  return (
    <AppLayout>
      <TopBar title="Roadmap" subtitle="Linha do tempo dos próximos lançamentos" />
      <div className="flex-1 px-6 py-6 max-w-[1400px]">
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {months.map((m) => {
            const items = sorted.filter((l) => l.targetDate.startsWith(m));
            const monthLabel = new Date(m + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
            return (
              <div key={m} className="border-b border-border last:border-0">
                <div className="px-4 py-2 bg-surface/40 text-[10px] uppercase tracking-widest text-muted-foreground sticky top-14">
                  {monthLabel}
                </div>
                <ul className="divide-y divide-border">
                  {items.map((l) => (
                    <li key={l.id}>
                      <Link to="/launches/$id" params={{ id: l.id }} className="flex items-center gap-3 px-4 py-3 hover:bg-surface/50">
                        <div className="h-9 w-9 rounded-lg bg-surface-elevated flex flex-col items-center justify-center border border-border">
                          <span className="text-xs font-semibold leading-none">{new Date(l.targetDate).getDate()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-muted-foreground">{l.code}</span>
                            <span className="text-sm font-medium truncate">{l.name}</span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">{l.description}</p>
                        </div>
                        <div className="hidden md:block w-48">
                          <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                            <div className="h-full bg-gradient-primary" style={{ width: `${l.progress}%` }} />
                          </div>
                          <p className="mt-1 text-[10px] text-muted-foreground text-right tabular-nums">{l.progress}%</p>
                        </div>
                        <StatusBadge status={l.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
