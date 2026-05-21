import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  newProductSchema,
  updateProductSchema,
  type NewProductInput,
  type UpdateProductInput,
  type ProductCategory,
  type ProductLifecycleStage,
  type ProductHealthStatus,
} from "@/lib/schemas/product-schema";
import { toast } from "sonner";

export interface Product {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: ProductCategory;
  estagio_atual: ProductLifecycleStage;
  status_saude: ProductHealthStatus;
  score_saude: number;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
  tipo?: string | null;
  codigo?: string | null;
  ativo?: boolean;
  versao?: string | null;
  subcategoria?: string | null;
  area_executora?: string | null;
  metadata?: Record<string, any> | null;
  owner_nome?: string;
  owner_email?: string;
}

type CreateProductInput = NewProductInput & {
  tipo?: string;
  codigo?: string;
  ativo?: boolean;
  versao?: string;
  subcategoria?: string;
  area_executora?: string;
  metadata?: Record<string, any>;
};

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;

      const ownerIds = ((productsData ?? []) as Product[])
        .map((p: Product) => p.owner_id)
        .filter((id): id is string => Boolean(id));

      const profileMap = new Map<string, { nome: string; email: string }>();

      if (ownerIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, nome, email")
          .in("id", ownerIds);

        if (profilesError) throw profilesError;

        ((profilesData ?? []) as { id: string; nome: string; email: string }[]).forEach((p) => {
          profileMap.set(p.id, { nome: p.nome, email: p.email });
        });
      }

      const enriched: Product[] = ((productsData ?? []) as Product[]).map((p: Product) => {
        const owner = p.owner_id ? profileMap.get(p.owner_id) : undefined;
        return { ...p, owner_nome: owner?.nome, owner_email: owner?.email };
      });

      setProducts(enriched);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar produtos";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (input: CreateProductInput) => {
    try {
      const { nome, descricao, categoria, estagio_atual, owner_id, ...extras } = input;
      const parsed = newProductSchema.parse({ nome, descricao, categoria, estagio_atual, owner_id });

      const { error } = await supabase
        .from("products")
        .insert({ ...parsed, ...extras })
        .select()
        .single();

      if (error) throw error;

      await fetchProducts();
    } catch (err) {
      toast.error("Erro ao criar produto", {
        description: err instanceof Error ? err.message : "Tente novamente",
      });
      throw err;
    }
  }, [fetchProducts]);

  const updateProduct = useCallback(async (id: string, input: UpdateProductInput) => {
    try {
      const parsed = updateProductSchema.parse(input);
      const { error } = await supabase
        .from("products")
        .update(parsed)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      await fetchProducts();
    } catch (err) {
      toast.error("Erro ao atualizar produto", {
        description: err instanceof Error ? err.message : "Tente novamente",
      });
      throw err;
    }
  }, [fetchProducts]);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      toast.success("Produto excluído");
      await fetchProducts();
    } catch (err) {
      toast.error("Erro ao excluir produto", {
        description: err instanceof Error ? err.message : "Você pode não ter permissão para esta ação",
      });
      throw err;
    }
  }, [fetchProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts, createProduct, updateProduct, deleteProduct };
}
