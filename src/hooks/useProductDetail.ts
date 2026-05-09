import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/hooks/useProducts";

export function useProductDetail(id: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (productError) throw productError;

      if (!productData) {
        setProduct(null);
        return;
      }

      console.log("[RAW useProductDetail]", productData);

      let ownerNome: string | undefined;
      let ownerEmail: string | undefined;

      if (productData.owner_id) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("nome, email")
          .eq("id", productData.owner_id)
          .maybeSingle();

        if (profileError) {
          console.warn("[WARN useProductDetail profile]", profileError);
        } else if (profileData) {
          console.log("[RAW useProductDetail profile]", profileData);
          ownerNome = profileData.nome;
          ownerEmail = profileData.email;
        }
      }

      setProduct({
        ...productData,
        owner_nome: ownerNome,
        owner_email: ownerEmail,
      } as Product);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar produto";
      console.error("[ERROR useProductDetail]", err);
      setError(message);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id, fetchProduct]);

  return { product, loading, error, refetch: fetchProduct };
}