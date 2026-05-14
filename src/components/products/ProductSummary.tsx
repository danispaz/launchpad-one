import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  X, Pencil, Check, Package, ShoppingBag, CreditCard, Globe, HelpCircle,
  Target, Lightbulb, UserCheck, Trophy, LayoutGrid, AlertTriangle, Filter,
  ShieldCheck, MessageSquare, XCircle, BarChart2, DollarSign, Percent,
  Handshake, MapPin, Swords, Megaphone, Scale, ShoppingCart, Headphones, Settings
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const TAB_ICONS: Record<string, any> = {
  produto: Package, comercial: ShoppingBag, planos: CreditCard, mercado: Globe, faq: HelpCircle,
};

const ITEM_ICONS: Record<string, any> = {
  target: Target, lightbulb: Lightbulb, usercheck: UserCheck, trophy: Trophy,
  layoutgrid: LayoutGrid, alerttriangle: AlertTriangle, filter: Filter,
  shieldcheck: ShieldCheck, messagesquare: MessageSquare, xcircle: XCircle,
  barchart: BarChart2, dollar: DollarSign, percent: Percent, handshake: Handshake,
  mappin: MapPin, swords: Swords, megaphone: Megaphone, scale: Scale,
  shoppingcart: ShoppingCart, headphones: Headphones, settings: Settings,
};

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
    id: "produto", label: "Produto", icon: "produto",
    items: [
      { id: "problema", title: "Problema que resolve", description: "Qual dor real do cliente esse produto resolve?", icon: "target" },
      { id: "proposta_valor", title: "Proposta de Valor", description: "O que entregamos e por que o cliente escolhe", icon: "lightbulb" },
      { id: "icp", title: "ICP — Cliente Ideal", description: "Perfil, contexto e o que não é nosso ICP", icon: "usercheck" },
      { id: "diferencial", title: "Diferencial Competitivo", description: "Como nos diferenciamos da concorrência", icon: "trophy" },
      { id: "modulos", title: "Módulos do Produto", description: "Principais funcionalidades e módulos", icon: "layoutgrid" },
      { id: "limitacoes", title: "Limitações e Fora do Escopo", description: "O que o produto não faz", icon: "alerttriangle" },
    ],
  },
  {
    id: "comercial", label: "Comercial", icon: "comercial",
    items: [
      { id: "funil", title: "Funil de Aquisição", description: "Jornada do lead até a assinatura", icon: "filter" },
      { id: "regras_comerciais", title: "Regras Comerciais", description: "O que pode e não pode ser vendido", icon: "shieldcheck" },
      { id: "objecoes", title: "Objeções e Respostas", description: "Como responder as principais objeções", icon: "messagesquare" },
      { id: "cancelamento", title: "Cancelamento", description: "Processo, prazo e devolução", icon: "xcircle" },
    ],
  },
  {
    id: "planos", label: "Planos e Preços", icon: "planos",
    items: [
      { id: "planos_resumo", title: "Resumo dos Planos", description: "O que cada plano inclui", icon: "barchart" },
      { id: "modelo_receita", title: "Modelo de Receita", description: "Como o produto gera receita", icon: "dollar" },
      { id: "comissionamento", title: "Comissionamento", description: "Modelo, tiers e regras de pagamento", icon: "percent" },
      { id: "parceiros", title: "Parceiros e Canais", description: "Tipos de parceiro e condições", icon: "handshake" },
    ],
  },
  {
    id: "mercado", label: "Mercado", icon: "mercado",
    items: [
      { id: "segmento", title: "Segmento e Vertical", description: "Mercado e nicho de atuação", icon: "mappin" },
      { id: "concorrentes", title: "Concorrentes", description: "Principais players e análise", icon: "swords" },
      { id: "posicionamento", title: "Posicionamento", description: "Como nos comunicamos com o mercado", icon: "megaphone" },
      { id: "regulatorio", title: "Contexto Regulatório", description: "Leis e regulamentações relevantes", icon: "scale" },
    ],
  },
  {
    id: "faq", label: "FAQ por Time", icon: "faq",
    items: [
      { id: "faq_marketing", title: "FAQ Marketing", description: "Perguntas frequentes do time de marketing", icon: "megaphone" },
      { id: "faq_vendas", title: "FAQ Vendas", description: "Perguntas frequentes do time de vendas", icon: "shoppingcart" },
      { id: "faq_suporte", title: "FAQ Suporte", description: "Perguntas frequentes do suporte", icon: "headphones" },
      { id: "faq_tech", title: "FAQ Tecnologia", description: "Perguntas técnicas frequentes", icon: "settings" },
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
      <div className="flex items-center gap-1 border-b border-slate-100 mb-6 overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
        {TABS.map(tab => {
          const TabIcon = TAB_ICONS[tab.icon] || Package;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all shrink-0 ${
                activeTab === tab.id
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200"
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentTab.items.map(item => {
          const ItemIcon = ITEM_ICONS[item.icon] || Target;
          const hasContent = !!resumo[item.id];
          return (
            <button
              key={item.id}
              onClick={() => openModal(item)}
              className={`text-left p-5 md:p-6 rounded-2xl border transition-all group hover:shadow-md ${
                hasContent
                  ? "bg-white border-slate-200 hover:border-slate-300"
                  : "bg-slate-50/50 border-dashed border-slate-200 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-slate-100 group-hover:bg-slate-200 transition-colors">
                  <ItemIcon className="w-4 h-4 text-slate-600" />
                </div>
                {hasContent && (
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"></div>
                    <span className="text-[10px] text-emerald-600 font-medium">Preenchido</span>
                  </div>
                )}
              </div>
              <p className="text-sm font-bold text-slate-800 mb-2 leading-tight">{item.title}</p>
              {hasContent ? (
                <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">{resumo[item.id]}</p>
              ) : (
                <p className="text-xs text-slate-400 italic leading-relaxed">{item.description}</p>
              )}
            </button>
          );
        })}
      </div>

      {activeModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[600px] max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-start justify-between p-6 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                {(() => { const Icon = ITEM_ICONS[activeModal.icon] || Target; return <Icon className="w-5 h-5 text-slate-600 shrink-0" />; })()}
                <div>
                  <h3 className="text-base font-bold text-slate-900">{activeModal.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{activeModal.description}</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

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
                      {(() => { const Icon = ITEM_ICONS[activeModal.icon] || Target; return <Icon className="w-10 h-10 text-slate-300 mb-3" />; })()}
                      <p className="text-sm font-medium text-slate-500 mb-1">Ainda não preenchido</p>
                      <p className="text-xs text-slate-400">{activeModal.description}</p>
                    </div>
                  )}
                </>
              )}
            </div>

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
