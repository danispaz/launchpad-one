import { useState, useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { useProducts, type Product } from "@/hooks/useProducts";
import { CATEGORY_LABELS, LIFECYCLE_LABELS, LIFECYCLE_ICONS } from "@/lib/schemas/product-schema";
import { Package, Pencil, Trash2, Search, SlidersHorizontal, Check, ChevronRight } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";
import { NewProductSheet } from "@/components/products/NewProductSheet";
import { EditProductSheet } from "@/components/products/EditProductSheet";

export const Route = createFileRoute("/products/")({
  component: ProductsList,
});

const ALL_COLUMNS = [
  { key: "nome", label: "Nome", always: true },
  { key: "ativo", label: "Ativo" },
  { key: "tipo", label: "Tipo" },
  { key: "categoria", label: "Categoria" },
  { key: "subcategoria", label: "Subcategoria" },
  { key: "estagio_atual", label: "Estágio" },
  { key: "codigo", label: "Código" },
  { key: "versao", label: "Versão" },
  { key: "area_executora", label: "Área executora" },
  { key: "owner_nome", label: "Responsável" },
  { key: "score_saude", label: "Saúde" },
];

const DEFAULT_VISIBLE = ["nome", "ativo", "tipo", "categoria", "codigo", "owner_nome"];

function ProductsList() {
  const { products, loading, error, createProduct, updateProduct, deleteProduct } = useProducts();
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterAtivo, setFilterAtivo] = useState<"all" | "ativo" | "inativo">("all");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [visibleCols, setVisibleCols] = useState<string[]>(DEFAULT_VISIBLE);
  const [showColConfig, setShowColConfig] = useState(false);
  const colConfigRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase.from("profiles").select("role").eq("id", data.user.id).single().then(({ data: p }) => {
        setUserRole(p?.role || null);
      });
    });
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (colConfigRef.current && !colConfigRef.current.contains(e.target as Node)) {
        setShowColConfig(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const canEdit = userRole === "executive" || userRole === "product";

  const tiposDisponiveis = [...new Set(products.map(p => (p as any).tipo).filter(Boolean))];
  const categoriasDisponiveis = [...new Set(products.map(p => p.categoria).filter(Boolean))];

  const filtered = products.filter(p => {
    if (search && !p.nome.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterAtivo === "ativo" && (p as any).ativo === false) return false;
    if (filterAtivo === "inativo" && (p as any).ativo !== false) return false;
    if (filterTipo && (p as any).tipo !== filterTipo) return false;
    if (filterCategoria && p.categoria !== filterCategoria) return false;
    return true;
  });

  const toggleCol = (key: string) => {
    setVisibleCols(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
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
        <div className="flex-1 px-8 py-10">
          <div className="bg-white border border-destructive/20 rounded-xl p-8 text-center">
            <p className="text-sm text-destructive font-medium">Erro ao carregar produtos</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <TopBar
        title="Produtos"
        subtitle="Catálogo da empresa"
        actions={
          <button onClick={() => setIsNewProductOpen(true)} className="h-8 px-3 rounded bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity">
            + Novo Produto
          </button>
        }
      />

      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-white shrink-0 flex-wrap">
          {/* Pesquisa */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar..."
              className="pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-400 focus:bg-white transition-all w-52 placeholder:text-slate-400" />
          </div>

          {/* Filtro Ativo */}
          <div className="flex items-center gap-1">
            {[{ key: "all", label: "Todos" }, { key: "ativo", label: "Ativo" }, { key: "inativo", label: "Inativo" }].map(f => (
              <button key={f.key} onClick={() => setFilterAtivo(f.key as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterAtivo === f.key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Filtro Tipo */}
          {tiposDisponiveis.length > 0 && (
            <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white outline-none text-slate-600">
              <option value="">Tipo (todos)</option>
              {tiposDisponiveis.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}

          {/* Filtro Categoria */}
          {categoriasDisponiveis.length > 0 && (
            <select value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white outline-none text-slate-600">
              <option value="">Categoria (todas)</option>
              {categoriasDisponiveis.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c as any] || c}</option>)}
            </select>
          )}

          <span className="text-xs text-slate-400 ml-auto">{filtered.length} produto{filtered.length !== 1 ? "s" : ""}</span>

          {/* Config de colunas */}
          <div className="relative" ref={colConfigRef}>
            <button onClick={() => setShowColConfig(!showColConfig)}
              className={`p-1.5 rounded-lg border transition-colors ${showColConfig ? "bg-slate-100 border-slate-300" : "border-slate-200 hover:bg-slate-50"}`}
              title="Configurar colunas">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            </button>
            {showColConfig && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 p-3 min-w-[180px] z-20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Colunas visíveis</p>
                {ALL_COLUMNS.map(col => (
                  <button key={col.key} onClick={() => !col.always && toggleCol(col.key)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${col.always ? "opacity-50 cursor-default" : "hover:bg-slate-50"}`}>
                    <span className="text-slate-700">{col.label}</span>
                    {(col.always || visibleCols.includes(col.key)) && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabela */}
        <div className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[40vh] gap-4">
              <Package className="h-10 w-10 text-slate-200" />
              <p className="text-sm text-slate-400">Nenhum produto encontrado</p>
              <button onClick={() => setIsNewProductOpen(true)} className="h-8 px-4 rounded bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity">
                + Criar produto
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white border-b border-slate-200 z-10">
                <tr>
                  <th className="text-left px-6 py-3 w-8"><input type="checkbox" className="rounded" /></th>
                  {ALL_COLUMNS.filter(c => c.always || visibleCols.includes(c.key)).map(col => (
                    <th key={col.key} className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(p => {
                  const StageIcon = LIFECYCLE_ICONS[p.estagio_atual];
                  const isAtivo = (p as any).ativo !== false;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-3"><input type="checkbox" className="rounded" /></td>

                      {visibleCols.includes("nome") || true ? (
                        <td className="px-4 py-3">
                          <Link to="/products/$id" params={{ id: p.id }} className="font-semibold text-slate-800 hover:text-slate-900 transition-colors">
                            {p.nome}
                          </Link>
                        </td>
                      ) : null}

                      {visibleCols.includes("ativo") && (
                        <td className="px-4 py-3">
                          {isAtivo
                            ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600"><Check className="w-3 h-3" /> Ativo</span>
                            : <span className="text-[11px] text-slate-400">Inativo</span>}
                        </td>
                      )}

                      {visibleCols.includes("tipo") && (
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-600">{(p as any).tipo || "—"}</span>
                        </td>
                      )}

                      {visibleCols.includes("categoria") && (
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-600">{CATEGORY_LABELS[p.categoria] || p.categoria}</span>
                        </td>
                      )}

                      {visibleCols.includes("subcategoria") && (
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-500">{(p as any).subcategoria || "—"}</span>
                        </td>
                      )}

                      {visibleCols.includes("estagio_atual") && (
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                            <StageIcon className="w-3 h-3" />{LIFECYCLE_LABELS[p.estagio_atual]}
                          </span>
                        </td>
                      )}

                      {visibleCols.includes("codigo") && (
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-slate-500">{(p as any).codigo || "—"}</span>
                        </td>
                      )}

                      {visibleCols.includes("versao") && (
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-500">{(p as any).versao || "—"}</span>
                        </td>
                      )}

                      {visibleCols.includes("area_executora") && (
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-500">{(p as any).area_executora || "—"}</span>
                        </td>
                      )}

                      {visibleCols.includes("owner_nome") && (
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-600">{p.owner_nome || "—"}</span>
                        </td>
                      )}

                      {visibleCols.includes("score_saude") && (
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold ${p.score_saude >= 80 ? "text-emerald-600" : p.score_saude >= 50 ? "text-amber-500" : "text-rose-500"}`}>
                            {p.score_saude}/100
                          </span>
                        </td>
                      )}

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canEdit && (
                            <>
                              <button onClick={() => setProductToEdit(p)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setProductToDelete(p.id)} className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <Link to="/products/$id" params={{ id: p.id }} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (productToDelete) { await deleteProduct(productToDelete); setProductToDelete(null); } }} className="bg-rose-500 hover:bg-rose-600">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditProductSheet open={!!productToEdit} onOpenChange={(open) => !open && setProductToEdit(null)} product={productToEdit} updateProduct={updateProduct} />
      <NewProductSheet open={isNewProductOpen} onOpenChange={setIsNewProductOpen} createProduct={createProduct} />
    </AppLayout>
  );
}
