import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  type Briefing,
  type BriefingArea,
  BRIEFING_AREA_LABELS,
  updateBriefingAreaSchema,
  createEmptyBriefingPayload,
} from "@/lib/schemas/briefing-schema";

export function useBriefing(productId: string) {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBriefing = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from("launch_briefings")
        .select("*")
        .eq("product_id", productId)
        .maybeSingle();

      if (err) throw err;

      console.log("[RAW useBriefing]", data);
      setBriefing(data as Briefing | null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar briefing";
      console.error("[ERROR useBriefing]", err);
      setError(message);
      setBriefing(null);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const updateArea = useCallback(
    async (area: BriefingArea, conteudo: string) => {
      try {
        // Valida com Zod
        updateBriefingAreaSchema.parse({ area, conteudo });

        const newAreaContent = { conteudo };

        if (briefing) {
          // Briefing já existe: UPDATE só no campo da área alterada
          const { data, error: err } = await supabase
            .from("launch_briefings")
            .update({ [area]: newAreaContent })
            .eq("id", briefing.id)
            .select()
            .single();

          if (err) throw err;

          console.log("[RAW useBriefing updateArea]", data);
        } else {
          // Briefing ainda não existe: INSERT com payload vazio + área preenchida
          const payload = {
            ...createEmptyBriefingPayload(productId),
            [area]: newAreaContent,
          };

          const { data, error: err } = await supabase
            .from("launch_briefings")
            .insert(payload)
            .select()
            .single();

          if (err) throw err;

          console.log("[RAW useBriefing createBriefing]", data);
        }

        toast.success(`${BRIEFING_AREA_LABELS[area]} atualizado`);
        await fetchBriefing();
      } catch (err) {
        console.error("[ERROR useBriefing updateArea]", err);
        toast.error("Erro ao salvar briefing", {
          description: err instanceof Error ? err.message : "Tente novamente",
        });
        throw err;
      }
    },
    [briefing, productId, fetchBriefing]
  );

  useEffect(() => {
    if (productId) {
      fetchBriefing();
    }
  }, [productId, fetchBriefing]);

  return { briefing, loading, error, refetch: fetchBriefing, updateArea };
}