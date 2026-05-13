import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { LaunchType } from "@/lib/schemas/launch-schema";

export interface LaunchByProduct {
  id: string;
  nome: string;
  descricao: string | null;
  produto: string | null;
  product_id: string | null;
  tipo: LaunchType;
  data_inicio: string;
  data_lancamento_prevista: string;
  status: string;
  prioridade: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  owner_nome?: string;
  owner_email?: string;
}

export function useLaunchesByProduct(productId: string) {
  const [launches, setLaunches] = useState<LaunchByProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLaunches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: launchesData, error: launchesError } = await supabase
        .from("launches")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (launchesError) throw launchesError;

      console.log("[RAW useLaunchesByProduct]", launchesData);

      const ownerIds = ((launchesData ?? []) as LaunchByProduct[])
        .map((l: LaunchByProduct) => l.owner_id)
        .filter((id): id is string => Boolean(id));

      const profileMap = new Map<string, { nome: string; email: string }>();

      if (ownerIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, nome, email")
          .in("id", ownerIds);

        if (profilesError) throw profilesError;

        console.log("[RAW useLaunchesByProduct profiles]", profilesData);

        ((profilesData ?? []) as { id: string; nome: string; email: string }[]).forEach((p) => {
          profileMap.set(p.id, { nome: p.nome, email: p.email });
        });
      }

      const enriched: LaunchByProduct[] = ((launchesData ?? []) as LaunchByProduct[]).map((l: LaunchByProduct) => {
        const owner = l.owner_id ? profileMap.get(l.owner_id) : undefined;
        return {
          ...l,
          owner_nome: owner?.nome,
          owner_email: owner?.email,
        };
      });

      setLaunches(enriched);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar lançamentos";
      console.error("[ERROR useLaunchesByProduct]", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) {
      fetchLaunches();
    }
  }, [productId, fetchLaunches]);

  return { launches, loading, error, refetch: fetchLaunches };
}