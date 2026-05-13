import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Launch {
  id: string;
  nome: string;
  status: string;
  data_inicio: string | null;
  data_lancamento_prevista: string | null;
}

const STATUS_COLORS: Record<string, { bar: string; text: string }> = {
  "Planejamento": { bar: "bg-slate-400", text: "text-slate-600" },
  "Em Andamento": { bar: "bg-blue-500", text: "text-blue-600" },
  "Concluído":    { bar: "bg-emerald-500", text: "text-emerald-600" },
  "Atrasado":     { bar: "bg-rose-500", text: "text-rose-600" },
  "Cancelado":    { bar: "bg-slate-300", text: "text-slate-400" },
};

const QUARTERS = [
  { label: "Q1", months: [0, 1, 2], monthNames: ["Jan", "Fev", "Mar"] },
  { label: "Q2", months: [3, 4, 5], monthNames: ["Abr", "Mai", "Jun"] },
  { label: "Q3", months: [6, 7, 8], monthNames: ["Jul", "Ago", "Set"] },
  { label: "Q4", months: [9, 10, 11], monthNames: ["Out", "Nov", "Dez"] },
];

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getDaysInYear(year: number): number {
  return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
}

interface BarPosition {
  left: string;
  width: string;
  visible: boolean;
}

function getBarPosition(launch: Launch, year: number): BarPosition {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const totalDays = getDaysInYear(year);

  let start = launch.data_inicio ? new Date(launch.data_inicio) : null;
  let end = launch.data_lancamento_prevista ? new Date(launch.data_lancamento_prevista) : null;

  if (!start && !end) return { left: "0%", width: "0%", visible: false };
  if (!start) start = end!;
  if (!end) end = start;

  if (end < yearStart || start > yearEnd) return { left: "0%", width: "0%", visible: false };

  const clampedStart = start < yearStart ? yearStart : start;
  const clampedEnd = end > yearEnd ? yearEnd : end;

  const startDay = getDayOfYear(clampedStart);
  const endDay = getDayOfYear(clampedEnd);

  const left = ((startDay - 1) / totalDays) * 100;
  const width = Math.max(((endDay - startDay + 1) / totalDays) * 100, 2);

  return { left: `${left.toFixed(2)}%`, width: `${width.toFixed(2)}%`, visible: true };
}

interface Props {
  productId: string;
}

export function ProductRoadmap({ productId }: Props) {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    async function fetchLaunches() {
      setLoading(true);
      const { data, error } = await supabase
        .from("launches")
        .select("id, nome, status, data_inicio, data_lancamento_prevista")
        .eq("product_id", productId)
        .order("data_inicio", { ascending: true });

      if (error) {
        toast.error("Erro ao carregar roadmap", { description: error.message });
      } else {
        setLaunches(data || []);
      }
      setLoading(false);
    }
    fetchLaunches();
  }, [productId]);

  const visibleLaunches = launches.filter(l => getBarPosition(l, year).visible);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtro de ano */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setYear(y => y - 1)}
          className="h-8 w-8 rounded border border-border flex items-center justify-center hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <span className="text-sm font-bold text-foreground w-12 text-center">{year}</span>
        <button
          onClick={() => setYear(y => y + 1)}
          className="h-8 w-8 rounded border border-border flex items-center justify-center hover:bg-slate-50 transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <span className="text-xs text-muted-foreground ml-2">
          {visibleLaunches.length} lançamento{visibleLaunches.length !== 1 ? "s" : ""} neste ano
        </span>
      </div>

      {/* Grid do roadmap */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header quarters */}
        <div className="grid grid-cols-4 border-b border-slate-100">
          {QUARTERS.map(q => (
            <div key={q.label} className="border-r border-slate-100 last:border-r-0">
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">{q.label}</span>
              </div>
              <div className="grid grid-cols-3">
                {q.monthNames.map(m => (
                  <div key={m} className="px-2 py-1.5 text-[10px] text-slate-400 font-medium border-r border-slate-50 last:border-r-0">
                    {m}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Linhas de lançamentos */}
        {launches.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-slate-400 font-medium">Nenhum lançamento cadastrado para este produto.</p>
          </div>
        ) : visibleLaunches.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-slate-400 font-medium">Nenhum lançamento em {year}.</p>
            <p className="text-xs text-slate-300 mt-1">Use as setas para navegar entre os anos.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {launches.map(launch => {
              const pos = getBarPosition(launch, year);
              const colors = STATUS_COLORS[launch.status] || STATUS_COLORS["Planejamento"];
              return (
                <div key={launch.id} className="flex items-center h-14 px-4 gap-4 hover:bg-slate-50/50 transition-colors">
                  {/* Nome */}
                  <div className="w-40 shrink-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{launch.nome}</p>
                    <p className={`text-[10px] font-bold uppercase ${colors.text}`}>{launch.status}</p>
                  </div>
                  {/* Barra */}
                  <div className="flex-1 relative h-6">
                    {pos.visible && (
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 h-5 rounded-full ${colors.bar} opacity-90 flex items-center px-2 overflow-hidden`}
                        style={{ left: pos.left, width: pos.width }}
                        title={`${launch.data_inicio || "?"} → ${launch.data_lancamento_prevista || "?"}`}
                      >
                        <span className="text-[9px] font-bold text-white truncate">{launch.nome}</span>
                      </div>
                    )}
                    {!pos.visible && (
                      <span className="text-[10px] text-slate-300 italic">fora deste ano</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 flex-wrap">
        {Object.entries(STATUS_COLORS).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`h-2.5 w-2.5 rounded-full ${colors.bar}`}></div>
            <span className="text-[10px] text-slate-500 font-medium">{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
