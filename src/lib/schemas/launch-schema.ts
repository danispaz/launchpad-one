import { z } from "zod";

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
    produto: z
      .string()
      .min(2, "O produto deve ter pelo menos 2 caracteres")
      .max(100, "O produto deve ter no máximo 100 caracteres"),
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
