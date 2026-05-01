import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { StatusBadge, TeamChip, ProgressBar, Avatar, PriorityDot } from "@/components/Badges";
import { launches, statusMeta, type LaunchStatus } from "@/lib/mockData";

export const Route = createFileRoute("/launches")({
  head: () => ({
    meta: [
      { title: "Lançamentos — LaunchHub" },
      { name: "description", content: "Lista completa de lançamentos: status, prazos, responsáveis e progresso." },
    ],
  }),
  component: LaunchesList,
});

const filters: { key: LaunchStatus | "all"; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "in_progress", label: "Em execução" },
  { key: "planning", label: "Planejamento" },
  { key: "at_risk", label: "Em risco" },
  { key: "blocked", label: "Bloqueado" },
  { key: "launched", label: "Lançado" },
];

function LaunchesList() {
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("all");
  const list = filter === "all" ? launches : launches.filter((l) => l.status === filter);

  return (
    <AppLayout>
      <TopBar title="Lançamentos" subtitle={`${launches.length} lançamentos no workspace`} />
      <div className="flex-1 px-6 py-6 space-y-4 max-w-[1400px]">
        <div className="flex items-center gap-1 overflow-x-auto">
          {filters.map((f) => {
            const count = f.key === "all" ? launches.length : launches.filter((l) => l.status === f.key).length;
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium border transition-colors ${
                  active ? "bg-primary/15 text-primary border-primary/40" : "bg-surface text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {f.label}
                <span className="opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-4 py-2.5 border-b border-border bg-surface/40 text-[10px] uppercase tracking-widest text-muted-foreground">
            <div className="col-span-5">Lançamento</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Progresso</div>
            <div className="col-span-1">Prioridade</div>
            <div className="col-span-1">Owner</div>
            <div className="col-span-1 text-right">Prazo</div>
          </div>
          <div className="divide-y divide-border">
            {list.map((l) => (
              <Link
                key={l.id}
                to="/launches/$id"
                params={{ id: l.id }}
                className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-surface/50 transition-colors"
              >
                <div className="col-span-5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">{l.code}</span>
                    <span className="text-sm font-medium truncate">{l.name}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {l.teams.map((t) => <TeamChip key={t} team={t} />)}
                  </div>
                </div>
                <div className="col-span-2"><StatusBadge status={l.status} /></div>
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={l.progress} />
                    <span className="text-[11px] text-muted-foreground tabular-nums w-8">{l.progress}%</span>
                  </div>
                </div>
                <div className="col-span-1"><PriorityDot priority={l.priority} /></div>
                <div className="col-span-1"><Avatar initials={l.owner.initials} /></div>
                <div className="col-span-1 text-right text-[11px] text-muted-foreground tabular-nums">
                  {new Date(l.targetDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                </div>
              </Link>
            ))}
            {list.length === 0 && (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">Nenhum lançamento neste filtro.</div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
