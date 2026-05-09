import { z } from "zod";
import { FlaskConical, Rocket, Sparkles, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// =========================
// Tipos de lançamento
// =========================

export const LAUNCH_TYPES = ["mvp", "release", "feature", "revamp"] as const;

export type LaunchType = (typeof LAUNCH_TYPES)[number];

export const LAUNCH_TYPE_LABELS: Record<LaunchType, string> = {
  mvp: "MVP",
  release: "Release",
  feature: "Feature",
  revamp: "Revamp",
};

export const LAUNCH_TYPE_ICONS: Record<LaunchType, LucideIcon> = {
  mvp: FlaskConical,
  release: Rocket,
  feature: Sparkles,
  revamp: RefreshCw,
};

// =========================
// Schema de novo lançamento
// =========================

export const newLaunchSchema = z
  .object({
    nome: z
      .string()
      .min(3, "O nome deve ter pelo menos 3 caracteres")
      .max(100, "O nome deve ter no máximo 100 caracteres"),
    descricao: z
      .string()
      .max(500, "A descrição deve ter no máximo 500 caracteres")
      .optional()
      .or(z.literal("")),
    // produto (texto livre) — DEPRECATED, mantido temporariamente
    // Será removido na Sprint 7 quando product_id estiver consolidado
    produto: z
      .string()
      .max(100, "O produto deve ter no máximo 100 caracteres")
      .optional()
      .or(z.literal("")),
    product_id: z
      .string()
      .uuid("Selecione um produto válido"),
    tipo: z
      .enum(LAUNCH_TYPES, {
        errorMap: () => ({ message: "Tipo de lançamento inválido" }),
      })
      ,
    data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de início inválida (formato YYYY-MM-DD)"),
    data_lancamento_prevista: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de lançamento prevista inválida (formato YYYY-MM-DD)"),
    prioridade: z.enum(["baixa", "média", "alta", "crítica"], {
      errorMap: () => ({ message: "Prioridade inválida" }),
    }),
    owner_id: z.string().uuid("ID do proprietário inválido (deve ser um UUID)"),
  })
  .refine(
    (data) => {
      const inicio = new Date(data.data_inicio);
      const lancamento = new Date(data.data_lancamento_prevista);
      return lancamento >= inicio;
    },
    {
      message: "A data de lançamento prevista deve ser igual ou posterior à data de início",
      path: ["data_lancamento_prevista"],
    }
  );

export type NewLaunchInput = z.infer<typeof newLaunchSchema>;