import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { Avatar } from "@/components/Badges";
import { useProductDetail } from "@/hooks/useProductDetail";
import { BriefingDisplay } from "@/components/products/BriefingDisplay";
import { ProductSummary } from "@/components/products/ProductSummary";
import { ProductLaunchesList } from "@/components/products/ProductLaunchesList";
import { LifecycleTransitionDialog } from "@/components/products/LifecycleTransitionDialog";
import { LifecycleHistoryDisplay } from "@/components/products/LifecycleHistoryDisplay";
import {
  CATEGORY_LABELS,
  LIFECYCLE_LABELS,
  LIFECYCLE_ICONS,
} from "@/lib/schemas/product-schema";
import { ChevronLeft, Heart, User, Tag, ArrowRightLeft } from "lucide-react";
import { ProductRoadmap } from "@/components/products/ProductRoadmap";

export const Route = createFileRoute("/products/$id")({
  head: () => ({
    meta: [{ title: "LaunchHub — Detalhes do Produto" }],
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  console.log("PRODUCT DETAIL PAGE MOUNTED", { id });
  const { product, loading, error, refetch } = useProductDetail(id);
  const [isTransitionDialogOpen, setIsTransitionDialogOpen] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const handleTransitionComplete = () => {
    refetch();
    setHistoryRefreshKey((k) => k + 1);
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

  const healthColor =
    product.status_saude === "saudavel"
      ? "bg-green-500"
      : product.status_saude === "atencao"
      ? "bg-yellow-500"
      : "bg-red-500";

  const ownerInitials = product.owner_nome
    ? product.owner_nome.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : "??";

  const StageIcon = LIFECYCLE_ICONS[product.estagio_atual];

  return (
    <AppLayout>
      <TopBar title={product.nome} subtitle="Detalhes do produto" />
      <div className="flex-1 px-8 py-10 max-w-[1200px] mx-auto w-full">
        <Link to="/products" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-primary mb-8 font-bold uppercase tracking-wider transition-colors">
          <ChevronLeft className="h-3 w-3" /> Produtos
        </Link>

        <header className="mb-12">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-surface text-[10px] font-medium text-muted-foreground border border-border/50">
                {CATEGORY_LABELS[product.categoria]}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface text-[10px] font-medium text-foreground border border-border/50">
                <StageIcon className="w-3 h-3" />
                {LIFECYCLE_LABELS[product.estagio_atual]}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface text-[10px] font-medium text-muted-foreground border border-border/50">
                <div className={`h-2 w-2 rounded-full ${healthColor}`}></div>
                {product.score_saude}/100
              </span>
            </div>
            <button
              onClick={() => setIsTransitionDialogOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-foreground text-background hover:opacity-90 transition-opacity"
            >
              <ArrowRightLeft className="w-3 h-3" />
              Mudar estágio
            </button>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-slate-800 mb-4">{product.nome}</h2>
          <div 
            className="text-lg text-slate-500 max-w-2xl leading-relaxed prose prose-slate prose-sm"
            dangerouslySetInnerHTML={{ __html: product.descricao || "Sem descrição." }}
          />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <Meta icon={StageIcon} label="Estágio" value={LIFECYCLE_LABELS[product.estagio_atual]} />
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <Meta icon={Heart} label="Saúde" value={`${product.score_saude}/100`} />
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              <User className="h-3.5 w-3.5" />
              Responsável
            </div>
            {product.owner_nome ? (
              <div className="flex items-center gap-2">
                <Avatar initials={ownerInitials} />
                <p className="text-sm font-black text-slate-700">{product.owner_nome}</p>
              </div>
            ) : (
              <p className="text-sm font-black text-slate-400">Sem responsável</p>
            )}
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <Meta icon={Tag} label="Categoria" value={CATEGORY_LABELS[product.categoria]} />
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-slate-100/50 p-1 mb-10 h-12 w-fit">
            <TabsTrigger value="overview" className="px-6 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Visão Geral</TabsTrigger>
            <TabsTrigger value="roadmap" className="px-6 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Roadmap</TabsTrigger>
            <TabsTrigger value="tasks" className="px-6 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Tarefas</TabsTrigger>
            <TabsTrigger value="team" className="px-6 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Time</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <ProductSummary productId={product.id} />
            <LifecycleHistoryDisplay productId={product.id} key={historyRefreshKey} />
          </TabsContent>

          <TabsContent value="roadmap">
            <ProductRoadmap productId={product.id} />
          </TabsContent>

          <TabsContent value="tasks">
            <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-12 text-center">
              <p className="text-sm text-slate-400 font-medium">Tarefas do produto em construção — em breve aqui.</p>
            </div>
          </TabsContent>

          <TabsContent value="team">
            <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-12 text-center">
              <p className="text-sm text-slate-400 font-medium">Time do produto em construção — em breve aqui.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <LifecycleTransitionDialog
        open={isTransitionDialogOpen}
        onOpenChange={setIsTransitionDialogOpen}
        productId={product.id}
        estagioAtual={product.estagio_atual}
        onTransitionComplete={handleTransitionComplete}
      />
    </AppLayout>
  );
}

function Meta({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="text-sm font-black text-slate-700">{value}</p>
    </div>
  );
}