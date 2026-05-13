import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

interface ReleaseItem {
  id: string;
  nome: string;
  status: string;
  ordem: number;
}

interface Release {
  id: string;
  nome: string;
  data_inicio: string | null;
  data_prevista: string | null;
  status: string;
  ordem: number;
  items: ReleaseItem[];
}

interface Launch {
  id: string;
  nome: string;
  status: string;
  data_inicio: string | null;
  data_lancamento_prevista: string | null;
  releases: Release[];
}

const LAUNCH_COLORS: Record<string, { bar: string; text: string }> = {
  "Planejamento": { bar: "bg-slate-400", text: "text-slate-600" },
  "Em Andamento": { bar: "bg-blue-500", text: "text-blue-600" },
  "Concluído":    { bar: "bg-emerald-500", text: "text-emerald-600" },
  "Atrasado":     { bar: "bg-rose-500", text: "text-rose-600" },
  "Cancelado":    { bar: "bg-slate-300", text: "text-slate-400" },
};

const RELEASE_COLORS: Record<string, string> = {
  "Planejamento": "bg-slate-300",
  "Em Andamento": "bg-blue-300",
  "Concluído":    "bg-emerald-300",
  "Atrasado":     "bg-rose-300",
};

const ITEM_STATUS: Record<string, { dot: string; text: string }> = {
  "pendente":     { dot: "bg-slate-300", text: "text-slate-400" },
  "em_progresso": { dot: "bg-blue-400", text: "text-blue-600" },
  "concluido":    { dot: "bg-emerald-400", text: "text-emerald-600" },
};

const QUARTERS = [
  { label: "Q1", monthNames: ["Jan", "Fev", "Mar"] },
  { label: "Q2", monthNames: ["Abr", "Mai", "Jun"] },
  { label: "Q3", monthNames: ["Jul", "Ago", "Set"] },
  { label: "Q4", monthNames: ["Out", "Nov", "Dez"] },
];

