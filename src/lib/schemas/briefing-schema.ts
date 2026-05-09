import { z } from "zod";
import { Megaphone, Briefcase, Cog, Scale, Code, Building } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// =========================
// Áreas do briefing
// =========================

export const BRIEFING_AREAS = [
  "marketing",
  "vendas",
  "operacao",
  "juridico",
  "tecnologia",
  "diretoria",
] as const;

export type BriefingArea = (typeof BRIEFING_AREAS)[number];

export const BRIEFING_AREA_LABELS: Record<BriefingArea, string> = {
  marketing: "Marketing",
  vendas: "Vendas",
  operacao: "Operação",
  juridico: "Jurídico",
  tecnologia: "Tecnologia",
  diretoria: "Diretoria",
};

export const BRIEFING_AREA_ICONS: Record<BriefingArea, LucideIcon> = {
  marketing: Megaphone,
  vendas: Briefcase,
  operacao: Cog,
  juridico: Scale,
  tecnologia: Code,
  diretoria: Building,
};

// =========================
// Schema do conteúdo de cada área
// =========================
// Cada área é um JSONB no banco. Por enquanto tem apenas o campo "conteudo"
// (texto livre multilinha). Usa .passthrough() pra permitir adicionar campos
// extras no futuro (ex: objetivo, persona, canais) sem refatorar o schema.

export const briefingAreaContentSchema = z
  .object({
    conteudo: z.string().max(10000, "Texto muito longo (máximo 10000 caracteres)").optional(),
  })
  .passthrough();

export type BriefingAreaContent = z.infer<typeof briefingAreaContentSchema>;

// =========================
// Briefing completo (entidade do banco)
// =========================

export const briefingSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  marketing: briefingAreaContentSchema,
  vendas: briefingAreaContentSchema,
  operacao: briefingAreaContentSchema,
  juridico: briefingAreaContentSchema,
  tecnologia: briefingAreaContentSchema,
  diretoria: briefingAreaContentSchema,
  created_at: z.string(),
  updated_at: z.string(),
  updated_by: z.string().uuid().nullable(),
});

export type Briefing = z.infer<typeof briefingSchema>;

// =========================
// Schema de update por área (fluxo natural: edita 1 área de cada vez)
// =========================

export const updateBriefingAreaSchema = z.object({
  area: z.enum(BRIEFING_AREAS),
  conteudo: z.string().max(10000, "Texto muito longo (máximo 10000 caracteres)").optional(),
});

export type UpdateBriefingAreaInput = z.infer<typeof updateBriefingAreaSchema>;

// =========================
// Helper: gerar briefing vazio para um produto (útil ao criar produto novo)
// =========================

export function createEmptyBriefingPayload(productId: string) {
  return {
    product_id: productId,
    marketing: {},
    vendas: {},
    operacao: {},
    juridico: {},
    tecnologia: {},
    diretoria: {},
  };
}
