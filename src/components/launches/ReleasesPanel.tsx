import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Plus, ChevronDown, Trash2, GripVertical, Pencil, FileText, Printer, Bold, Italic, List, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface ReleaseItem { id: string; nome: string; status: string; ordem: number; descricao: string | null; criterios_aceite: string | null; owner_id: string | null; }
interface Release { id: string; nome: string; descricao: string | null; data_inicio: string | null; data_prevista: string | null; status: string; ordem: number; items: ReleaseItem[]; }
interface PreviewData { type: "item" | "release"; item?: ReleaseItem; release?: Release; releaseName?: string; }

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

const TiptapEditor = ({ content, onChange, placeholder }: { content: string; onChange: (content: string) => void; placeholder: string }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none max-w-none min-h-[100px] px-3 py-2 text-sm',
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="rounded-md border border-input bg-background overflow-hidden focus-within:ring-1 focus-within:ring-ring">
      <div className="flex items-center gap-1 p-1 border-b bg-slate-50/50">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-7 w-7 ${editor.isActive('bold') ? 'bg-slate-200' : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-7 w-7 ${editor.isActive('italic') ? 'bg-slate-200' : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-7 w-7 ${editor.isActive('bulletList') ? 'bg-slate-200' : ''}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-7 w-7 ${editor.isActive('orderedList') ? 'bg-slate-200' : ''}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>
      </div>
      <EditorContent editor={editor} />
      <style>{`
        .prose ul { list-style-type: disc; padding-left: 1.25rem; }
        .prose ol { list-style-type: decimal; padding-left: 1.25rem; }
      `}</style>
    </div>
  );
};
function printPreview(preview: PreviewData) {
  const doneItems = preview.release?.items.filter(i => i.status === "concluido").length || 0;
  const total = preview.release?.items.length || 0;
  const pct = total > 0 ? Math.round((doneItems / total) * 100) : 0;

  const style = `
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;color:#1e293b}
    .header{background:#0f172a;color:#fff;padding:36px 48px 28px}
    .logo{font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:16px}
    .logo span{color:#38bdf8}
    .header-title{font-size:26px;font-weight:700;color:#fff;margin-bottom:6px}
    .header-sub{font-size:12px;color:rgba(255,255,255,.5)}
    .badge{display:inline-block;padding:3px 10px;border-radius:6px;font-size:10px;font-weight:600;text-transform:uppercase;margin-top:12px}
    .badge-pendente{background:rgba(255,255,255,.1);color:rgba(255,255,255,.7)}
    .badge-em_progresso{background:#dbeafe;color:#1d4ed8}
    .badge-concluido{background:#dcfce7;color:#15803d}
    .badge-Planejamento{background:rgba(255,255,255,.1);color:rgba(255,255,255,.7)}
    .badge-EmAndamento{background:#dbeafe;color:#1d4ed8}
    .badge-Concluido{background:#dcfce7;color:#15803d}
    .badge-Atrasado{background:#fee2e2;color:#b91c1c}
    .body{padding:40px 48px}
    .section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;margin:28px 0 12px;padding-bottom:6px;border-bottom:1px solid #f1f5f9}
    .section-content{font-size:13px;color:#334155;line-height:1.8;white-space:pre-wrap}
    .criterio{display:flex;gap:10px;margin-bottom:8px;font-size:13px;color:#334155;align-items:flex-start}
    .check{color:#16a34a;font-weight:700;margin-top:1px}
    .progress-wrap{margin:8px 0 4px}
    .progress-bar{height:5px;background:#f1f5f9;border-radius:100px;overflow:hidden}
    .progress-fill{height:100%;background:#0ea5e9;border-radius:100px}
    .progress-label{font-size:11px;color:#94a3b8;margin-top:4px}
    .item-row{padding:10px 14px;border:1px solid #f1f5f9;border-radius:8px;margin-bottom:6px;display:flex;gap:12px;align-items:flex-start}
    .item-badge{padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;text-transform:uppercase;white-space:nowrap;margin-top:2px}
    .item-name{font-size:13px;font-weight:500;color:#1e293b}
    .item-desc{font-size:12px;color:#64748b;margin-top:2px}
    .footer{margin-top:48px;padding-top:14px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;font-size:11px;color:#cbd5e1}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  `;

  let body = "";
  if (preview.type === "item" && preview.item) {
    const item = preview.item;
    const sc = item.status.replace(/_/g, "");
    body = `
      <div class="header">
        <div class="logo">Launch<span>Hub</span></div>
        <div class="header-title">${item.nome}</div>
        <div class="header-sub">Release: ${preview.releaseName || ""}</div>
        <div><span class="badge badge-${sc}">${ITEM_STATUS_LABELS[item.status] || item.status}</span></div>
      </div>
      <div class="body">
        ${item.descricao ? `<div class="section-title">Descrição</div><div class="section-content">${item.descricao}</div>` : ""}
        ${item.criterios_aceite ? `<div class="section-title">Critérios de Aceite</div><div class="section-content">${item.criterios_aceite}</div>` : ""}
        ${!item.descricao && !item.criterios_aceite ? `<p style="color:#94a3b8;font-style:italic;font-size:13px;margin-top:24px">Nenhum detalhamento registrado.</p>` : ""}
        <div class="footer"><span>LaunchHub</span><span>Gerado em ${new Date().toLocaleDateString("pt-BR")}</span></div>
      </div>`;
  } else if (preview.type === "release" && preview.release) {
    const rel = preview.release;
    const sc = rel.status.replace(/ /g, "");
    const itemsHTML = rel.items.map(item => {
      const bg = item.status === "concluido" ? "#dcfce7" : item.status === "em_progresso" ? "#dbeafe" : "#f1f5f9";
      const color = item.status === "concluido" ? "#15803d" : item.status === "em_progresso" ? "#1d4ed8" : "#64748b";
      return `<div class="item-row"><span class="item-badge" style="background:${bg};color:${color}">${ITEM_STATUS_LABELS[item.status] || item.status}</span><div><div class="item-name">${item.nome}</div>${item.descricao ? `<div class="item-desc">${item.descricao.replace(/<[^>]*>/g, ' ')}</div>` : ""}</div></div>`;
    }).join("");
    body = `
      <div class="header">
        <div class="logo">Launch<span>Hub</span></div>
        <div class="header-title">${rel.nome}</div>
        <div class="header-sub">${rel.data_inicio ? new Date(rel.data_inicio).toLocaleDateString("pt-BR") : "—"} → ${rel.data_prevista ? new Date(rel.data_prevista).toLocaleDateString("pt-BR") : "—"}</div>
        <div><span class="badge badge-${sc}">${rel.status}</span></div>
      </div>
      <div class="body">
        ${rel.descricao ? `<div class="section-title">Descrição</div><div class="section-content">${rel.descricao}</div>` : ""}
        <div class="section-title">Progresso — ${doneItems}/${total} itens concluídos</div>
        <div class="progress-wrap"><div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div><div class="progress-label">${pct}% concluído</div></div>
        <div class="section-title">Itens do Escopo</div>
        ${rel.items.length === 0 ? `<p style="color:#94a3b8;font-style:italic;font-size:13px">Nenhum item cadastrado.</p>` : itemsHTML}
        <div class="footer"><span>LaunchHub</span><span>Gerado em ${new Date().toLocaleDateString("pt-BR")}</span></div>
      </div>`;
  }

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>LaunchHub PDF</title><style>${style}</style></head><body>${body}<script>window.onload=()=>window.print()<\/script></body></html>`);
    w.document.close();
  }
}

interface Props { launchId: string; }

export function ReleasesPanel({ launchId }: Props) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReleases, setExpandedReleases] = useState<string[]>([]);
  const [preview, setPreview] = useState<PreviewData | null>(null);
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
                    <button onClick={() => setPreview({ type: "release", release })} className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors" title="Pré-visualizar PDF">
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
                            {item.descricao && <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.descricao.replace(/<[^>]*>/g, ' ')}</p>}
                          </div>
                          <select value={item.status} onChange={e => handleUpdateItemStatus(item.id, e.target.value)} className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border-0 cursor-pointer ${ITEM_STATUS_COLORS[item.status] || ITEM_STATUS_COLORS["pendente"]}`}>
                            {ITEM_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                          <button onClick={() => setPreview({ type: "item", item, releaseName: release.nome })} className="p-1 rounded hover:bg-blue-50 text-slate-300 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100" title="Pré-visualizar PDF">
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

      {/* Modal de pré-visualização */}
      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="sm:max-w-[680px] max-h-[88vh] flex flex-col p-0 overflow-hidden">
          {/* Header do preview */}
          <div className="bg-slate-900 text-white px-8 py-6 shrink-0">
            <div className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-3">
              Launch<span className="text-sky-400">Hub</span>
            </div>
            <h2 className="text-xl font-bold text-white leading-tight">
              {preview?.type === "item" ? preview.item?.nome : preview?.release?.nome}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {preview?.type === "item" ? `Release: ${preview.releaseName}` : `${preview?.release?.items.length || 0} itens · ${preview?.release?.status}`}
            </p>
            {preview?.type === "item" && preview.item && (
              <span className={`inline-block mt-3 text-[10px] font-bold uppercase px-2.5 py-1 rounded-md ${ITEM_STATUS_COLORS[preview.item.status] || ITEM_STATUS_COLORS["pendente"]}`}>
                {ITEM_STATUS_LABELS[preview.item.status] || preview.item.status}
              </span>
            )}
            {preview?.type === "release" && preview.release && (
              <span className={`inline-block mt-3 text-[10px] font-bold uppercase px-2.5 py-1 rounded-md ${STATUS_COLORS[preview.release.status] || STATUS_COLORS["Planejamento"]}`}>
                {preview.release.status}
              </span>
            )}
          </div>

          {/* Conteúdo */}
          <ScrollArea className="flex-1 px-8 py-6 max-h-[55vh]">
            {preview?.type === "item" && preview.item && (
              <div className="space-y-6">
                {preview.item.descricao && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Descrição</p>
                    <div className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: preview.item.descricao }} />
                  </div>
                )}
                {preview.item.criterios_aceite && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Critérios de Aceite</p>
                    <div className="space-y-2">
                      {preview.item.criterios_aceite.split("\n").filter(Boolean).map((c, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                          <span className="text-sm text-slate-700">{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!preview.item.descricao && !preview.item.criterios_aceite && (
                  <p className="text-sm text-slate-400 italic">Nenhum detalhamento registrado para este item.</p>
                )}
              </div>
            )}
            {preview?.type === "release" && preview.release && (
              <div className="space-y-6">
                {preview.release.data_inicio && preview.release.data_prevista && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Período</p>
                    <p className="text-sm text-slate-700">{new Date(preview.release.data_inicio).toLocaleDateString("pt-BR")} → {new Date(preview.release.data_prevista).toLocaleDateString("pt-BR")}</p>
                  </div>
                )}
                {preview.release.descricao && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Descrição</p>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{preview.release.descricao}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
                    Progresso — {preview.release.items.filter(i => i.status === "concluido").length}/{preview.release.items.length} concluídos
                  </p>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${preview.release.items.length > 0 ? Math.round((preview.release.items.filter(i => i.status === "concluido").length / preview.release.items.length) * 100) : 0}%` }}></div>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Itens do Escopo</p>
                  {preview.release.items.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">Nenhum item cadastrado.</p>
                  ) : (
                    <div className="space-y-2">
                      {preview.release.items.map(item => (
                        <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded shrink-0 mt-0.5 ${ITEM_STATUS_COLORS[item.status] || ITEM_STATUS_COLORS["pendente"]}`}>{ITEM_STATUS_LABELS[item.status] || item.status}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800">{item.nome}</p>
                            {item.descricao && <p className="text-xs text-slate-500 mt-0.5 truncate">{item.descricao.replace(/<[^>]*>/g, ' ')}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <Button variant="outline" onClick={() => setPreview(null)}>Fechar</Button>
            <Button onClick={() => preview && printPreview(preview)} className="flex items-center gap-2">
              <Printer className="w-3.5 h-3.5" />
              Imprimir / Salvar PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
        <DialogContent className="sm:max-w-[720px] max-h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>{editingItem ? "Editar Item" : "Novo Item"}</DialogTitle></DialogHeader>
          <ScrollArea className="flex-1 pr-2">
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nome do item</Label><Input value={itemNome} onChange={e => setItemNome(e.target.value)} placeholder="Ex: Conta Digital, Emissão CT-e..." /></div>
            <div className="space-y-2"><Label>Status</Label>
              <Select value={itemStatus} onValueChange={setItemStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ITEM_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Descrição (opcional)</Label><TiptapEditor content={itemDescricao} onChange={setItemDescricao} placeholder="Descreva o que esse item entrega..." /></div>
            <div className="space-y-2">
              <Label>Critérios de Aceite (opcional)</Label>
              <TiptapEditor content={itemCriterios} onChange={setItemCriterios} placeholder="Digite os critérios de aceite..." />
            </div>
          </div>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t border-slate-100 mt-2">
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
