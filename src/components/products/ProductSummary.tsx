import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Pencil, X, Check, Target, Lightbulb, Users, Trophy, DollarSign, Handshake, Percent } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ResumoData {
  problema?: string;
  proposta_valor?: string;
  icp?: string;
  diferencial?: string;
  modelo_receita?: string;
  parceiros?: string;
  comissionamento?: string;
}

const FIELDS: { key: keyof ResumoData; label: string; icon: any; placeholder: string }[] = [
  { key: "problema", label: "Problema que resolve", icon: Target, placeholder: "Qual dor real do cliente esse produto resolve?" },
  { key: "proposta_valor", label: "Proposta de Valor", icon: Lightbulb, placeholder: "O que o produto entrega de diferente e por que o cliente escolhe?" },
  { key: "icp", label: "Perfil do Cliente Ideal (ICP)", icon: Users, placeholder: "Quem é o cliente ideal? Cargo, empresa, contexto, dores específicas." },
  { key: "diferencial", label: "Diferencial Competitivo", icon: Trophy, placeholder: "Como se diferencia da concorrência? O que os concorrentes não fazem?" },
  { key: "modelo_receita", label: "Modelo de Receita", icon: DollarSign, placeholder: "Como o produto gera receita? Assinatura, licença, uso, etc." },
  { key: "parceiros", label: "Parceiros e Canais", icon: Handshake, placeholder: "Tipos de parceiro, condições, territórios ou segmentos por canal." },
  { key: "comissionamento", label: "Comissionamento", icon: Percent, placeholder: "Modelo de comissão, tabela de tiers, prazo de pagamento, regras de chargeback." },
];

interface Props { productId: string; }

export function ProductSummary({ productId }: Props) {
  const [resumo, setResumo] = useState<ResumoData>({});
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<keyof ResumoData | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchResumo() {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("resumo")
        .eq("id", productId)
        .single();
      if (!error && data?.resumo) setResumo(data.resumo as ResumoData);
      setLoading(false);
    }
    fetchResumo();
  }, [productId]);

  const handleEdit = (key: keyof ResumoData) => {
    setEditingField(key);
    setEditValue(resumo[key] || "");
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue("");
  };

  const handleSave = async () => {
    if (!editingField) return;
    setSaving(true);
    try {
      const newResumo = { ...resumo, [editingField]: editValue };
      const { error } = await supabase
        .from("products")
        .update({ resumo: newResumo })
        .eq("id", productId);
      if (error) throw error;
      setResumo(newResumo);
      setEditingField(null);
      setEditValue("");
      toast.success("Salvo com sucesso");
    } catch (err: any) {
      toast.error("Erro ao salvar", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-24">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-3 mb-8">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">Resumo do Produto</h3>
        <p className="text-xs text-slate-400">Clique em qualquer campo para editar</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {FIELDS.map(({ key, label, icon: Icon, placeholder }) => {
          const value = resumo[key];
          const isEditing = editingField === key;
          return (
            <div
              key={key}
              className={`bg-white rounded-xl border transition-all ${isEditing ? "border-primary shadow-sm md:col-span-2" : "border-slate-100 shadow-sm hover:border-slate-200 cursor-pointer group"}`}
            >
              {isEditing ? (
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary shrink-0" />
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p>
                  </div>
                  <Textarea
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    placeholder={placeholder}
                    className="resize-none text-sm"
                    rows={4}
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                      <X className="w-3.5 h-3.5 mr-1" /> Cancelar
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                      <Check className="w-3.5 h-3.5 mr-1" /> {saving ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 h-full" onClick={() => handleEdit(key)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                    </div>
                    <Pencil className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {value ? (
                    <p className="text-sm text-slate-700 leading-relaxed line-clamp-4 whitespace-pre-wrap">{value}</p>
                  ) : (
                    <p className="text-xs text-slate-300 italic">{placeholder}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
