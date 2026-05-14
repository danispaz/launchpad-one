import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { X, Pencil, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ContentItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  content?: string;
}

interface TabConfig {
  id: string;
  label: string;
  icon: string;
  items: ContentItem[];
}

const TABS: TabConfig[] = [
  {
    id: "produto",
    label: "Produto",
    icon: "📦",
    items: [
      { id: "problema", title: "Problema que resolve", description: "Qual dor real do cliente esse produto resolve?", icon: "🎯" },
      { id: "proposta_valor", title: "Proposta de Valor", description: "O que entregamos e por que o cliente escolhe", icon: "💡" },
      { id: "icp", title: "ICP — Cliente Ideal", description: "Perfil, contexto e o que não é nosso ICP", icon: "👤" },
      { id: "diferencial", title: "Diferencial Competitivo", description: "Como nos diferenciamos da concorrência", icon: "🏆" },
      { id: "modulos", title: "Módulos do Produto", description: "Principais funcionalidades e módulos", icon: "🧩" },
      { id: "limitacoes", title: "Limitações e Fora do Escopo", description: "O que o produto não faz", icon: "⚠️" },
    ],
  },
  {
    id: "comercial",
    label: "Comercial",
    icon: "🏪",
    items: [
      { id: "funil", title: "Funil de Aquisição", description: "Jornada do lead até a assinatura", icon: "🔽" },
      { id: "regras_comerciais", title: "Regras Comerciais", description: "O que pode e não pode ser vendido", icon: "📋" },
      { id: "objecoes", title: "Objeções e Respostas", description: "Como responder as principais objeções", icon: "💬" },
      { id: "cancelamento", title: "Cancelamento", description: "Processo, prazo e devolução", icon: "❌" },
    ],
  },
  {
    id: "planos",
    label: "Planos e Preços",
    icon: "💰",
    items: [
      { id: "planos_resumo", title: "Resumo dos Planos", description: "O que cada plano inclui", icon: "📊" },
      { id: "modelo_receita", title: "Modelo de Receita", description: "Como o produto gera receita", icon: "💵" },
      { id: "comissionamento", title: "Comissionamento", description: "Modelo, tiers e regras de pagamento", icon: "💸" },
      { id: "parceiros", title: "Parceiros e Canais", description: "Tipos de parceiro e condições", icon: "🤝" },
    ],
  },
  {
    id: "mercado",
    label: "Mercado",
    icon: "🌎",
    items: [
      { id: "segmento", title: "Segmento e Vertical", description: "Mercado e nicho de atuação", icon: "🎯" },
      { id: "concorrentes", title: "Concorrentes", description: "Principais players e análise", icon: "⚔️" },
      { id: "posicionamento", title: "Posicionamento", description: "Como nos comunicamos com o mercado", icon: "📣" },
      { id: "regulatorio", title: "Contexto Regulatório", description: "Leis e regulamentações relevantes", icon: "⚖️" },
    ],
  },
  {
    id: "faq",
    label: "FAQ por Time",
    icon: "❓",
    items: [
      { id: "faq_marketing", title: "FAQ Marketing", description: "Perguntas frequentes do time de marketing", icon: "📢" },
      { id: "faq_vendas", title: "FAQ Vendas", description: "Perguntas frequentes do time de vendas", icon: "🛒" },
      { id: "faq_suporte", title: "FAQ Suporte", description: "Perguntas frequentes do suporte", icon: "🎧" },
      { id: "faq_tech", title: "FAQ Tecnologia", description: "Perguntas técnicas frequentes", icon: "⚙️" },
    ],
  },
];

interface Props { productId: string; }

export function ProductSummary({ productId }: Props) {
  const [resumo, setResumo] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("produto");
  const [activeModal, setActiveModal] = useState<ContentItem | null>(null);
  const [editMode, setEditMode] = useState(false);
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
      if (!error && data?.resumo) setResumo(data.resumo as Record<string, string>);
      setLoading(false);
    }
    fetchResumo();
  }, [productId]);

  const openModal = (item: ContentItem) => {
    setActiveModal({ ...item, content: resumo[item.id] || "" });
    setEditMode(false);
    setEditValue(resumo[item.id] || "");
  };

  const closeModal = () => {
    setActiveModal(null);
    setEditMode(false);
    setEditValue("");
  };

  const handleSave = async () => {
    if (!activeModal) return;
    setSaving(true);
    try {
      const newResumo = { ...resumo, [activeModal.id]: editValue };
      const { error } = await supabase
        .from("products")
        .update({ resumo: newResumo })
        .eq("id", productId);
      if (error) throw error;
      setResumo(newResumo);
      setActiveModal({ ...activeModal, content: editValue });
      setEditMode(false);
      toast.success("Salvo com sucesso");
    } catch (err: any) {
      toast.error("Erro ao salvar", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const currentTab = TABS.find(t => t.id === activeTab)!;

  if (loading) return (
    <div className="flex items-center justify-center h-24">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-0">
      {/* Tab navigation */}
      <div className="flex items-center gap-1 border-b border-slate-100 mb-6 overflow-x-auto pb-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
              activeTab === tab.id
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {currentTab.items.map(item => {
          const hasContent = !!resumo[item.id];
          return (
            <button
              key={item.id}
              onClick={() => openModal(item)}
              className={`text-left p-4 rounded-xl border transition-all group hover:shadow-md ${
                hasContent
                  ? "bg-white border-slate-200 hover:border-slate-300"
                  : "bg-slate-50/50 border-dashed border-slate-200 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <div className="text-2xl mb-3">{item.icon}</div>
              <p className="text-sm font-semibold text-slate-800 mb-1 leading-tight">{item.title}</p>
              {hasContent ? (
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {resumo[item.id]}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic">{item.description}</p>
              )}
              {hasContent && (
                <div className="mt-3 flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"></div>
                  <span className="text-[10px] text-emerald-600 font-medium">Preenchido</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Modal */}
      {activeModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[600px] max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{activeModal.icon}</span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{activeModal.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{activeModal.description}</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto p-6">
              {editMode ? (
                <Textarea
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  placeholder={`Preencha: ${activeModal.description}`}
                  className="resize-none text-sm w-full min-h-[200px]"
                  autoFocus
                />
              ) : (
                <>
                  {activeModal.content ? (
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{activeModal.content}</p>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <span className="text-4xl mb-3">{activeModal.icon}</span>
                      <p className="text-sm font-medium text-slate-500 mb-1">Ainda não preenchido</p>
                      <p className="text-xs text-slate-400">{activeModal.description}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
              {editMode ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setEditMode(false)} disabled={saving}>Cancelar</Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-xs text-slate-400">Clique em editar para preencher</p>
                  <Button size="sm" onClick={() => setEditMode(true)}>
                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                    Editar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
