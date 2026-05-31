import { z } from "zod";
import { 
  Users, 
  Map, 
  Lightbulb, 
  Send, 
  Calendar,
  BookOpen,
  FileText,
  Video,
  Share2,
  Mail,
  MoreHorizontal,
  Compass,
  Target,
  Search,
  CheckCircle2
} from "lucide-react";

export const CONTENT_FORMATS = [
  "blog",
  "ebook",
  "webinar",
  "video",
  "post_social",
  "email",
  "outros",
] as const;

export const JOURNEY_STAGES = [
  "aprendizado",
  "reconhecimento",
  "consideracao",
  "decisao",
] as const;

export const PUBLICATION_STATUS = [
  "ideia",
  "producao",
  "revisao",
  "publicado",
  "arquivado",
] as const;

export type ContentFormat = (typeof CONTENT_FORMATS)[number];
export type JourneyStage = (typeof JOURNEY_STAGES)[number];
export type PublicationStatus = (typeof PUBLICATION_STATUS)[number];

export const FORMAT_LABELS: Record<ContentFormat, string> = {
  blog: "Blog Post",
  ebook: "eBook",
  webinar: "Webinar",
  video: "Vídeo",
  post_social: "Rede Social",
  email: "E-mail",
  outros: "Outros",
};

export const FORMAT_ICONS: Record<ContentFormat, any> = {
  blog: FileText,
  ebook: BookOpen,
  webinar: Video,
  video: Video,
  post_social: Share2,
  email: Mail,
  outros: MoreHorizontal,
};

export const JOURNEY_LABELS: Record<JourneyStage, string> = {
  aprendizado: "Aprendizado",
  reconhecimento: "Reconhecimento",
  consideracao: "Consideração",
  decisao: "Decisão",
};

export const JOURNEY_DESCRIPTIONS: Record<JourneyStage, string> = {
  aprendizado: "O cliente ainda não sabe que tem um problema.",
  reconhecimento: "O cliente percebe que tem um problema e começa a pesquisar.",
  consideracao: "O cliente avalia as opções disponíveis para resolver o problema.",
  decisao: "O cliente decide qual solução comprar.",
};

export const JOURNEY_ICONS: Record<JourneyStage, any> = {
  aprendizado: Compass,
  reconhecimento: Search,
  consideracao: Target,
  decisao: CheckCircle2,
};

export const STATUS_LABELS: Record<PublicationStatus, string> = {
  ideia: "Ideia",
  producao: "Em Produção",
  revisao: "Em Revisão",
  publicado: "Publicado",
  arquivado: "Arquivado",
};

export const personaSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  descricao: z.string().optional(),
  dores: z.string().optional(),
  objetivos: z.string().optional(),
  canais: z.array(z.string()).default([]),
});

export const journeyStageSchema = z.object({
  persona_id: z.string().uuid(),
  estagio: z.enum(JOURNEY_STAGES),
  necessidades: z.string().optional(),
});

export const contentIdeaSchema = z.object({
  titulo: z.string().min(3, "Título é obrigatório"),
  persona_id: z.string().uuid().optional().nullable(),
  formato: z.enum(CONTENT_FORMATS),
  etapa_jornada: z.enum(JOURNEY_STAGES),
  descricao: z.string().optional(),
});

export const publicationSchema = z.object({
  titulo: z.string().min(3, "Título é obrigatório"),
  idea_id: z.string().uuid().optional().nullable(),
  responsavel_id: z.string().uuid().optional().nullable(),
  formato: z.enum(CONTENT_FORMATS),
  status: z.enum(PUBLICATION_STATUS).default("ideia"),
  canal: z.string().optional(),
  data_publicacao: z.string().optional().nullable(),
  url: z.string().url("URL inválida").optional().or(z.literal("")),
  notas: z.string().optional(),
});

export type PersonaInput = z.infer<typeof personaSchema>;
export type JourneyStageInput = z.infer<typeof journeyStageSchema>;
export type ContentIdeaInput = z.infer<typeof contentIdeaSchema>;
export type PublicationInput = z.infer<typeof publicationSchema>;
