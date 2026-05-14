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
    setActiveMod
