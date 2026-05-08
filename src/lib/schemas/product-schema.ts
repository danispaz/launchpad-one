import { z } from "zod";

export const PRODUCT_CATEGORIES = [
  "saas",
  "mobile",
  "api",
  "marketplace",
  "servico",
  "hardware",
  "outros",
] as const;

export const PRODUCT_LIFECYCLE_STAGES = [
  "descoberta",
  "mvp",
  "lancamento",
  "tracao",
  "escala",
  "otimizacao",
  "sunset",
] as const;

export const PRODUCT_HEALTH_STATUS = [
  "critico",
  "atencao",
  "saudavel",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type ProductLifecycleStage = (typeof PRODUCT_LIFECYCLE_STAGES)[number];
export type ProductHealthStatus = (typeof PRODUCT_HEALTH_STATUS)[number];

export const newProductSchema = z.object({
  nome: z
    .string()
    .min(3, "Nome precisa ter pelo menos 3 caracteres")
    .max(100, "Nome muito longo (máximo 100 caracteres)")
    .trim(),

  descricao: z
    .string()
    .max(500, "Descrição muito longa (máximo 500 caracteres)")
    .optional()
    .or(z.literal("")),

  categoria: z.enum(PRODUCT_CATEGORIES, {
    errorMap: () => ({ message: "Selecione uma categoria válida" }),
  }),

  estagio_atual: z
    .enum(PRODUCT_LIFECYCLE_STAGES)
    .default("descoberta"),

  owner_id: z
    .string()
    .uuid("Selecione um responsável válido"),
});

export type NewProductInput = z.infer<typeof newProductSchema>;

export const updateProductSchema = newProductSchema.partial();
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  saas: "SaaS / Plataforma",
  mobile: "App Mobile",
  api: "API / Integração",
  marketplace: "Marketplace",
  servico: "Serviço / Consultoria",
  hardware: "Hardware / Físico",
  outros: "Outros",
};

export const LIFECYCLE_LABELS: Record<ProductLifecycleStage, string> = {
  descoberta: "🔍 Descoberta",
  mvp: "🧪 MVP",
  lancamento: "🚀 Lançamento",
  tracao: "📈 Tração",
  escala: "🌱 Escala",
  otimizacao: "⚙️ Otimização",
  sunset: "🌅 Sunset",
};

export const HEALTH_STATUS_LABELS: Record<ProductHealthStatus, string> = {
  critico: "🔴 Crítico",
  atencao: "🟡 Atenção",
  saudavel: "🟢 Saudável",
};

export function getHealthColor(score: number): ProductHealthStatus {
  if (score < 50) return "critico";
  if (score < 80) return "atencao";
  return "saudavel";
}