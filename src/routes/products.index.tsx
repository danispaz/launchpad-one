import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { Avatar } from "@/components/Badges";
import { useProducts, type Product } from "@/hooks/useProducts";
import {
  CATEGORY_LABELS,
  LIFECYCLE_LABELS,
  LIFECYCLE_ICONS,
} from "@/lib/schemas/product-schema";
import { Package, Pencil, Trash2 } from "lucide-react";
import { useState as useStateLocal } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { NewProductDialog } from "@/components/products/NewProductDialog";

export const Route = createFileRoute("/products/")({
  component: ProductsList,
});

function ProductsList() {
  const { products, loading, error, createProduct, deleteProduct } = useProducts();
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase.from("profiles").select("role").eq("id", data.user.id).single().then(({ data: p }) => {
        setUserRole(p?.role || null);
      });
    });
  }, []);

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
        <NewProductDialog open={isNewProductOpen} onOpenChange={setIsNewProductOpen} createProduct={createProduct} />
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
            <ProductCard key={p.id} product={p} canEdit={userRole === "executive" || userRole === "product"} onDelete={() => setProductToDelete(p.id)} />
          ))}
        </div>
      </div>
      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir este produto? Todos os lançamentos e dados relacionados serão removidos. Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (productToDelete) { await deleteProduct(productToDelete); setProductToDelete(null); } }} className="bg-rose-500 hover:bg-rose-600">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <NewProductDialog open={isNewProductOpen} onOpenChange={setIsNewProductOpen} createProduct={createProduct} />
    </AppLayout>
  );
}

function ProductCard({ product, canEdit, onDelete }: { product: Product; canEdit?: boolean; onDelete?: () => void }) {
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

  const StageIcon = LIFECYCLE_ICONS[product.estagio_atual];

  return (
    <div className="bg-white border border-border rounded-xl shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow group relative">
      {canEdit && (
        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="Editar">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete?.(); }} className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors" title="Excluir">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <Link to="/products/$id" params={{ id: product.id }} className="flex flex-col gap-4 flex-1">
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
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface text-[10px] font-medium text-foreground border border-border/50">
          <StageIcon className="w-3 h-3" />
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
      </Link>
    </div>
  );
}
