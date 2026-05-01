import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { StatusBadge, TeamChip, Avatar } from "@/components/Badges";
import { launches, type LaunchStatus, type TeamKey, teams as teamsMeta } from "@/lib/mockData";
import { Filter, X, Search } from "lucide-react";
import { useEffect } from "react";

const STORAGE_KEY = "launchhub_launches_filters";

type LaunchesSearch = {
  status?: LaunchStatus | "all";
  team?: TeamKey | "all";
  q?: string;
};

export const Route = createFileRoute("/launches")({
  head: () => ({ meta: [{ title: "Lançamentos — LaunchHub" }] }),
  validateSearch: (search: Record<string, unknown>): LaunchesSearch => {
    return {
      status: (search.status as LaunchStatus) || "all",
      team: (search.team as TeamKey) || "all",
      q: (search.q as string) || "",
    };
  },
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => {
    // Save to localStorage if we have search params and are in the browser
    if (typeof window !== 'undefined' && Object.keys(deps).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deps));
    }
  },
  component: LaunchesList,
});

const statusFilters: { key: LaunchStatus | "all"; label: string }[] = [
  { key: "all", label: "Todos Status" },
  { key: "in_progress", label: "Execução" },
  { key: "planning", label: "Planejamento" },
  { key: "at_risk", label: "Risco" },
  { key: "blocked", label: "Bloqueado" },
  { key: "launched", label: "Lançado" },
];

const teamKeys = Object.keys(teamsMeta) as TeamKey[];

function LaunchesList() {
  const { status, team, q } = useSearch({ from: "/launches" });
  const navigate = useNavigate({ from: "/launches" });

  // Use useEffect only to initialize search if it's empty
  useEffect(() => {
    if (status === "all" && team === "all" && !q) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          navigate({ search: parsed, replace: true });
        } catch (e) {
          // ignore
        }
      }
    }
  }, []);

  // Update storage whenever filters change
  useEffect(() => {
    if (status !== "all" || team !== "all" || q) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ status, team, q }));
    }
  }, [status, team, q]);

  const filteredList = launches.filter((l) => {
    const statusMatch = status === "all" || l.status === status;
    const teamMatch = team === "all" || l.teams.includes(team as TeamKey);
    
    const searchLower = (q || "").toLowerCase();
    const qMatch = !q || 
      l.name.toLowerCase().includes(searchLower) || 
      l.code.toLowerCase().includes(searchLower) || 
      l.owner.name.toLowerCase().includes(searchLower);

    return statusMatch && teamMatch && qMatch;
  });

  const setStatusFilter = (newStatus: LaunchStatus | "all") => {
    navigate({ search: (prev: LaunchesSearch) => ({ ...prev, status: newStatus }) });
  };

  const setTeamFilter = (newTeam: TeamKey | "all") => {
    navigate({ search: (prev: LaunchesSearch) => ({ ...prev, team: newTeam }) });
  };

  const setQuery = (newQ: string) => {
    navigate({ search: (prev: LaunchesSearch) => ({ ...prev, q: newQ || undefined }) });
  };

  const clearFilters = () => {
    navigate({ search: { status: "all", team: "all", q: "" } });
  };

  const hasFilters = status !== "all" || team !== "all" || !!q;

  return (
    <AppLayout>
      <TopBar title="Lançamentos" subtitle="Base de dados central" />
      <div className="flex-1 px-8 py-10 max-w-[1200px] mx-auto w-full">
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome, código ou responsável..."
                className="w-full bg-white border border-border/50 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-shadow"
                value={q}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <select 
                className="bg-white border border-border/50 rounded-lg px-3 py-2 text-[11px] font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                value={team}
                onChange={(e) => setTeamFilter(e.target.value as TeamKey | "all")}
              >
                <option value="all">Todos os Times</option>
                {teamKeys.map(tk => (
                  <option key={tk} value={tk}>{teamsMeta[tk].label}</option>
                ))}
              </select>

              {hasFilters && (
                <button 
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3" />
                  Limpar
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-surface rounded-lg border border-border/50 w-fit">
            {statusFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                  status === f.key 
                    ? "bg-white text-foreground shadow-sm ring-1 ring-border/50" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full overflow-x-auto bg-white rounded-xl border border-border shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-slate-50/50 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                <th className="px-6 py-4 text-left">Cód.</th>
                <th className="px-6 py-4 text-left">Nome</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Times</th>
                <th className="px-6 py-4 text-left">Owner</th>
                <th className="px-6 py-4 text-right">Prazo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredList.map((l) => (
                <tr key={l.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5 text-xs font-mono text-muted-foreground">{l.code}</td>
                  <td className="px-6 py-5">
                    <Link to="/launches/$id" params={{ id: l.id }} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                      {l.name}
                    </Link>
                  </td>
                  <td className="px-6 py-5"><StatusBadge status={l.status} /></td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1">
                      {l.teams.slice(0, 3).map((t) => <TeamChip key={t} team={t} />)}
                      {l.teams.length > 3 && <span className="text-[10px] text-muted-foreground self-center ml-1">+{l.teams.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Avatar initials={l.owner.initials} />
                      <span className="text-xs text-muted-foreground">{l.owner.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="text-xs font-medium text-muted-foreground">{fmtDate(l.targetDate)}</span>
                  </td>
                </tr>
              ))}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground italic">
                    Nenhum lançamento encontrado com esses filtros.
                  </td>
                </tr>
              )}
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
