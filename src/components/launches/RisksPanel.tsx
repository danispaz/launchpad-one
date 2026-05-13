import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Plus, AlertOctagon, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Profile { id: string; nome: string | null; email: string | null; }
interface Risk {
  id: string; titulo: string; descricao: string | null;
  impacto: string; probabilidade: string; status: string;
  owner_id: string | null; owner?: Profile;
}

const IMPACTO_OPTIONS = ["baixo", "médio", "alto"];
const PROB_OPTIONS = ["baixa", "média", "alta"];
const STATUS_OPTIONS = ["identificado", "ativo", "mitigado"];

const IMPACTO_COLORS: Record<string, string> = {
  "alto": "bg-rose-100 text-rose-600",
  "médio": "bg-amber-100 text-amber-600",
  "baixo": "bg-slate-100 text-slate-500",
};

const STATUS_COLORS: Record<string, string> = {
  "ativo": "bg-rose-100 text-rose-600",
  "identificado": "bg-amber-100 text-amber-600",
  "mitigado": "bg-emerald-100 text-emerald-600",
};

interface Props { launchId: string; }

export function RisksPanel({ launchId }: Props) {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [riskToDelete, setRiskToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [impacto, setImpacto] = useState("médio");
  const [probabilidade, setProbabilidade] = useState("média");
  const [status, setStatus] = useState("identificado");
  const [ownerId, setOwnerId] = useState("");

  useEffect(() => { fetchData(); }, [launchId]);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: risksRaw, error: rError } = await supabase
        .from("risks").select("*").eq("launch_id", launchId).order("created_at");
      if (rError) throw rError;
      const { data: profilesRaw, error: pError } = await supabase
        .from("profiles").select("id, nome, email").order("nome");
      if (pError) throw pError;
      setProfiles(profilesRaw || []);
      const profileMap = Object.fromEntries((profilesRaw || []).map(p => [p.id, p]));
      setRisks((risksRaw || []).map(r => ({ ...r, owner: profileMap[r.owner_id] })));
    } catch (err: any) {
      toast.error("Erro ao carregar riscos", { description: err.message });
    } finally { setLoading(false); }
  }

  function openCreate() {
    setEditingRisk(null);
    setTitulo(""); setDescricao(""); setImpacto("médio"); setProbabilidade("média"); setStatus("identificado"); setOwnerId("");
    setIsDialogOpen(true);
  }

  function openEdit(risk: Risk) {
    setEditingRisk(risk);
    setTitulo(risk.titulo); setDescricao(risk.descricao || ""); setImpacto(risk.impacto);
    setProbabilidade(risk.probabilidade); setStatus(risk.status); setOwnerId(risk.owner_id || "");
    setIsDialogOpen(true);
  }

  const handleSave = async () => {
    if (!titulo.trim()) { toast.error("Título é obrigatório"); return; }
    setIsSubmitting(true);
    try {
      const payload = { titulo, descricao: descricao || null, impacto, probabilidade, status, owner_id: ownerId || null, launch_id: launchId };
      if (editingRisk) {
        const { error } = await supabase.from("risks").update(payload).eq("id", editingRisk.id);
        if (error) throw error;
        toast.success("Risco atualizado");
      } else {
        const { error } = await supabase.from("risks").insert(payload);
        if (error) throw error;
        toast.success("Risco criado");
      }
      setIsDialogOpen(false); fetchData();
    } catch (err: any) {
      toast.error("Erro ao salvar risco", { description: err.message });
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!riskToDelete) return;
    try {
      const { error } = await supabase.from("risks").delete().eq("id", riskToDelete);
      if (error) throw error;
      toast.success("Risco removido"); setRiskToDelete(null); fetchData();
    } catch (err: any) { toast.error("Erro ao remover risco", { description: err.message }); }
  };

  if (loading) return <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Riscos</h3>
          <p className="text-xs text-slate-400 mt-0.5">{risks.length} risco{risks.length !== 1 ? "s" : ""} identificado{risks.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openCreate} size="sm" className="h-8 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Novo Risco
        </Button>
      </div>

      {risks.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <p className="text-sm text-slate-400">Nenhum risco identificado.</p>
          <p className="text-xs text-slate-300 mt-1">Adicione riscos para acompanhar ameaças ao lançamento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {risks.map(risk => (
            <div key={risk.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-rose-300 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                  <p className="text-sm font-bold text-slate-800">{risk.titulo}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(risk)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setRiskToDelete(risk.id)} className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {risk.descricao && <p className="text-xs text-slate-500 leading-relaxed mb-4 break-words overflow-hidden">{risk.descricao}</p>}
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${IMPACTO_COLORS[risk.impacto] || IMPACTO_COLORS["baixo"]}`}>Impacto {risk.impacto}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Prob. {risk.probabilidade}</span>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${STATUS_COLORS[risk.status] || STATUS_COLORS["identificado"]}`}>{risk.status}</span>
              </div>
              {risk.owner && (
                <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                  <div className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500">
                    {risk.owner.nome?.substring(0, 2).toUpperCase() || "??"}
                  </div>
                  <span className="text-[11px] text-slate-500">{risk.owner.nome || risk.owner.email}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingRisk(null); }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader><DialogTitle>{editingRisk ? "Editar Risco" : "Novo Risco"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Título</Label><Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Atraso na integração com SEFAZ" /></div>
            <div className="space-y-2"><Label>Descrição (opcional)</Label><Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descreva o risco em detalhes..." className="resize-none" rows={3} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>Impacto</Label>
                <Select value={impacto} onValueChange={setImpacto}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{IMPACTO_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Probabilidade</Label>
                <Select value={probabilidade} onValueChange={setProbabilidade}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROB_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Responsável (opcional)</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.nome || p.email}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSubmitting}>{isSubmitting ? "Salvando..." : (editingRisk ? "Salvar alterações" : "Criar Risco")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!riskToDelete} onOpenChange={(open) => !open && setRiskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remover risco</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja remover este risco?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-rose-500 hover:bg-rose-600">Remover</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
