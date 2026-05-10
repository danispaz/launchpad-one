import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { LifecycleHistoryItem } from "@/lib/schemas/lifecycle-schema";

export function useLifecycleHistory(productId: string) {
  const [history, setHistory] = useState<LifecycleHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: historyData, error: historyError } = await supabase
        .from("product_lifecycle_history")
        .select("*")
        .eq("product_id", productId)
        .order("transicionado_em", { ascending: false });

      if (historyError) throw historyError;

      console.log("[RAW useLifecycleHistory]", historyData);

      const userIds = ((historyData ?? []) as LifecycleHistoryItem[])
        .map((h: LifecycleHistoryItem) => h.transicionado_por)
        .filter((id): id is string => Boolean(id));

      const profileMap = new Map<string, { nome: string; email: string }>();

      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, nome, email")
          .in("id", userIds);

        if (profilesError) throw profilesError;

        console.log("[RAW useLifecycleHistory profiles]", profilesData);

        ((profilesData ?? []) as { id: string; nome: string; email: string }[]).forEach((p) => {
          profileMap.set(p.id, { nome: p.nome, email: p.email });
        });
      }

      const enriched: LifecycleHistoryItem[] = ((historyData ?? []) as LifecycleHistoryItem[]).map((h: LifecycleHistoryItem) => {
        const user = h.transicionado_por ? profileMap.get(h.transicionado_por) : undefined;
        return {
          ...h,
          transicionado_por_nome: user?.nome,
          transicionado_por_email: user?.email,
        };
      });

      setHistory(enriched);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar histórico";
      console.error("[ERROR useLifecycleHistory]", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) {
      fetchHistory();
    }
  }, [productId, fetchHistory]);

  return { history, loading, error, refetch: fetchHistory };
}
