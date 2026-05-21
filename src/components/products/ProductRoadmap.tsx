import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, ChevronDown, Plus, Trash2, Check, X, Pencil } from "lucide-react";

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
  "Concluído": { bar: "bg-emerald-500", text: "text-emerald-600" },
  "Atrasado": { bar: "bg-rose-500", text: "text-rose-600" },
  "Cancelado": { bar: "bg-slate-300", text: "text-slate-400" },
};

const RELEASE_COLORS: Record<string, string> = {
  "Planejamento": "bg-slate-300",
  "Em Andamento": "bg-blue-300",
  "Concluído": "bg-emerald-300",
  "Atrasado": "bg-rose-300",
};

const RELEASE_STATUSES = ["Planejamento", "Em Andamento", "Concluído", "Atrasado"];
const ITEM_STATUSES = ["pendente", "em_progresso", "concluido"];
const ITEM_STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  em_progresso: "Em progresso",
  concluido: "Concluído",
};

const ITEM_STATUS_STYLE: Record<string, { dot: string; text: string }> = {
  pendente: { dot: "bg-slate-300", text: "text-slate-400" },
  em_progresso: { dot: "bg-blue-400", text: "text-blue-600" },
  concluido: { dot: "bg-emerald-400", text: "text-emerald-600" },
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

interface Props { productId: string; }

export function ProductRoadmap({ productId }: Props) {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [expandedLaunches, setExpandedLaunches] = useState<string[]>([]);
  const [expandedReleases, setExpandedReleases] = useState<string[]>([]);

  // Estados de edição inline
  const [editingRelease, setEditingRelease] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});

  // Estados de criação
  const [addingReleaseToLaunch, setAddingReleaseToLaunch] = useState<string | null>(null);
  const [addingItemToRelease, setAddingItemToRelease] = useState<string | null>(null);
  const [newRelease, setNewRelease] = useState({ nome: "", data_inicio: "", data_prevista: "", status: "Planejamento" });
  const [newItem, setNewItem] = useState({ nome: "", status: "pendente" });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
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
        .from("releases").select("*").in("launch_id", launchIds).order("ordem");
      if (rError) throw rError;

      const releaseIds = (releasesRaw || []).map(r => r.id);
      let itemsRaw: any[] = [];
      if (releaseIds.length > 0) {
        const { data: items, error: iError } = await supabase
          .from("release_items").select("*").in("release_id", releaseIds).order("ordem");
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
  };

  useEffect(() => { fetchData(); }, [productId]);

  const toggleLaunch = (id: string) => setExpandedLaunches(prev =>
    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleRelease = (id: string) => setExpandedReleases(prev =>
    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  // Criar release
  const handleAddRelease = async (launchId: string) => {
    if (!newRelease.nome.trim()) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("releases").insert({
        launch_id: launchId,
        nome: newRelease.nome.trim(),
        data_inicio: newRelease.data_inicio || null,
        data_prevista: newRelease.data_prevista || null,
        status: newRelease.status,
        ordem: 0,
      });
      if (error) throw error;
      toast.success("Release criada!");
      setAddingReleaseToLaunch(null);
      setNewRelease({ nome: "", data_inicio: "", data_prevista: "", status: "Planejamento" });
      if (!expandedLaunches.includes(launchId)) setExpandedLaunches(prev => [...prev, launchId]);
      fetchData();
    } catch (err: any) { toast.error("Erro ao criar release", { description: err.message }); }
    finally { setSaving(false); }
  };

  // Criar item
  const handleAddItem = async (releaseId: string) => {
    if (!newItem.nome.trim()) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("release_items").insert({
        release_id: releaseId,
        nome: newItem.nome.trim(),
        status: newItem.status,
        ordem: 0,
      });
      if (error) throw error;
      toast.success("Item criado!");
      setAddingItemToRelease(null);
      setNewItem({ nome: "", status: "pendente" });
      if (!expandedReleases.includes(releaseId)) setExpandedReleases(prev => [...prev, releaseId]);
      fetchData();
    } catch (err: any) { toast.error("Erro ao criar item", { description: err.message }); }
    finally { setSaving(false); }
  };

  // Editar release
  const startEditRelease = (release: Release) => {
    setEditingRelease(release.id);
    setEditValues({ nome: release.nome, data_inicio: release.data_inicio || "", data_prevista: release.data_prevista || "", status: release.status });
  };

  const saveRelease = async (releaseId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase.from("releases").update({
        nome: editValues.nome,
        data_inicio: editValues.data_inicio || null,
        data_prevista: editValues.data_prevista || null,
        status: editValues.status,
      }).eq("id", releaseId);
      if (error) throw error;
      toast.success("Release atualizada!");
      setEditingRelease(null);
      fetchData();
    } catch (err: any) { toast.error("Erro ao atualizar release", { description: err.message }); }
    finally { setSaving(false); }
  };

  // Editar item
  const startEditItem = (item: ReleaseItem) => {
    setEditingItem(item.id);
    setEditValues({ nome: item.nome, status: item.status });
  };

  const saveItem = async (itemId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase.from("release_items").update({
        nome: editValues.nome,
        status: editValues.status,
      }).eq("id", itemId);
      if (error) throw error;
      toast.success("Item atualizado!");
      setEditingItem(null);
      fetchData();
    } catch (err: any) { toast.error("Erro ao atualizar item", { description: err.message }); }
    finally { setSaving(false); }
  };

  // Deletar release
  const deleteRelease = async (releaseId: string) => {
    if (!window.confirm("Excluir esta release e todos os seus itens?")) return;
    try {
      await supabase.from("release_items").delete().eq("release_id", releaseId);
      const { error } = await supabase.from("releases").delete().eq("id", releaseId);
      if (error) throw error;
      toast.success("Release excluída!");
      fetchData();
    } catch (err: any) { toast.error("Erro ao excluir release", { description: err.message }); }
  };

  // Deletar item
  const deleteItem = async (itemId: string) => {
    if (!window.confirm("Excluir este item?")) return;
    try {
      const { error } = await supabase.from("release_items").delete().eq("id", itemId);
      if (error) throw error;
      toast.success("Item excluído!");
      fetchData();
    } catch (err: any) { toast.error("Erro ao excluir item", { description: err.message }); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Controles de ano */}
      <div className="flex items-center gap-3">
        <button onClick={() => setYear(y => y - 1)} className="h-8 w-8 rounded border border-border flex items-center justify-center hover:bg-slate-50 transition-colors">
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <span className="text-sm font-bold w-12 text-center">{year}</span>
        <button onClick={() => setYear(y => y + 1)} className="h-8 w-8 rounded border border-border flex items-center justify-center hover:bg-slate-50 transition-colors">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <span className="text-xs text-muted-foreground ml-2">{launches.length} projeto{launches.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header do gantt */}
        <div className="flex border-b border-slate-100">
          <div className="w-64 shrink-0 border-r border-slate-100 bg-slate-50 px-4 py-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Item</span>
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
            <p className="text-sm text-slate-400">Nenhum projeto vinculado a este produto.</p>
            <p className="text-xs text-slate-300 mt-1">Crie projetos e vincule a este produto para ver o roadmap.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {launches.map(launch => {
              const lPos = getBarPosition(launch.data_inicio, launch.data_lancamento_prevista, year);
              const lColors = LAUNCH_COLORS[launch.status] || LAUNCH_COLORS["Planejamento"];
              const isExpanded = expandedLaunches.includes(launch.id);

              return (
                <div key={launch.id}>
                  {/* Linha do lançamento */}
                  <div className="flex items-center h-12 hover:bg-slate-50/50 transition-colors group">
                    <div className="w-64 shrink-0 border-r border-slate-100 px-3 h-full flex items-center gap-1">
                      <button onClick={() => toggleLaunch(launch.id)} className="p-0.5 rounded hover:bg-slate-200 shrink-0">
                        <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isExpanded ? "" : "-rotate-90"}`} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{launch.nome}</p>
                        <p className={`text-[9px] font-bold uppercase ${lColors.text}`}>{launch.status}</p>
                      </div>
                      <button onClick={() => { setAddingReleaseToLaunch(launch.id); if (!isExpanded) toggleLaunch(launch.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all shrink-0" title="Adicionar release">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex-1 relative h-full flex items-center">
                      {lPos.visible ? (
                        <div className={`absolute h-6 rounded-full ${lColors.bar} opacity-90 flex items-center px-2 overflow-hidden`}
                          style={{ left: lPos.left, width: lPos.width }}>
                          <span className="text-[9px] font-bold text-white truncate">{launch.nome}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 italic px-2">fora deste ano</span>
                      )}
                    </div>
                  </div>

                  {/* Formulário de nova release */}
                  {isExpanded && addingReleaseToLaunch === launch.id && (
                    <div className="bg-blue-50/50 border-b border-blue-100 px-3 py-3 flex items-center gap-2 pl-10">
                      <div className="flex-1 grid grid-cols-4 gap-2">
                        <input autoFocus value={newRelease.nome} onChange={e => setNewRelease(p => ({ ...p, nome: e.target.value }))}
                          placeholder="Nome da release" onKeyDown={e => e.key === "Enter" && handleAddRelease(launch.id)}
                          className="col-span-1 text-xs border border-slate-200 rounded px-2 py-1.5 outline-none focus:border-blue-400" />
                        <input type="date" value={newRelease.data_inicio} onChange={e => setNewRelease(p => ({ ...p, data_inicio: e.target.value }))}
                          className="text-xs border border-slate-200 rounded px-2 py-1.5 outline-none focus:border-blue-400" />
                        <input type="date" value={newRelease.data_prevista} onChange={e => setNewRelease(p => ({ ...p, data_prevista: e.target.value }))}
                          className="text-xs border border-slate-200 rounded px-2 py-1.5 outline-none focus:border-blue-400" />
                        <select value={newRelease.status} onChange={e => setNewRelease(p => ({ ...p, status: e.target.value }))}
                          className="text-xs border border-slate-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 bg-white">
                          {RELEASE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <button onClick={() => handleAddRelease(launch.id)} disabled={saving}
                        className="p-1.5 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setAddingReleaseToLaunch(null)}
                        className="p-1.5 rounded hover:bg-slate-200 text-slate-400 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Releases */}
                  {isExpanded && launch.releases.map(release => {
                    const rPos = getBarPosition(release.data_inicio, release.data_prevista, year);
                    const rColor = RELEASE_COLORS[release.status] || RELEASE_COLORS["Planejamento"];
                    const isReleaseExpanded = expandedReleases.includes(release.id);
                    const isEditingThisRelease = editingRelease === release.id;

                    return (
                      <div key={release.id} className="bg-slate-50/30">
                        {/* Linha da release */}
                        <div className="flex items-center h-10 hover:bg-slate-100/50 transition-colors group">
                          <div className="w-64 shrink-0 border-r border-slate-100 h-full flex items-center gap-1 pl-7">
                            <button onClick={() => toggleRelease(release.id)} className="p-0.5 rounded hover:bg-slate-200 shrink-0">
                              <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isReleaseExpanded ? "" : "-rotate-90"}`} />
                            </button>
                            {isEditingThisRelease ? (
                              <input autoFocus value={editValues.nome} onChange={e => setEditValues(p => ({ ...p, nome: e.target.value }))}
                                onKeyDown={e => { if (e.key === "Enter") saveRelease(release.id); if (e.key === "Escape") setEditingRelease(null); }}
                                className="flex-1 text-xs border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-400 min-w-0" />
                            ) : (
                              <p className="text-[11px] font-semibold text-slate-600 truncate flex-1">{release.nome}</p>
                            )}
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                              {isEditingThisRelease ? (
                                <>
                                  <button onClick={() => saveRelease(release.id)} className="p-1 rounded hover:bg-emerald-100 text-emerald-600"><Check className="w-3 h-3" /></button>
                                  <button onClick={() => setEditingRelease(null)} className="p-1 rounded hover:bg-slate-200 text-slate-400"><X className="w-3 h-3" /></button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => { setAddingItemToRelease(release.id); if (!isReleaseExpanded) toggleRelease(release.id); }}
                                    className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600" title="Adicionar item">
                                    <Plus className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => startEditRelease(release)} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600">
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => deleteRelease(release.id)} className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-500">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
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

                        {/* Edição de datas/status da release */}
                        {isEditingThisRelease && (
                          <div className="bg-blue-50/30 px-3 py-2 flex items-center gap-2 pl-16 border-b border-blue-100">
                            <input type="date" value={editValues.data_inicio} onChange={e => setEditValues(p => ({ ...p, data_inicio: e.target.value }))}
                              className="text-xs border border-slate-200 rounded px-2 py-1 outline-none focus:border-blue-400" />
                            <span className="text-xs text-slate-400">→</span>
                            <input type="date" value={editValues.data_prevista} onChange={e => setEditValues(p => ({ ...p, data_prevista: e.target.value }))}
                              className="text-xs border border-slate-200 rounded px-2 py-1 outline-none focus:border-blue-400" />
                            <select value={editValues.status} onChange={e => setEditValues(p => ({ ...p, status: e.target.value }))}
                              className="text-xs border border-slate-200 rounded px-2 py-1 outline-none focus:border-blue-400 bg-white">
                              {RELEASE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        )}

                        {/* Formulário de novo item */}
                        {isReleaseExpanded && addingItemToRelease === release.id && (
                          <div className="bg-emerald-50/30 border-b border-emerald-100 px-3 py-2 flex items-center gap-2 pl-16">
                            <input autoFocus value={newItem.nome} onChange={e => setNewItem(p => ({ ...p, nome: e.target.value }))}
                              placeholder="Nome do item" onKeyDown={e => e.key === "Enter" && handleAddItem(release.id)}
                              className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 outline-none focus:border-emerald-400" />
                            <select value={newItem.status} onChange={e => setNewItem(p => ({ ...p, status: e.target.value }))}
                              className="text-xs border border-slate-200 rounded px-2 py-1.5 outline-none focus:border-emerald-400 bg-white">
                              {ITEM_STATUSES.map(s => <option key={s} value={s}>{ITEM_STATUS_LABELS[s]}</option>)}
                            </select>
                            <button onClick={() => handleAddItem(release.id)} disabled={saving}
                              className="p-1.5 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setAddingItemToRelease(null)}
                              className="p-1.5 rounded hover:bg-slate-200 text-slate-400 transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Items */}
                        {isReleaseExpanded && release.items.map(item => {
                          const iStatus = ITEM_STATUS_STYLE[item.status] || ITEM_STATUS_STYLE["pendente"];
                          const isEditingThisItem = editingItem === item.id;
                          return (
                            <div key={item.id} className="flex items-center h-8 hover:bg-slate-100/30 group">
                              <div className="w-64 shrink-0 border-r border-slate-100 h-full flex items-center gap-2 pl-12">
                                <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${iStatus.dot}`}></div>
                                {isEditingThisItem ? (
                                  <input autoFocus value={editValues.nome} onChange={e => setEditValues(p => ({ ...p, nome: e.target.value }))}
                                    onKeyDown={e => { if (e.key === "Enter") saveItem(item.id); if (e.key === "Escape") setEditingItem(null); }}
                                    className="flex-1 text-xs border border-slate-300 rounded px-1.5 py-0.5 outline-none focus:border-blue-400 min-w-0" />
                                ) : (
                                  <p className={`text-[10px] truncate flex-1 ${iStatus.text}`}>{item.nome}</p>
                                )}
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                  {isEditingThisItem ? (
                                    <>
                                      <select value={editValues.status} onChange={e => setEditValues(p => ({ ...p, status: e.target.value }))}
                                        className="text-[10px] border border-slate-200 rounded px-1 py-0.5 outline-none bg-white">
                                        {ITEM_STATUSES.map(s => <option key={s} value={s}>{ITEM_STATUS_LABELS[s]}</option>)}
                                      </select>
                                      <button onClick={() => saveItem(item.id)} className="p-0.5 rounded hover:bg-emerald-100 text-emerald-600"><Check className="w-3 h-3" /></button>
                                      <button onClick={() => setEditingItem(null)} className="p-0.5 rounded hover:bg-slate-200 text-slate-400"><X className="w-3 h-3" /></button>
                                    </>
                                  ) : (
                                    <>
                                      <button onClick={() => startEditItem(item)} className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"><Pencil className="w-3 h-3" /></button>
                                      <button onClick={() => deleteItem(item.id)} className="p-0.5 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-500"><Trash2 className="w-3 h-3" /></button>
                                    </>
                                  )}
                                </div>
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

      {/* Legenda */}
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
