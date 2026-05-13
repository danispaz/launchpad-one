import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Plus, ChevronDown, Trash2, GripVertical, Pencil, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ReleaseItem { id: string; nome: string; status: string; ordem: number; descricao: string | null; criterios_aceite: string | null; owner_id: string | null; }
interface Release { id: string; nome: string; descricao: string | null; data_inicio: string | null; data_prevista: string | null; status: string; ordem: number; items: ReleaseItem[]; }

const RELEASE_STATUSES = ["Planejamento", "Em Andamento", "Concluído", "Atrasado", "Cancelado"];
const ITEM_STATUSES = [
  { value: "pendente", label: "Pendente" },
  { value: "em_progresso", label: "Em Progresso" },
  { value: "concluido", label: "Concluído" },
];
const STATUS_COLORS: Record<string, string> = {
  "Planejamento": "bg-slate-100 text-slate-600",
  "Em Andamento": "bg-blue-100 text-blue-600",
  "Concluído": "bg-emerald-100 text-emerald-600",
  "Atrasado": "bg-rose-100 text-rose-600",
  "Cancelado": "bg-slate-100 text-slate-400",
};
const ITEM_STATUS_COLORS: Record<string, string> = {
  "pendente": "bg-slate-100 text-slate-500",
  "em_progresso": "bg-blue-100 text-blue-600",
  "concluido": "bg-emerald-100 text-emerald-600",
};
const ITEM_STATUS_LABELS: Record<string, string> = {
  "pendente": "Pendente",
  "em_progresso": "Em Progresso",
  "concluido": "Concluído",
};

