import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface Product {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: "saas" | "mobile" | "api" | "marketplace" | "servico" | "hardware" | "outros";
  estagio_atual: "descoberta" | "mvp" | "lancamento" | "tracao" | "escala" | "otimizacao" | "sunset";
  status_saude: "critico" | "atencao" | "saudavel";
  score_saude: number;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
  owner_nome?: string;
  owner_email?: string;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);

        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (productsError) throw productsError;

        console.log("[RAW useProducts]", productsData);

        const ownerIds = ((productsData ?? []) as Product[])
          .map((p: Product) => p.owner_id)
          .filter((id): id is string => Boolean(id));

        let profileMap = new Map<string, { nome: string; email: string }>();

        if (ownerIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, nome, email")
            .in("id", ownerIds);

          if (profilesError) throw profilesError;

          console.log("[RAW useProducts profiles]", profilesData);

          ((profilesData ?? []) as { id: string; nome: string; email: string }[]).forEach((p) => {
            profileMap.set(p.id, { nome: p.nome, email: p.email });
          });
        }

        const enriched: Product[] = ((productsData ?? []) as Product[]).map((p: Product) => {
          const owner = p.owner_id ? profileMap.get(p.owner_id) : undefined;
          return {
            ...p,
            owner_nome: owner?.nome,
            owner_email: owner?.email,
          };
        });

        setProducts(enriched);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao carregar produtos";
        console.error("[ERROR useProducts]", err);
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return { products, loading, error };
}