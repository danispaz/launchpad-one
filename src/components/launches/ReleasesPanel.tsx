import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Plus, ChevronDown, Trash2, GripVertical, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ReleaseItem { id: string; nome: string; status: string; ordem: number; }
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

  useEffect(() => { fetchReleases(); }, [launchId]);

  async function fetchReleases() {
    setLoading(true);
    try {
      const { data: releasesRaw, error: rError } = await supabase
        .from("releases").select("*").eq("launch_id", launchId).order("ordem");
      if (rError) throw rError;
      if (!releasesRaw?.length) { setReleases([]); return; }

      const releaseIds = releasesRaw.map(r => r.id);
      const { data: itemsRaw, error: iError } = await supabase
        .from("release_items").select("*").in("release_id", releaseIds).order("ordem");
      if (iError) throw iError;

      const itemsByRelease = (itemsRaw || []).reduce((acc, item) => {
        if (!acc[item.release_id]) acc[item.release_id] = [];
        acc[item.release_id].push(item);
        return acc;
      }, {} as Record<string, ReleaseItem[]>);

      setReleases(releasesRaw.map(r => ({ ...r, items: itemsByRelease[r.id] || [] })));
    } catch (err: any) {
      toast.error("Erro ao carregar releases", { description: err.message });
    } finally {
      setLoading(false);
    }
  }

  const toggleRelease = (id: string) => setExpandedReleases(prev =>
    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
  );

  const handleCreateRelease = async () => {
    if (!releaseNome.trim()) { toast.error("Nome é obrigatório"); return; }
    setIsSubmittingRelease(true);
    try {
      const { error } = await supabase.from("releases").insert({
        launch_id: launchId,
        nome: releaseNome,
        descricao: releaseDescricao || null,
        data_inicio: releaseDataInicio || null,
        data_prevista: releaseDataPrevista || null,
        status: releaseStatus,
        ordem: releases.length,
      });
      if (error) throw error;
      toast.success("Release criada com sucesso");
      setIsReleaseDialogOpen(false);
      setReleaseNome(""); setReleaseDescricao(""); setReleaseDataInicio(""); setReleaseDataPrevista(""); setReleaseStatus("Planejamento");
      fetchReleases();
    } catch (err: any) {
      toast.error("Erro ao criar release", { description: err.message });
    } finally {
      setIsSubmittingRelease(false);
    }
  };

  const handleDeleteRelease = async () => {
    if (!releaseToDelete) return;
    try {
      const { error } = await supabase.from("releases").delete().eq("id", releaseToDelete);
      if (error) throw error;
      toast.success("Release deletada");
      setReleaseToDelete(null);
      fetchReleases();
    } catch (err: any) {
      toast.error("Erro ao deletar release", { description: err.message });
    }
  };

  const handleUpdateRelease = async () => {
    if (!editingRelease || !releaseNome.trim()) { toast.error("Nome é obrigatório"); return; }
    setIsSubmittingRelease(true);
    try {
      const { error } = await supabase.from("releases").update({
        nome: releaseNome,
        descricao: releaseDescricao || null,
        data_inicio: releaseDataInicio || null,
        data_prevista: releaseDataPrevista || null,
        status: releaseStatus,
      }).eq("id", editingRelease.id);
      if (error) throw error;
      toast.success("Release atualizada");
      setIsReleaseDialogOpen(false);
      setEditingRelease(null);
      setReleaseNome(""); setReleaseDescricao(""); setReleaseDataInicio(""); setReleaseDataPrevista(""); setReleaseStatus("Planejamento");
      fetchReleases();
    } catch (err: any) {
      toast.error("Erro ao atualizar release", { description: err.message });
    } finally {
      setIsSubmittingRelease(false);
    }
  };

  const handleCreateItem = async () => {
    if (!itemNome.trim() || !activeReleaseId) { toast.error("Nome é obrigatório"); return; }
    setIsSubmittingItem(true);
    try {
      const release = releases.find(r => r.id === activeReleaseId);
      const { error } = await supabase.from("release_items").insert({
        release_id: activeReleaseId,
        nome: itemNome,
        status: itemStatus,
        ordem: release?.items.length || 0,
      });
      if (error) throw error;
      toast.success("Item adicionado");
      setIsItemDialogOpen(false);
      setItemNome(""); setItemStatus("pendente");
      fetchReleases();
    } catch (err: any) {
      toast.error("Erro ao criar item", { description: err.message });
    } finally {
      setIsSubmittingItem(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      const { error } = await supabase.from("release_items").delete().eq("id", itemToDelete);
      if (error) throw error;
      toast.success("Item removido");
      setItemToDelete(null);
      fetchReleases();
    } catch (err: any) {
      toast.error("Erro ao remover item", { description: err.message });
    }
  };

  const handleUpdateItemStatus = async (itemId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("release_items").update({ status: newStatus }).eq("id", itemId);
      if (error) throw error;
      fetchReleases();
    } catch (err: any) {
      toast.error("Erro ao atualizar status", { description: err.message });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-32">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
    </div>
  );

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
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${STATUS_COLORS[release.status] || STATUS_COLORS["Planejamento"]}`}>
                        {release.status}
                      </span>
                      {release.data_inicio && release.data_prevista && (
                        <span className="text-[10px] text-slate-400">
                          {new Date(release.data_inicio).toLocaleDateString("pt-BR")} → {new Date(release.data_prevista).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                    {release.descricao && <p className="text-xs text-slate-400 mt-0.5 truncate">{release.descricao}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-400 font-medium">{doneItems}/{release.items.length} itens</span>
                    <button onClick={() => { setActiveReleaseId(release.id); setIsItemDialogOpen(true); }}
                      className="h-7 px-2 rounded border border-border text-[11px] font-medium hover:bg-slate-50 transition-colors flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Item
                    </button>
                    <button onClick={() => { setEditingRelease(release); setReleaseNome(release.nome); setReleaseDescricao(release.descricao || ""); setReleaseDataInicio(release.data_inicio || ""); setReleaseDataPrevista(release.data_prevista || ""); setReleaseStatus(release.status); setIsReleaseDialogOpen(true); }}
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setReleaseToDelete(release.id)}
                      className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-50 divide-y divide-slate-50">
                    {release.items.length === 0 ? (
                      <div className="px-6 py-4 text-center">
                        <p className="text-xs text-slate-300 italic">Nenhum item. Clique em "+ Item" para adicionar.</p>
                      </div>
                    ) : (
                      release.items.map(item => (
                        <div key={item.id} className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50/50 transition-colors group">
                          <GripVertical className="w-3.5 h-3.5 text-slate-200 shrink-0" />
                          <p className="flex-1 text-sm text-slate-700">{item.nome}</p>
                          <select
                            value={item.status}
                            onChange={e => handleUpdateItemStatus(item.id, e.target.value)}
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border-0 cursor-pointer ${ITEM_STATUS_COLORS[item.status] || ITEM_STATUS_COLORS["pendente"]}`}
                          >
                            {ITEM_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                          <button onClick={() => setItemToDelete(item.id)}
                            className="p-1 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
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
            <div className="space-y-2"><Label>Descrição (opcional)</Label><Input value={releaseDescricao} onChange={e => setReleaseDescricao(e.target.value)} placeholder="O que entra nessa release..." /></div>
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

      <Dialog open={isItemDialogOpen} onOpenChange={(open) => { setIsItemDialogOpen(open); if (!open) { setItemNome(""); setItemStatus("pendente"); } }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Novo Item</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nome do item</Label><Input value={itemNome} onChange={e => setItemNome(e.target.value)} placeholder="Ex: Conta Digital, Emissão CT-e..." /></div>
            <div className="space-y-2"><Label>Status</Label>
              <Select value={itemStatus} onValueChange={setItemStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ITEM_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsItemDialogOpen(false)} disabled={isSubmittingItem}>Cancelar</Button>
            <Button onClick={handleCreateItem} disabled={isSubmittingItem}>{isSubmittingItem ? "Adicionando..." : "Adicionar Item"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!releaseToDelete} onOpenChange={(open) => !open && setReleaseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar release</AlertDialogTitle>
            <AlertDialogDescription>Todos os itens desta release serão deletados. Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRelease} className="bg-rose-500 hover:bg-rose-600">Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover item</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja remover este item?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-rose-500 hover:bg-rose-600">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
