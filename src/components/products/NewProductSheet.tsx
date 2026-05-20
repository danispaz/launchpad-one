import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useProfilesForOwner } from "@/hooks/useProfilesForOwner";
import { toast } from "sonner";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_LIFECYCLE_STAGES,
  CATEGORY_LABELS,
  LIFECYCLE_LABELS,
  LIFECYCLE_ICONS,
  type NewProductInput,
} from "@/lib/schemas/product-schema";

type Tab = "principal" | "impostos";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createProduct: (input: NewProductInput) => Promise<void>;
}

export function NewProductSheet({ open, onOpenChange, createProduct }: Props) {
  const { user } = useAuth();
  const { profiles, loading: loadingProfiles } = useProfilesForOwner();

  const [tab, setTab] = useState<Tab>("principal");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Principal
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"produto" | "servico">("produto");
  const [categoria, setCategoria] = useState("");
  const [estagio, setEstagio] = useState("descoberta");
  const [codigo, setCodigo] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [descricao, setDescricao] = useState("");
  const [ownerId, setOwnerId] = useState("");

  // Impostos e preços
  const [preco, setPreco] = useState("");
  const [precoCompra, setPrecoCompra] = useState("");
  const [unidadeMedida, setUnidadeMedida] = useState("");
  const [aliquotaImposto, setAliquotaImposto] = useState("");
  const [ncm, setNcm] = useState("");
  const [observacoesImposto, setObservacoesImposto] = useState("");

  useEffect(() => {
    if (user?.id && !ownerId) setOwnerId(user.id);
  }, [user]);

  useEffect(() => {
    if (!open) {
      setTab("principal");
      setNome(""); setTipo("produto"); setCategoria(""); setEstagio("descoberta");
      setCodigo(""); setAtivo(true); setDescricao(""); setOwnerId(user?.id || "");
      setPreco(""); setPrecoCompra(""); setUnidadeMedida(""); setAliquotaImposto("");
      setNcm(""); setObservacoesImposto(""); setErrors({});
    }
  }, [open]);

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!nome.trim()) newErrors.nome = "Nome é obrigatório";
    if (nome.trim().length < 3) newErrors.nome = "Nome precisa ter pelo menos 3 caracteres";
    if (!categoria) newErrors.categoria = "Selecione uma categoria";
    if (!ownerId) newErrors.owner = "Selecione o responsável";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (newErrors.nome || newErrors.categoria || newErrors.owner) setTab("principal");
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await createProduct({
        nome: nome.trim(),
        descricao: descricao.trim() || "",
        categoria: categoria as any,
        estagio_atual: estagio as any,
        owner_id: ownerId,
      });
      toast.success("Produto criado!");
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro ao criar produto", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="w-full max-w-[560px] bg-white flex flex-col h-full shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-bold text-slate-900">Adicionar um produto</h2>
          <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-slate-100 px-6 shrink-0">
          {([["principal", "Principal"], ["impostos", "Impostos e preços"]] as [Tab, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${tab === key ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

          {tab === "principal" && (
            <>
              {/* Nome */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Nome <span className="text-rose-500">*</span></Label>
                <Input
                  value={nome}
                  onChange={e => { setNome(e.target.value); setErrors(prev => ({ ...prev, nome: "" })); }}
                  placeholder="Nome do produto"
                  autoFocus
                  className={errors.nome ? "border-rose-400" : ""}
                />
                {errors.nome && <p className="text-xs text-rose-500">{errors.nome}</p>}
              </div>

              {/* Tipo */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Tipo</Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="tipo" value="produto" checked={tipo === "produto"} onChange={() => setTipo("produto")} className="accent-slate-900" />
                    <span className="text-sm text-slate-700">Produto</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="tipo" value="servico" checked={tipo === "servico"} onChange={() => setTipo("servico")} className="accent-slate-900" />
                    <span className="text-sm text-slate-700">Serviço</span>
                  </label>
                </div>
              </div>

              {/* Categoria + Estágio */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Categoria <span className="text-rose-500">*</span></Label>
                  <Select value={categoria} onValueChange={v => { setCategoria(v); setErrors(prev => ({ ...prev, categoria: "" })); }}>
                    <SelectTrigger className={errors.categoria ? "border-rose-400" : ""}>
                      <SelectValue placeholder="Não especificado" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.categoria && <p className="text-xs text-rose-500">{errors.categoria}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Estágio atual</Label>
                  <Select value={estagio} onValueChange={setEstagio}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRODUCT_LIFECYCLE_STAGES.map(s => {
                        const Icon = LIFECYCLE_ICONS[s];
                        return (
                          <SelectItem key={s} value={s}>
                            <div className="flex items-center gap-2"><Icon className="w-3.5 h-3.5" />{LIFECYCLE_LABELS[s]}</div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Código + Ativo */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Código</Label>
                  <Input value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="SKU ou código interno" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => setAtivo(!ativo)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${ativo ? "bg-emerald-500" : "bg-slate-200"}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${ativo ? "translate-x-4.5" : "translate-x-0.5"}`} />
                    </button>
                    <span className="text-sm text-slate-700">{ativo ? "Ativo" : "Inativo"}</span>
                  </div>
                </div>
              </div>

              {/* Responsável */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Responsável <span className="text-rose-500">*</span></Label>
                <Select value={ownerId} onValueChange={v => { setOwnerId(v); setErrors(prev => ({ ...prev, owner: "" })); }} disabled={loadingProfiles}>
                  <SelectTrigger className={errors.owner ? "border-rose-400" : ""}>
                    <SelectValue placeholder={loadingProfiles ? "Carregando..." : "Selecione"} />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.nome || p.email}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.owner && <p className="text-xs text-rose-500">{errors.owner}</p>}
              </div>

              {/* Descrição */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Descrição</Label>
                <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descreva brevemente o produto..." className="resize-none min-h-[100px]" rows={4} />
              </div>
            </>
          )}

          {tab === "impostos" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Preço de venda</Label>
                  <Input value={preco} onChange={e => setPreco(e.target.value)} placeholder="R$ 0,00" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Preço de compra</Label>
                  <Input value={precoCompra} onChange={e => setPrecoCompra(e.target.value)} placeholder="R$ 0,00" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Unidade de medida</Label>
                <Input value={unidadeMedida} onChange={e => setUnidadeMedida(e.target.value)} placeholder="Ex: un, kg, l, m²" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Alíquota de imposto (%)</Label>
                  <Input value={aliquotaImposto} onChange={e => setAliquotaImposto(e.target.value)} placeholder="Ex: 12" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">NCM</Label>
                  <Input value={ncm} onChange={e => setNcm(e.target.value)} placeholder="Código NCM" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Observações fiscais</Label>
                <Textarea value={observacoesImposto} onChange={e => setObservacoesImposto(e.target.value)} placeholder="Informações adicionais sobre tributação..." className="resize-none min-h-[100px]" rows={4} />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </div>
      </div>
    </div>
  );
}
