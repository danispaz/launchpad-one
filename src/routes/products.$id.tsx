import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { useProductDetail } from "@/hooks/useProductDetail";
import { LifecycleTransitionDialog } from "@/components/products/LifecycleTransitionDialog";
import { LifecycleHistoryDisplay } from "@/components/products/LifecycleHistoryDisplay";
import { ProductRoadmap } from "@/components/products/ProductRoadmap";
import { EditProductSheet } from "@/components/products/EditProductSheet";
import { CATEGORY_LABELS, LIFECYCLE_LABELS, LIFECYCLE_ICONS } from "@/lib/schemas/product-schema";
import { ChevronLeft, ArrowRightLeft, ListTodo, Users, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/products/$id")({
  head: () => ({ meta: [{ title: "LaunchHub — Detalhes do Produto" }] }),
  component: ProductDetail,
});

const TABS = [
  { key: "overview", label: "Visão Geral" },
  { key: "escopo", label: "Escopo" },
  { key: "comercial", label: "Comercial" },
  { key: "entrega", label: "Entrega" },
  { key: "roadmap", label: "Roadmap" },
  { key: "tasks", label: "Tarefas" },
  { key: "team", label: "Time" },
];

function ProductDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { product, loading, error, refetch } = useProductDetail(id);
  const [isTransitionDialogOpen, setIsTransitionDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [deleting, setDeleting] = useState(false);

  const handleTransitionComplete = () => {
    refetch();
    setHistoryRefreshKey(k => k + 1);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      toast.success("Produto excluído");
      navigate({ to: "/products" });
    } catch (err: any) {
      toast.error("Erro ao excluir produto", { description: err.message });
    } finally {
      setDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (error || !product) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
          <p className="text-destructive font-bold">{error || "Produto não encontrado"}</p>
          <Link to="/products" className="text-primary hover:underline flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> Voltar para produtos
          </Link>
        </div>
      </AppLayout>
    );
  }

  const p = product as any;
  const m = p.metadata || {};
  const StageIcon = LIFECYCLE_ICONS[product.estagio_atual];
  const isAtivo = p.ativo !== false;

  const healthColor = product.status_saude === "saudavel" ? "text-emerald-600 bg-emerald-50" :
    product.status_saude === "atencao" ? "text-amber-600 bg-amber-50" : "text-rose-600 bg-rose-50";

  // Mock updateProduct para o EditProductSheet
  const updateProduct = async (productId: string, input: any) => {
    const { error } = await supabase.from("products").update(input).eq("id", productId);
    if (error) throw error;
    await refetch();
  };

  return (
    <AppLayout>
      <TopBar title={product.nome} subtitle="Detalhes do produto" />

      <div className="flex-1 overflow-auto">
        <div className="max-w-[1100px] mx-auto px-8 py-8">

          <Link to="/products" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-6 transition-colors">
            <ChevronLeft className="h-3 w-3" /> Produtos
          </Link>

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${isAtivo ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {isAtivo ? "Ativo" : "Inativo"}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                  <StageIcon className="w-3 h-3" />
                  {LIFECYCLE_LABELS[product.estagio_atual]}
                </span>
                {p.tipo && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                    {p.tipo}
                  </span>
                )}
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${healthColor}`}>
                  {product.score_saude}/100
                </span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 mb-2">{product.nome}</h1>
              {m.descricao_curta && <p className="text-base text-slate-500 leading-relaxed">{m.descricao_curta}</p>}
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setIsEditOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700">
                <Pencil className="w-3.5 h-3.5" /> Editar
              </button>
              <button onClick={() => setIsDeleteOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-rose-200 hover:bg-rose-50 transition-colors text-rose-600">
                <Trash2 className="w-3.5 h-3.5" /> Excluir
              </button>
              <button onClick={() => setIsTransitionDialogOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-foreground text-background hover:opacity-90 transition-opacity">
                <ArrowRightLeft className="w-3.5 h-3.5" /> Mudar estágio
              </button>
            </div>
          </div>

          {/* Cards de info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <InfoCard label="Categoria" value={CATEGORY_LABELS[product.categoria]} />
            <InfoCard label="Responsável" value={product.owner_nome || "—"} />
            {p.codigo && <InfoCard label="Código" value={p.codigo} mono />}
            {p.versao && <InfoCard label="Versão" value={p.versao} />}
            {p.subcategoria && <InfoCard label="Subcategoria" value={p.subcategoria} />}
            {p.area_executora && <InfoCard label="Área executora" value={p.area_executora} />}
          </div>

          {/* Abas */}
          <div className="flex items-center gap-0 border-b border-slate-200 mb-8 overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === tab.key ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="space-y-8">
              {product.descricao && (
                <Section title="Descrição completa">
                  <div className="prose prose-sm max-w-none text-slate-600" dangerouslySetInnerHTML={{ __html: product.descricao }} />
                </Section>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RichField label="Problema que resolve" value={m.problema_resolve} />
                <RichField label="Proposta de valor" value={m.proposta_valor} />
                <RichField label="Benefício principal" value={m.beneficio_principal} plain />
                <RichField label="Diferenciais" value={m.diferenciais} />
                <RichField label="Público-alvo" value={m.publico_alvo} />
                <RichField label="Perfil não indicado" value={m.perfil_nao_indicado} />
                <RichField label="Principais objeções" value={m.objecoes_comuns} />
                <RichField label="Argumento comercial" value={m.argumento_comercial} />
              </div>
              <LifecycleHistoryDisplay productId={product.id} key={historyRefreshKey} />
            </div>
          )}

          {activeTab === "escopo" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RichField label="O que está incluso" value={m.incluso} />
              <RichField label="O que não está incluso" value={m.nao_incluso} />
              <RichField label="Pré-requisitos" value={m.prerequisitos} />
              <RichField label="Limites de uso" value={m.limites_uso} />
              <RichField label="Serviços adicionais" value={m.servicos_adicionais} />
              <RichField label="Condições especiais" value={m.condicoes_especiais} />
              <RichField label="Dependências internas" value={m.dependencias_internas} />
              <RichField label="Dependências externas" value={m.dependencias_externas} />
              <RichField label="Critérios de elegibilidade" value={m.criterios_elegibilidade} />
              <RichField label="Critérios de recusa" value={m.criterios_recusa} />
            </div>
          )}

          {activeTab === "comercial" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {m.modelo_cobranca && <InfoCard label="Modelo de cobrança" value={m.modelo_cobranca} />}
                {m.preco_base && <InfoCard label="Preço base" value={m.preco_base} />}
                {m.setup_implantacao && <InfoCard label="Setup" value={m.setup_implantacao} />}
                {m.margem_esperada && <InfoCard label="Margem esperada" value={m.margem_esperada} />}
                {m.custo_estimado && <InfoCard label="Custo estimado" value={m.custo_estimado} />}
                {m.comissao && <InfoCard label="Comissão" value={m.comissao} />}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RichField label="Faixas de preço" value={m.faixas_preco} />
                <RichField label="Adicionais" value={m.adicionais} />
                <RichField label="Política de desconto" value={m.politica_desconto} />
                <RichField label="Aprovação de desconto" value={m.aprovacao_desconto} />
                <RichField label="Regra de cancelamento" value={m.regras_cancelamento} />
                <RichField label="Reajuste" value={m.reajuste} />
              </div>
            </div>
          )}

          {activeTab === "entrega" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {m.forma_entrega && <InfoCard label="Forma de entrega" value={m.forma_entrega} />}
                {m.frequencia && <InfoCard label="Frequência" value={m.frequencia} />}
                {m.prazo_ativacao && <InfoCard label="Prazo de ativação" value={m.prazo_ativacao} />}
                {m.prazo_entrega && <InfoCard label="Prazo de entrega" value={m.prazo_entrega} />}
                {m.sla_atendimento && <InfoCard label="SLA" value={m.sla_atendimento} />}
                {m.canal_atendimento && <InfoCard label="Canal" value={m.canal_atendimento} />}
                {m.responsavel_execucao && <InfoCard label="Resp. execução" value={m.responsavel_execucao} />}
                {m.responsavel_acompanhamento && <InfoCard label="Resp. acompanhamento" value={m.responsavel_acompanhamento} />}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RichField label="Entregáveis" value={m.entregaveis} />
                <RichField label="Critério de início" value={m.criterio_inicio} />
                <RichField label="Critério de conclusão" value={m.criterio_conclusao} />
                <RichField label="Documentos necessários" value={m.documentos_necessarios} />
              </div>
            </div>
          )}

          {activeTab === "roadmap" && <ProductRoadmap productId={product.id} />}

          {activeTab === "tasks" && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ListTodo className="w-12 h-12 text-slate-200 mb-4" />
              <p className="text-sm text-slate-400 font-medium">Tarefas do produto em construção</p>
            </div>
          )}

          {activeTab === "team" && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users className="w-12 h-12 text-slate-200 mb-4" />
              <p className="text-sm text-slate-400 font-medium">Time do produto em construção</p>
            </div>
          )}
        </div>
      </div>

      <EditProductSheet
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        product={product}
        updateProduct={updateProduct}
      />

      <LifecycleTransitionDialog
        open={isTransitionDialogOpen}
        onOpenChange={setIsTransitionDialogOpen}
        productId={product.id}
        estagioAtual={product.estagio_atual}
        onTransitionComplete={handleTransitionComplete}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{product.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-rose-500 hover:bg-rose-600">
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

function InfoCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className={`text-sm font-semibold text-slate-800 truncate ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function RichField({ label, value, plain }: { label: string; value?: string; plain?: boolean }) {
  if (!value) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">{label}</p>
      {plain ? (
        <p className="text-sm text-slate-700 leading-relaxed">{value}</p>
      ) : (
        <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: value }} />
      )}
    </div>
  );
}
