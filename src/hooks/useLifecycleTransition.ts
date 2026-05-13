import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { ProductLifecycleStage } from "@/lib/schemas/product-schema";

interface TransitionParams {
  productId: string;
  estagioAnterior: ProductLifecycleStage;
  estagioNovo: ProductLifecycleStage;
  motivo: string;
}

export function useLifecycleTransition() {
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const transition = async (params: TransitionParams) => {
    if (!user?.id) {
      throw new Error("Usuário não autenticado");
    }

    setSubmitting(true);
    try {
      console.log("[RAW useLifecycleTransition input]", params);

      // 1. INSERT no histórico
      const { data: insertedHistory, error: insertError } = await supabase
        .from("product_lifecycle_history")
        .insert({
          product_id: params.productId,
          estagio_anterior: params.estagioAnterior,
          estagio_novo: params.estagioNovo,
          motivo: params.motivo,
          transicionado_por: user.id,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("[ERROR useLifecycleTransition insert]", insertError);
        throw insertError;
      }

      console.log("[RAW useLifecycleTransition insertedHistory]", insertedHistory);

      // 2. UPDATE no produto
      const { error: updateError } = await supabase
        .from("products")
        .update({ estagio_atual: params.estagioNovo })
        .eq("id", params.productId);

      if (updateError) {
        console.error("[ERROR useLifecycleTransition update]", updateError);
        // Tenta reverter o INSERT pra não deixar inconsistência
        if (insertedHistory?.id) {
          await supabase
            .from("product_lifecycle_history")
            .delete()
            .eq("id", insertedHistory.id);
        }
        throw updateError;
      }

      console.log("[RAW useLifecycleTransition success]");
      return { success: true };
    } finally {
      setSubmitting(false);
    }
  };

  return { transition, submitting };
}
