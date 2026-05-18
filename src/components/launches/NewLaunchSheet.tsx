import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useProfilesForOwner } from "@/hooks/useProfilesForOwner";
import { useProducts } from "@/hooks/useProducts";
import { useNavigate } from "@tanstack/react-router";

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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProductId?: string;
}

export function NewLaunchSheet({ open, onOpenChange, defaultProductId }: Props) {
  const { user } = useAuth();
  const { profiles, loading: loadingProfiles } = useProfilesForOwner();
  const { products, loading: loadingProducts } = useProducts();
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [productId, setProductId] = useState(defaultProductId || "");
  const [tipo, setTipo] = useState("release");
  const [prioridade, setPrioridade] = useState("média");
  const [ownerId, setOwnerId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataLancamento, setDataLancamento] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user?.id && !ownerId) setOwnerId(user.id);
  }, [user]);

  useEffect(() => {
    if (defaultProductId) setProductId(defaultProductId);
  }, [defaultProductId]);

  useEffect(() => {
    if (!open) {
      setNome(""); setDescricao(""); setProductId(defaultProductId || "");
      setTipo("release"); setPrioridade("média"); setOwnerId(user?.id || "");
      setDataInicio(""); setDataLancamento(""); setErrors({});
    }
  }, [open]);

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!nome.trim()) newErrors.nome = "Nome é obrigatório";
    if (!dataLancamento) newErrors.dataLancamento = "Data de projeto é obrigatória";
    if (!ownerId) newErrors.owner = "Selecione o responsável";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); toast.error("Preencha os campos obrigatórios"); return; }
    setErrors({});
    setSaving(true);

    try {
      const selectedProduct = products.find(p => p.id === productId);
      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        produto: selectedProduct?.nome || "",
        product_id: productId || null,
        tipo,
        prioridade,
        owner_id: ownerId,
        data_inicio: dataInicio || null,
        data_lancamento_prevista: dataLancamento,
      };

      const { data: inserted, error } = await supabase.from("launches").insert(payload).select("id").single();
      if (error) throw error;
      toast.success("Projeto criado!");
      onOpenChange(false);
      navigate({ to: "/launches/$id", params: { id: inserted.id } });
    } catch (err: any) {
      toast.error("Erro ao criar projeto", { description: err.message });
    } finally { setSaving(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="w-full max-w-[560px] bg-white flex flex-col h-full shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-bold text-slate-900">Criar um projeto</h2>
          <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

          {/* Nome */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Nome do projeto <span className="text-rose-500">*</span></Label>
            <Input
              value={nome} onChange={e => { setNome(e.target.value); setErrors(prev => ({ ...prev, nome: "" })); }}
              placeholder="Ex: Campanha de Black Friday" autoFocus
              className={errors.nome ? "border-rose-400" : ""}
            />
            {errors.nome && <p className="text-xs text-rose-500">{errors.nome}</p>}
          </div>

          {/* Prioridade ao lado do nome */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Prioridade</Label>
              <Select value={prioridade} onValueChange={setPrioridade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORIDADES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LAUNCH_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Descrição</Label>
            <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Detalhes sobre o objetivo do projeto..." className="resize-none min-h-[120px]" rows={5} />
          </div>

          {/* Produto e Responsável */}
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
              <Select value={ownerId} onValueChange={v => { setOwnerId(v); setErrors(prev => ({ ...prev, owner: "" })); }} disabled={loadingProfiles}>
                <SelectTrigger className={errors.owner ? "border-rose-400" : ""}><SelectValue placeholder={loadingProfiles ? "Carregando..." : "Selecione"} /></SelectTrigger>
                <SelectContent>{profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.nome || p.email}</SelectItem>)}</SelectContent>
              </Select>
              {errors.owner && <p className="text-xs text-rose-500">{errors.owner}</p>}
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Data de início</Label>
              <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Data de término <span className="text-rose-500">*</span></Label>
              <Input type="date" value={dataLancamento} onChange={e => { setDataLancamento(e.target.value); setErrors(prev => ({ ...prev, dataLancamento: "" })); }} className={errors.dataLancamento ? "border-rose-400" : ""} />
              {errors.dataLancamento && <p className="text-xs text-rose-500">{errors.dataLancamento}</p>}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Criando..." : "Salvar"}</Button>
        </div>
      </div>
    </div>
  );
}
