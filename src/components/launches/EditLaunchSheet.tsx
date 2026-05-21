import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfilesForOwner } from "@/hooks/useProfilesForOwner";
import { useProducts } from "@/hooks/useProducts";

const LAUNCH_TYPES = [
  { value: "release", label: "Release" },
  { value: "campanha", label: "Campanha" },
  { value: "evento", label: "Evento" },
  { value: "parceria", label: "Parceria" },
  { value: "expansao", label: "Expansão" },
];

const PRIORIDADES = [
  { value: "baixa", label: "Baixa" },
  { value: "média", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "crítica", label: "Crítica" },
];

const STATUSES = [
  { value: "planejamento", label: "Planejamento" },
  { value: "em_andamento", label: "Ativo" },
  { value: "em_risco", label: "Em risco" },
  { value: "atrasado", label: "Atrasado" },
  { value: "concluido", label: "Concluído" },
];

interface Launch {
  id: string;
  nome: string;
  descricao?: string | null;
  produto?: string | null;
  product_id?: string | null;
  tipo?: string;
  prioridade?: string;
  status?: string;
  owner_id?: string | null;
  data_inicio?: string | null;
  data_lancamento_prevista?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  launch: Launch | null;
  onSuccess: () => void;
}

export function EditLaunchSheet({ open, onOpenChange, launch, onSuccess }: Props) {
  const { profiles, loading: loadingProfiles } = useProfilesForOwner();
  const { products, loading: loadingProducts } = useProducts();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [productId, setProductId] = useState("");
  const [tipo, setTipo] = useState("release");
  const [prioridade, setPrioridade] = useState("média");
  const [status, setStatus] = useState("planejamento");
  const [ownerId, setOwnerId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataLancamento, setDataLancamento] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (launch && open) {
      setNome(launch.nome || "");
      setDescricao(launch.descricao || "");
      setProductId(launch.product_id || "");
      setTipo(launch.tipo || "release");
      setPrioridade(launch.prioridade || "média");
      setStatus(launch.status || "planejamento");
      setOwnerId(launch.owner_id || "");
      setDataInicio(launch.data_inicio || "");
      setDataLancamento(launch.data_lancamento_prevista || "");
      setErrors({});
    }
  }, [launch, open]);

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!nome.trim()) newErrors.nome = "Nome é obrigatório";
    if (!dataLancamento) newErrors.dataLancamento = "Data de término é obrigatória";
    if (!ownerId) newErrors.owner = "Selecione o responsável";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const selectedProduct = products.find(p => p.id === productId);
      const { error } = await supabase.from("launches").update({
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        produto: selectedProduct?.nome || "",
        product_id: productId || null,
        tipo,
        prioridade,
        status,
        owner_id: ownerId,
        data_inicio: dataInicio || null,
        data_lancamento_prevista: dataLancamento,
      }).eq("id", launch!.id);

      if (error) throw error;
      toast.success("Projeto atualizado!");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro ao atualizar projeto", { description: err.message });
    } finally { setSaving(false); }
  };

  if (!open || !launch) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="w-full max-w-[560px] bg-white flex flex-col h-full shadow-2xl">

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-bold text-slate-900">Editar projeto</h2>
          <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Nome do projeto <span className="text-rose-500">*</span></Label>
            <Input value={nome} onChange={e => { setNome(e.target.value); setErrors(p => ({ ...p, nome: "" })); }}
              placeholder="Nome do projeto" autoFocus className={errors.nome ? "border-rose-400" : ""} />
            {errors.nome && <p className="text-xs text-rose-500">{errors.nome}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Prioridade</Label>
              <Select value={prioridade} onValueChange={setPrioridade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORIDADES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LAUNCH_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Descrição</Label>
            <Textarea value={descricao} onChange={e => setDescricao(e.target.value)}
              placeholder="Detalhes sobre o objetivo do projeto..." className="resize-none min-h-[120px]" rows={5} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Produto</Label>
              <Select value={productId || "none"} onValueChange={v => setProductId(v === "none" ? "" : v)} disabled={loadingProducts}>
                <SelectTrigger><SelectValue placeholder={loadingProducts ? "Carregando..." : "Não definido"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não definido</SelectItem>
                  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Gerente de projeto <span className="text-rose-500">*</span></Label>
              <Select value={ownerId} onValueChange={v => { setOwnerId(v); setErrors(p => ({ ...p, owner: "" })); }} disabled={loadingProfiles}>
                <SelectTrigger className={errors.owner ? "border-rose-400" : ""}><SelectValue placeholder={loadingProfiles ? "Carregando..." : "Selecione"} /></SelectTrigger>
                <SelectContent>{profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.nome || p.email}</SelectItem>)}</SelectContent>
              </Select>
              {errors.owner && <p className="text-xs text-rose-500">{errors.owner}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Data de início</Label>
              <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Data de término <span className="text-rose-500">*</span></Label>
              <Input type="date" value={dataLancamento}
                onChange={e => { setDataLancamento(e.target.value); setErrors(p => ({ ...p, dataLancamento: "" })); }}
                className={errors.dataLancamento ? "border-rose-400" : ""} />
              {errors.dataLancamento && <p className="text-xs text-rose-500">{errors.dataLancamento}</p>}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar alterações"}</Button>
        </div>
      </div>
    </div>
  );
}