const PDF_STYLE = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; background: #ffffff; color: #1e293b; line-height: 1.5; }
  .header { padding: 40px 48px; border-bottom: 1px solid #f1f5f9; position: relative; }
  .logo { font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 24px; display: flex; align-items: center; }
  .logo span { color: #0ea5e9; }
  .header-title { font-size: 32px; font-weight: 800; color: #0f172a; line-height: 1.1; margin-bottom: 8px; letter-spacing: -0.025em; }
  .header-sub { font-size: 14px; color: #64748b; font-weight: 500; }
  .badge { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; margin-top: 16px; }
  .badge-pendente { background: #f8fafc; color: #64748b; border: 1px solid #f1f5f9; }
  .badge-em_progresso { background: #f0f9ff; color: #0ea5e9; border: 1px solid #e0f2fe; }
  .badge-concluido { background: #f0fdf4; color: #16a34a; border: 1px solid #dcfce7; }
  .badge-Planejamento { background: #f8fafc; color: #64748b; border: 1px solid #f1f5f9; }
  .badge-Em.Andamento { background: #f0f9ff; color: #0ea5e9; border: 1px solid #e0f2fe; }
  .badge-Concluído { background: #f0fdf4; color: #16a34a; border: 1px solid #dcfce7; }
  .badge-Atrasado { background: #fff1f2; color: #e11d48; border: 1px solid #ffe4e6; }
  .body { padding: 40px 48px; }
  .section { margin-bottom: 40px; }
  .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 16px; }
  .section-content { font-size: 15px; color: #334155; line-height: 1.6; white-space: pre-wrap; }
  .criterio { display: flex; gap: 12px; margin-bottom: 10px; font-size: 15px; color: #334155; align-items: flex-start; }
  .criterio-check { color: #16a34a; font-weight: 700; flex-shrink: 0; }
  .progress-container { margin-top: 8px; }
  .progress-bar { height: 6px; background: #f1f5f9; border-radius: 100px; overflow: hidden; margin-bottom: 8px; width: 100%; }
  .progress-fill { height: 100%; background: #0ea5e9; border-radius: 100px; }
  table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 8px; }
  thead th { padding: 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; border-bottom: 1px solid #f1f5f9; }
  tbody td { padding: 16px 12px; font-size: 14px; color: #334155; border-bottom: 1px solid #f8fafc; vertical-align: top; }
  .status-badge { display: inline-flex; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
  .footer { margin-top: 80px; padding-top: 24px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; font-weight: 500; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .header, .body { padding-left: 0; padding-right: 0; } }
`;

function generateItemPDF(item: ReleaseItem, releaseName: string) {
  const statusClass = item.status.replace(/ /g, ".");
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${item.nome}</title><style>${PDF_STYLE}</style></head><body>
<div class="header">
  <div class="logo">Launch<span>Hub</span></div>
  <div class="header-title">${item.nome}</div>
  <div class="header-sub">Release: ${releaseName}</div>
  <div><span class="badge badge-${statusClass}">${ITEM_STATUS_LABELS[item.status] || item.status}</span></div>
</div>
<div class="body">
  ${item.descricao ? `<div class="section"><div class="section-title">Descrição</div><div class="section-content">${item.descricao}</div></div>` : ""}
  ${item.criterios_aceite ? `<div class="section"><div class="section-title">Critérios de Aceite</div>${item.criterios_aceite.split("\n").filter(Boolean).map(c => `<div class="criterio"><span class="criterio-check">✓</span><span>${c}</span></div>`).join("")}</div>` : ""}
  ${!item.descricao && !item.criterios_aceite ? `<div class="section"><p style="font-size:13px;color:#94a3b8;font-style:italic">Nenhum detalhamento registrado.</p></div>` : ""}
  <div class="footer"><span>LaunchHub — Gestão de Produto</span><span>Gerado em ${new Date().toLocaleDateString("pt-BR")}</span></div>
</div>
<script>window.onload=()=>window.print()</script>
</body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

function generateReleasePDF(release: Release) {
  const doneItems = release.items.filter(i => i.status === "concluido").length;
  const pct = release.items.length > 0 ? Math.round((doneItems / release.items.length) * 100) : 0;
  const itemsHTML = release.items.map(item => {
    const bg = item.status === "concluido" ? "#f0fdf4" : item.status === "em_progresso" ? "#eff6ff" : "#f1f5f9";
    const color = item.status === "concluido" ? "#16a34a" : item.status === "em_progresso" ? "#3b82f6" : "#64748b";
    return `<tr><td>${item.nome}</td><td><span class="status-badge" style="background:${bg};color:${color}">${ITEM_STATUS_LABELS[item.status] || item.status}</span></td><td style="color:#64748b">${item.descricao || "—"}</td></tr>`;
  }).join("");
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${release.nome}</title><style>${PDF_STYLE}</style></head><body>
<div class="header">
  <div class="logo">Launch<span>Hub</span></div>
  <div class="header-title">${release.nome}</div>
  <div class="header-sub">${release.data_inicio ? new Date(release.data_inicio).toLocaleDateString("pt-BR") : "—"} → ${release.data_prevista ? new Date(release.data_prevista).toLocaleDateString("pt-BR") : "—"} &nbsp;·&nbsp; ${release.status}</div>
</div>
<div class="body">
  ${release.descricao ? `<div class="section"><div class="section-title">Descrição</div><div class="section-content">${release.descricao}</div></div>` : ""}
  <div class="section">
    <div class="section-title">Progresso — ${doneItems}/${release.items.length} itens concluídos (${pct}%)</div>
    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
  </div>
  <div class="section">
    <div class="section-title">Itens do Escopo</div>
    ${release.items.length === 0 ? `<p style="font-size:13px;color:#94a3b8;font-style:italic">Nenhum item cadastrado.</p>` : `<table><thead><tr><th>Item</th><th>Status</th><th>Descrição</th></tr></thead><tbody>${itemsHTML}</tbody></table>`}
  </div>
  <div class="footer"><span>LaunchHub — Gestão de Produto</span><span>Gerado em ${new Date().toLocaleDateString("pt-BR")}</span></div>
</div>
<script>window.onload=()=>window.print()</script>
</body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

interface Props { launchId: string; }

export function ReleasesPanel({ launchId }: Props) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReleases, setExpandedReleases] = useState<string[]>([]);
  const [isReleaseDialogOpen, setIsReleaseDialogOpen] = useState(false);
  const [releaseToDelete, setReleaseToDelete] = useState<string | null>(null);
  const [isSubmittingRelease, setIsSubmittingRelease] = useState(false);
  const [releaseNome, setReleaseNome] = useState("");
  const [releaseDescricao, setReleaseDescricao] = useState("");
  const [releaseDataInicio, setReleaseDataInicio] = useState("");
  const [releaseDataPrevista, setReleaseDataPrevista] = useState("");
  const [releaseStatus, setReleaseStatus] = useState("Planejamento");
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [activeReleaseId, setActiveReleaseId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);
  const [itemNome, setItemNome] = useState("");
  const [itemStatus, setItemStatus] = useState("pendente");
  const [itemDescricao, setItemDescricao] = useState("");
  const [itemCriterios, setItemCriterios] = useState("");
  const [editingItem, setEditingItem] = useState<ReleaseItem | null>(null);

  useEffect(() => { fetchReleases(); }, [launchId]);

  async function fetchReleases() {
    setLoading(true);
    try {
      const { data: releasesRaw, error: rError } = await supabase.from("releases").select("*").eq("launch_id", launchId).order("ordem");
      if (rError) throw rError;
      if (!releasesRaw?.length) { setReleases([]); return; }
      const releaseIds = releasesRaw.map(r => r.id);
      const { data: itemsRaw, error: iError } = await supabase.from("release_items").select("*").in("release_id", releaseIds).order("ordem");
      if (iError) throw iError;
      const itemsByRelease = (itemsRaw || []).reduce((acc, item) => {
        if (!acc[item.release_id]) acc[item.release_id] = [];
        acc[item.release_id].push(item);
        return acc;
      }, {} as Record<string, ReleaseItem[]>);
      setReleases(releasesRaw.map(r => ({ ...r, items: itemsByRelease[r.id] || [] })));
    } catch (err: any) {
      toast.error("Erro ao carregar releases", { description: err.message });
    } finally { setLoading(false); }
  }

  const toggleRelease = (id: string) => setExpandedReleases(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleCreateRelease = async () => {
    if (!releaseNome.trim()) { toast.error("Nome é obrigatório"); return; }
    setIsSubmittingRelease(true);
    try {
      const { error } = await supabase.from("releases").insert({ launch_id: launchId, nome: releaseNome, descricao: releaseDescricao || null, data_inicio: releaseDataInicio || null, data_prevista: releaseDataPrevista || null, status: releaseStatus, ordem: releases.length });
      if (error) throw error;
      toast.success("Release criada"); setIsReleaseDialogOpen(false);
      setReleaseNome(""); setReleaseDescricao(""); setReleaseDataInicio(""); setReleaseDataPrevista(""); setReleaseStatus("Planejamento");
      fetchReleases();
    } catch (err: any) { toast.error("Erro ao criar release", { description: err.message }); }
    finally { setIsSubmittingRelease(false); }
  };

  const handleUpdateRelease = async () => {
    if (!editingRelease || !releaseNome.trim()) { toast.error("Nome é obrigatório"); return; }
    setIsSubmittingRelease(true);
    try {
      const { error } = await supabase.from("releases").update({ nome: releaseNome, descricao: releaseDescricao || null, data_inicio: releaseDataInicio || null, data_prevista: releaseDataPrevista || null, status: releaseStatus }).eq("id", editingRelease.id);
      if (error) throw error;
      toast.success("Release atualizada"); setIsReleaseDialogOpen(false); setEditingRelease(null);
      setReleaseNome(""); setReleaseDescricao(""); setReleaseDataInicio(""); setReleaseDataPrevista(""); setReleaseStatus("Planejamento");
      fetchReleases();
    } catch (err: any) { toast.error("Erro ao atualizar release", { description: err.message }); }
    finally { setIsSubmittingRelease(false); }
  };

  const handleDeleteRelease = async () => {
    if (!releaseToDelete) return;
    try {
      const { error } = await supabase.from("releases").delete().eq("id", releaseToDelete);
      if (error) throw error;
      toast.success("Release deletada"); setReleaseToDelete(null); fetchReleases();
    } catch (err: any) { toast.error("Erro ao deletar release", { description: err.message }); }
  };

  const handleCreateItem = async () => {
    if (!itemNome.trim() || !activeReleaseId) { toast.error("Nome é obrigatório"); return; }
    setIsSubmittingItem(true);
    try {
      const release = releases.find(r => r.id === activeReleaseId);
      const { error } = await supabase.from("release_items").insert({ release_id: activeReleaseId, nome: itemNome, status: itemStatus, descricao: itemDescricao || null, criterios_aceite: itemCriterios || null, ordem: release?.items.length || 0 });
      if (error) throw error;
      toast.success("Item adicionado"); setIsItemDialogOpen(false);
      setItemNome(""); setItemStatus("pendente"); setItemDescricao(""); setItemCriterios("");
      fetchReleases();
    } catch (err: any) { toast.error("Erro ao criar item", { description: err.message }); }
    finally { setIsSubmittingItem(false); }
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !itemNome.trim()) { toast.error("Nome é obrigatório"); return; }
    setIsSubmittingItem(true);
    try {
      const { error } = await supabase.from("release_items").update({ nome: itemNome, status: itemStatus, descricao: itemDescricao || null, criterios_aceite: itemCriterios || null }).eq("id", editingItem.id);
      if (error) throw error;
      toast.success("Item atualizado"); setIsItemDialogOpen(false); setEditingItem(null);
      setItemNome(""); setItemStatus("pendente"); setItemDescricao(""); setItemCriterios("");
      fetchReleases();
    } catch (err: any) { toast.error("Erro ao atualizar item", { description: err.message }); }
    finally { setIsSubmittingItem(false); }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      const { error } = await supabase.from("release_items").delete().eq("id", itemToDelete);
      if (error) throw error;
      toast.success("Item removido"); setItemToDelete(null); fetchReleases();
    } catch (err: any) { toast.error("Erro ao remover item", { description: err.message }); }
  };

  const handleUpdateItemStatus = async (itemId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("release_items").update({ status: newStatus }).eq("id", itemId);
      if (error) throw error;
      fetchReleases();
    } catch (err: any) { toast.error("Erro ao atualizar status", { description: err.message }); }
  };

  if (loading) return <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Releases</h3>
          <p className="text-xs text-slate-400 mt-0.5">{releases.length} release{releases.length !== 1 ? "s" : ""} · {releases.reduce((acc, r) => acc + r.items.length, 0)} itens no total</p>
        </div>
        <Button onClick={() => setIsReleaseDialogOpen(true)} size="sm" className="h-8 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Nova Release
        </Button>
      </div>

      {releases.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <p className="text-sm text-slate-400">Nenhuma release cadastrada.</p>
          <p className="text-xs text-slate-300 mt-1">Crie releases para organizar o escopo deste lançamento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {releases.map(release => {
            const isExpanded = expandedReleases.includes(release.id);
            const doneItems = release.items.filter(i => i.status === "concluido").length;
            return (
              <div key={release.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center p-4 gap-3">
                  <button onClick={() => toggleRelease(release.id)} className="p-1 rounded hover:bg-slate-100 transition-colors">
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? "" : "-rotate-90"}`} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-800">{release.nome}</p>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${STATUS_COLORS[release.status] || STATUS_COLORS["Planejamento"]}`}>{release.status}</span>
                      {release.data_inicio && release.data_prevista && <span className="text-[10px] text-slate-400">{new Date(release.data_inicio).toLocaleDateString("pt-BR")} → {new Date(release.data_prevista).toLocaleDateString("pt-BR")}</span>}
                    </div>
                    {release.descricao && <p className="text-xs text-slate-400 mt-0.5 truncate">{release.descricao}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-400 font-medium">{doneItems}/{release.items.length} itens</span>
                    <button onClick={() => generateReleasePDF(release)} className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors" title="Exportar PDF da release">
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { setActiveReleaseId(release.id); setIsItemDialogOpen(true); }} className="h-7 px-2 rounded border border-border text-[11px] font-medium hover:bg-slate-50 transition-colors flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Item
                    </button>
                    <button onClick={() => { setEditingRelease(release); setReleaseNome(release.nome); setReleaseDescricao(release.descricao || ""); setReleaseDataInicio(release.data_inicio || ""); setReleaseDataPrevista(release.data_prevista || ""); setReleaseStatus(release.status); setIsReleaseDialogOpen(true); }} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setReleaseToDelete(release.id)} className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-slate-50 divide-y divide-slate-50">
                    {release.items.length === 0 ? (
                      <div className="px-6 py-4 text-center"><p className="text-xs text-slate-300 italic">Nenhum item. Clique em "+ Item" para adicionar.</p></div>
                    ) : (
                      release.items.map(item => (
                        <div key={item.id} className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50/50 transition-colors group">
                          <GripVertical className="w-3.5 h-3.5 text-slate-200 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700">{item.nome}</p>
                            {item.descricao && <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.descricao}</p>}
                          </div>
                          <select value={item.status} onChange={e => handleUpdateItemStatus(item.id, e.target.value)} className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border-0 cursor-pointer ${ITEM_STATUS_COLORS[item.status] || ITEM_STATUS_COLORS["pendente"]}`}>
                            {ITEM_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                          <button onClick={() => generateItemPDF(item, release.nome)} className="p-1 rounded hover:bg-blue-50 text-slate-300 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100" title="PDF do item">
                            <FileText className="w-3 h-3" />
                          </button>
                          <button onClick={() => { setEditingItem(item); setItemNome(item.nome); setItemStatus(item.status); setItemDescricao(item.descricao || ""); setItemCriterios(item.criterios_aceite || ""); setActiveReleaseId(null); setIsItemDialogOpen(true); }} className="p-1 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-500 transition-colors opacity-0 group-hover:opacity-100">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button onClick={() => setItemToDelete(item.id)} className="p-1 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={isReleaseDialogOpen} onOpenChange={(open) => { setIsReleaseDialogOpen(open); if (!open) { setEditingRelease(null); setReleaseNome(""); setReleaseDescricao(""); setReleaseDataInicio(""); setReleaseDataPrevista(""); setReleaseStatus("Planejamento"); } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>{editingRelease ? "Editar Release" : "Nova Release"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={releaseNome} onChange={e => setReleaseNome(e.target.value)} placeholder="Ex: Release 1, v1.0, Beta..." /></div>
            <div className="space-y-2"><Label>Descrição (opcional)</Label><Textarea value={releaseDescricao} onChange={e => setReleaseDescricao(e.target.value)} placeholder="O que entra nessa release..." className="resize-none" rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Data de Início</Label><Input type="date" value={releaseDataInicio} onChange={e => setReleaseDataInicio(e.target.value)} /></div>
              <div className="space-y-2"><Label>Data Prevista</Label><Input type="date" value={releaseDataPrevista} onChange={e => setReleaseDataPrevista(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Status</Label>
              <Select value={releaseStatus} onValueChange={setReleaseStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RELEASE_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReleaseDialogOpen(false)} disabled={isSubmittingRelease}>Cancelar</Button>
            <Button onClick={editingRelease ? handleUpdateRelease : handleCreateRelease} disabled={isSubmittingRelease}>{isSubmittingRelease ? "Salvando..." : (editingRelease ? "Salvar alterações" : "Criar Release")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isItemDialogOpen} onOpenChange={(open) => { setIsItemDialogOpen(open); if (!open) { setEditingItem(null); setItemNome(""); setItemStatus("pendente"); setItemDescricao(""); setItemCriterios(""); } }}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader><DialogTitle>{editingItem ? "Editar Item" : "Novo Item"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nome do item</Label><Input value={itemNome} onChange={e => setItemNome(e.target.value)} placeholder="Ex: Conta Digital, Emissão CT-e..." /></div>
            <div className="space-y-2"><Label>Status</Label>
              <Select value={itemStatus} onValueChange={setItemStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ITEM_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Descrição (opcional)</Label><Textarea value={itemDescricao} onChange={e => setItemDescricao(e.target.value)} placeholder="Descreva o que esse item entrega..." className="resize-none" rows={3} /></div>
            <div className="space-y-2">
              <Label>Critérios de Aceite (opcional)</Label>
              <Textarea value={itemCriterios} onChange={e => setItemCriterios(e.target.value)} placeholder={"Um critério por linha:\nO usuário consegue emitir CT-e\nO documento é enviado para SEFAZ"} className="resize-none" rows={4} />
              <p className="text-[10px] text-slate-400">Um critério por linha. Cada linha vira um ✓ no PDF.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsItemDialogOpen(false)} disabled={isSubmittingItem}>Cancelar</Button>
            <Button onClick={editingItem ? handleUpdateItem : handleCreateItem} disabled={isSubmittingItem}>{isSubmittingItem ? "Salvando..." : (editingItem ? "Salvar alterações" : "Adicionar Item")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!releaseToDelete} onOpenChange={(open) => !open && setReleaseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Deletar release</AlertDialogTitle><AlertDialogDescription>Todos os itens desta release serão deletados. Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteRelease} className="bg-rose-500 hover:bg-rose-600">Deletar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remover item</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja remover este item?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteItem} className="bg-rose-500 hover:bg-rose-600">Remover</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
