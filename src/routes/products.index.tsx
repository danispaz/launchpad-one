import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { Avatar } from "@/components/Badges";
import { useProducts, type Product } from "@/hooks/useProducts";
import {
  CATEGORY_LABELS,
  LIFECYCLE_LABELS,
} from "@/lib/schemas/product-schema";
import { Package } from "lucide-react";
import { NewProductDialog } from "@/components/products/NewProductDialog";

export const Route = createFileRoute("/products/")({
  component: ProductsList,
});

function ProductsList() {
  const { products, loading, error } = useProducts();
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);

  const handleNewProduct = () => {
    setIsNewProductOpen(true);
  };

  if (loading) {
    return (
      <AppLayout>
        <TopBar title="Produtos" subtitle="Catálogo da empresa" />
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <TopBar title="Produtos" subtitle="Catálogo da empresa" />
        <div className="flex-1 px-8 py-10 max-w-[1200px] mx-auto w-full">
          <div className="bg-white border border-destructive/20 rounded-xl p-8 text-center">
            <p className="text-sm text-destructive font-medium mb-2">Erro ao carregar produtos</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (products.length === 0) {
    return (
      <AppLayout>
        <TopBar
          title="Produtos"
          subtitle="Catálogo da empresa"
          actions={
            <button
              onClick={handleNewProduct}
              className="h-8 px-3 rounded bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
            >
              + Novo Produto
            </button>
          }
        />
        <div className="flex-1 px-8 py-10 max-w-[1200px] mx-auto w-full">
          <div className="bg-white border border-border rounded-xl shadow-sm p-16 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-surface flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              Nenhum produto cadastrado ainda
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Crie seu primeiro produto pra começar a organizar lançamentos, briefings e métricas.
            </p>
            <button
              onClick={handleNewProduct}
              className="h-9 px-4 rounded bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              + Criar primeiro produto
            </button>
          </div>
        </div>
        <NewProductDialog open={isNewProductOpen} onOpenChange={setIsNewProductOpen} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <TopBar
        title="Produtos"
        subtitle="Catálogo da empresa"
        actions={
          <button
            onClick={handleNewProduct}
            className="h-8 px-3 rounded bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
          >
            + Novo Produto
          </button>
        }
      />
      <div className="flex-1 px-8 py-10 max-w-[1200px] mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
      <NewProductDialog open={isNewProductOpen} onOpenChange={setIsNewProductOpen} />
    </AppLayout>
  );
}

function ProductCard({ product }: { product: Product }) {
  const healthColor =
    product.status_saude === "saudavel"
      ? "bg-green-500"
      : product.status_saude === "atencao"
      ? "bg-yellow-500"
      : "bg-red-500";

  const ownerInitials = product.owner_nome
    ? product.owner_nome
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "??";

  return (
    <div className="bg-white border border-border rounded-xl shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div>
        <h3 className="text-base font-semibold text-foreground mb-1">{product.nome}</h3>
        {product.descricao && (
          <p className="text-xs text-muted-foreground line-clamp-2">{product.descricao}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center px-2 py-1 rounded-md bg-surface text-[10px] font-medium text-muted-foreground border border-border/50">
          {CATEGORY_LABELS[product.categoria]}
        </span>
        <span className="inline-flex items-center px-2 py-1 rounded-md bg-surface text-[10px] font-medium text-foreground border border-border/50">
          {LIFECYCLE_LABELS[product.estagio_atual]}
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border/40">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${healthColor}`}></div>
          <span className="text-xs font-medium text-muted-foreground">
            {product.score_saude}/100
          </span>
        </div>
        {product.owner_nome && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">{product.owner_nome}</span>
            <Avatar initials={ownerInitials} />
          </div>
        )}
      </div>
    </div>
  );
}
