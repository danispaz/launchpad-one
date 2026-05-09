import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { Avatar } from "@/components/Badges";
import { useProductDetail } from "@/hooks/useProductDetail";
import {
  CATEGORY_LABELS,
  LIFECYCLE_LABELS,
} from "@/lib/schemas/product-schema";
import { ChevronLeft, Package, Activity, Heart, User, Tag } from "lucide-react";

export const Route = createFileRoute("/products/$id")({
  head: () => ({
    meta: [{ title: "LaunchHub — Detalhes do Produto" }],
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  console.log("PRODUCT DETAIL PAGE MOUNTED", { id });
  const { product, loading, error } = useProductDetail(id);

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

  return (
    <AppLayout>
      <TopBar title={product.nome} subtitle="Detalhes do produto" />
      <div className="flex-1 px-8 py-10 max-w-[1200px] mx-auto w-full">
        <Link to="/products" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-primary mb-8 font-bold uppercase tracking-wider transition-colors">
          <ChevronLeft className="h-3 w-3" /> Produtos
        </Link>

        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-surface text-[10px] font-medium text-muted-foreground border border-border/50">
              {CATEGORY_LABELS[product.categoria]}
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-surface text-[10px] font-medium text-foreground border border-border/50">
              {LIFECYCLE_LABELS[product.estagio_atual]}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface text-[10px] font-medium text-muted-foreground border border-border/50">
              <div className={`h-2 w-2 rounded-full ${healthColor}`}></div>
              {product.score_saude}/100
            </span>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-slate-800 mb-4">{product.nome}</h2>
          <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">{product.descricao || "Sem descrição."}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <Meta icon={Activity} label="Estágio" value={LIFECYCLE_LABELS[product.estagio_atual]} />
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

        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center">
          <div className="h-12 w-12 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-2">Mais detalhes em breve</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Briefing estratégico, lançamentos relacionados, métricas e histórico do ciclo de vida serão construídos nas próximas fases.
          </p>
        </div>
      </div>
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
}