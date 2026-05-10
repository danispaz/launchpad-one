import { z } from "zod";
import { PRODUCT_LIFECYCLE_STAGES, type ProductLifecycleStage } from "./product-schema";

export const lifecycleTransitionSchema = z
  .object({
    product_id: z.string().uuid("ID de produto inválido"),
    estagio_anterior: z.enum(PRODUCT_LIFECYCLE_STAGES, {
      errorMap: () => ({ message: "Estágio anterior inválido" }),
    }),
    estagio_novo: z.enum(PRODUCT_LIFECYCLE_STAGES, {
      errorMap: () => ({ message: "Estágio novo inválido" }),
    }),
    motivo: z
      .string()
      .min(10, "Descreva o motivo da transição (mínimo 10 caracteres)")
      .max(2000, "Motivo muito longo (máximo 2000 caracteres)"),
  })
  .refine((data) => data.estagio_anterior !== data.estagio_novo, {
    message: "O novo estágio precisa ser diferente do estágio atual",
    path: ["estagio_novo"],
  });

export type LifecycleTransitionInput = z.infer<typeof lifecycleTransitionSchema>;

export interface LifecycleHistoryItem {
  id: string;
  product_id: string;
  estagio_anterior: ProductLifecycleStage;
  estagio_novo: ProductLifecycleStage;
  motivo: string | null;
  transicionado_em: string;
  transicionado_por: string;
  transicionado_por_nome?: string;
  transicionado_por_email?: string;
}