function getDaysInYear(year: number): number {
  return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function getBarPosition(startStr: string | null, endStr: string | null, year: number) {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const totalDays = getDaysInYear(year);
  let start = startStr ? new Date(startStr) : null;
  let end = endStr ? new Date(endStr) : null;
  if (!start && !end) return { left: "0%", width: "0%", visible: false };
  if (!start) start = end!;
  if (!end) end = start;
  if (end < yearStart || start > yearEnd) return { left: "0%", width: "0%", visible: false };
  const clampedStart = start < yearStart ? yearStart : start;
  const clampedEnd = end > yearEnd ? yearEnd : end;
  const startDay = getDayOfYear(clampedStart);
  const endDay = getDayOfYear(clampedEnd);
  const left = ((startDay - 1) / totalDays) * 100;
  const width = Math.max(((endDay - startDay + 1) / totalDays) * 100, 1.5);
  return { left: `${left.toFixed(2)}%`, width: `${width.toFixed(2)}%`, visible: true };
}

interface Props {
  productId: string;
}

export function ProductRoadmap({ productId }: Props) {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [expandedLaunches, setExpandedLaunches] = useState<string[]>([]);
  const [expandedReleases, setExpandedReleases] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const { data: launchesRaw, error: lError } = await supabase
          .from("launches")
          .select("id, nome, status, data_inicio, data_lancamento_prevista")
          .eq("product_id", productId)
          .order("data_inicio", { ascending: true });
        if (lError) throw lError;
        if (!launchesRaw?.length) { setLaunches([]); return; }

        const launchIds = launchesRaw.map(l => l.id);
        const { data: releasesRaw, error: rError } = await supabase
          .from("releases")
          .select("*")
          .in("launch_id", launchIds)
          .order("ordem", { ascending: true });
        if (rError) throw rError;

        const releaseIds = (releasesRaw || []).map(r => r.id);
        let itemsRaw: any[] = [];
        if (releaseIds.length > 0) {
          const { data: items, error: iError } = await supabase
            .from("release_items")
            .select("*")
            .in("release_id", releaseIds)
            .order("ordem", { ascending: true });
          if (iError) throw iError;
          itemsRaw = items || [];
        }

        const itemsByRelease = itemsRaw.reduce((acc, item) => {
          if (!acc[item.release_id]) acc[item.release_id] = [];
          acc[item.release_id].push(item);
          return acc;
        }, {} as Record<string, ReleaseItem[]>);

        const releasesByLaunch = (releasesRaw || []).reduce((acc, release) => {
          if (!acc[release.launch_id]) acc[release.launch_id] = [];
          acc[release.launch_id].push({ ...release, items: itemsByRelease[release.id] || [] });
          return acc;
        }, {} as Record<string, Release[]>);

        setLaunches(launchesRaw.map(l => ({ ...l, releases: releasesByLaunch[l.id] || [] })));
      } catch (err: any) {
        toast.error("Erro ao carregar roadmap", { description: err.message });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [productId]);

  const toggleLaunch = (id: string) => setExpandedLaunches(prev =>
    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
  );
  const toggleRelease = (id: string) => setExpandedReleases(prev =>
    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
  );

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setYear(y => y - 1)} className="h-8 w-8 rounded border border-border flex items-center justify-center hover:bg-slate-50 transition-colors">
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <span className="text-sm font-bold w-12 text-center">{year}</span>
        <button onClick={() => setYear(y => y + 1)} className="h-8 w-8 rounded border border-border flex items-center justify-center hover:bg-slate-50 transition-colors">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <span className="text-xs text-muted-foreground ml-2">{launches.length} lançamento{launches.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100">
          <div className="w-48 shrink-0 border-r border-slate-100 bg-slate-50 px-4 py-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lançamento</span>
          </div>
          <div className="flex-1 grid grid-cols-4">
            {QUARTERS.map(q => (
              <div key={q.label} className="border-r border-slate-100 last:border-r-0">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{q.label}</span>
                </div>
                <div className="grid grid-cols-3">
                  {q.monthNames.map(m => (
                    <div key={m} className="px-1 py-1.5 text-[9px] text-slate-400 font-medium text-center">{m}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {launches.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-slate-400">Nenhum lançamento cadastrado.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {launches.map(launch => {
              const lPos = getBarPosition(launch.data_inicio, launch.data_lancamento_prevista, year);
              const lColors = LAUNCH_COLORS[launch.status] || LAUNCH_COLORS["Planejamento"];
              const isExpanded = expandedLaunches.includes(launch.id);
              return (
                <div key={launch.id}>
                  <div className="flex items-center h-12 hover:bg-slate-50/50 transition-colors">
                    <div className="w-48 shrink-0 border-r border-slate-100 px-3 h-full flex items-center gap-1">
                      {launch.releases.length > 0 && (
                        <button onClick={() => toggleLaunch(launch.id)} className="p-0.5 rounded hover:bg-slate-200">
                          <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isExpanded ? "" : "-rotate-90"}`} />
                        </button>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{launch.nome}</p>
                        <p className={`text-[9px] font-bold uppercase ${lColors.text}`}>{launch.status}</p>
                      </div>
                    </div>
                    <div className="flex-1 relative h-full flex items-center">
                      {lPos.visible ? (
                        <div className={`absolute h-6 rounded-full ${lColors.bar} opacity-90 flex items-center px-2 overflow-hidden`}
                          style={{ left: lPos.left, width: lPos.width }}
                          title={`${launch.data_inicio || "?"} → ${launch.data_lancamento_prevista || "?"}`}>
                          <span className="text-[9px] font-bold text-white truncate">{launch.nome}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 italic px-2">fora deste ano</span>
                      )}
                    </div>
                  </div>
                  {isExpanded && launch.releases.map(release => {
                    const rPos = getBarPosition(release.data_inicio, release.data_prevista, year);
                    const rColor = RELEASE_COLORS[release.status] || RELEASE_COLORS["Planejamento"];
                    const isReleaseExpanded = expandedReleases.includes(release.id);
                    return (
                      <div key={release.id} className="bg-slate-50/30">
                        <div className="flex items-center h-10 hover:bg-slate-100/50 transition-colors">
                          <div className="w-48 shrink-0 border-r border-slate-100 px-3 h-full flex items-center gap-1 pl-7">
                            {release.items.length > 0 && (
                              <button onClick={() => toggleRelease(release.id)} className="p-0.5 rounded hover:bg-slate-200">
                                <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isReleaseExpanded ? "" : "-rotate-90"}`} />
                              </button>
                            )}
                            <p className="text-[11px] font-semibold text-slate-600 truncate">{release.nome}</p>
                          </div>
                          <div className="flex-1 relative h-full flex items-center">
                            {rPos.visible && (
                              <div className={`absolute h-4 rounded-full ${rColor} opacity-80 flex items-center px-2 overflow-hidden`}
                                style={{ left: rPos.left, width: rPos.width }}>
                                <span className="text-[8px] font-bold text-white truncate">{release.nome}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {isReleaseExpanded && release.items.map(item => {
                          const iStatus = ITEM_STATUS[item.status] || ITEM_STATUS["pendente"];
                          return (
                            <div key={item.id} className="flex items-center h-8 hover:bg-slate-100/30">
                              <div className="w-48 shrink-0 border-r border-slate-100 h-full flex items-center gap-2 pl-12">
                                <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${iStatus.dot}`}></div>
                                <p className={`text-[10px] truncate ${iStatus.text}`}>{item.nome}</p>
                              </div>
                              <div className="flex-1 h-full"></div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {Object.entries(LAUNCH_COLORS).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`h-2.5 w-2.5 rounded-full ${colors.bar}`}></div>
            <span className="text-[10px] text-slate-500 font-medium">{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
