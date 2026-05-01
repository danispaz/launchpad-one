import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { StatusBadge, TeamChip, Avatar, PriorityDot } from "@/components/Badges";
import { launches, type LaunchStatus } from "@/lib/mockData";

export const Route = createFileRoute("/launches")({
  head: () => ({ meta: [{ title: "Lançamentos — LaunchHub" }] }),
  component: LaunchesList,
});

const filters: { key: LaunchStatus | "all"; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "in_progress", label: "Execução" },
  { key: "planning", label: "Planejamento" },
  { key: "at_risk", label: "Risco" },
  { key: "blocked", label: "Bloqueado" },
  { key: "launched", label: "Lançado" },
];

function LaunchesList() {
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("all");
  const list = filter === "all" ? launches : launches.filter((l) => l.status === filter);

  return (
    <AppLayout>
      <TopBar title="Lançamentos" subtitle="Base de dados central" />
      <div className="flex-1 px-8 py-10 max-w-[1200px] mx-auto w-full">
        <div className="flex items-center gap-1 mb-8">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filter === f.key ? "bg-surface-elevated text-foreground" : "text-muted-foreground hover:bg-surface"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Cód.</th>
                <th className="px-4 py-3 text-left font-medium">Nome</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Times</th>
                <th className="px-4 py-3 text-left font-medium">Owner</th>
                <th className="px-4 py-3 text-right font-medium">Prazo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {list.map((l) => (
                <tr key={l.id} className="group hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-4 text-xs font-mono text-muted-foreground">{l.code}</td>
                  <td className="px-4 py-4">
                    <Link to="/launches/$id" params={{ id: l.id }} className="text-sm font-semibold hover:underline">
                      {l.name}
                    </Link>
                  </td>
                  <td className="px-4 py-4"><StatusBadge status={l.status} /></td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {l.teams.slice(0, 3).map((t) => <TeamChip key={t} team={t} />)}
                      {l.teams.length > 3 && <span className="text-[10px] text-muted-foreground">+{l.teams.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Avatar initials={l.owner.initials} />
                      <span className="text-xs text-muted-foreground">{l.owner.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-xs text-muted-foreground">{fmtDate(l.targetDate)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
