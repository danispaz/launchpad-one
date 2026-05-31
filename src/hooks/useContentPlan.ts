import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { 
  PersonaInput, 
  JourneyStageInput, 
  ContentIdeaInput, 
  PublicationInput,
  JourneyStage
} from "@/lib/schemas/content-schema";

export function useContentPlan(productId: string) {
  const [personas, setPersonas] = useState<any[]>([]);
  const [journeyStages, setJourneyStages] = useState<any[]>([]);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [publications, setPublications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: personasData },
        { data: journeyData },
        { data: ideasData },
        { data: pubsData }
      ] = await Promise.all([
        supabase.from("content_personas").select("*").eq("product_id", productId).order("nome"),
        supabase.from("content_journey_stages").select("*").eq("product_id", productId),
        supabase.from("content_ideas").select("*").eq("product_id", productId).order("created_at", { ascending: false }),
        supabase.from("content_publications").select("*").eq("product_id", productId).order("data_publicacao", { ascending: true })
      ]);

      setPersonas(personasData || []);
      setJourneyStages(journeyData || []);
      setIdeas(ideasData || []);
      setPublications(pubsData || []);
    } catch (error) {
      console.error("Error fetching content plan:", error);
      toast.error("Erro ao carregar plano de conteúdo");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Personas CRUD
  const upsertPersona = async (data: PersonaInput & { id?: string }) => {
    try {
      const { error } = await supabase
        .from("content_personas")
        .upsert({ ...data, product_id: productId });
      if (error) throw error;
      toast.success(data.id ? "Persona atualizada" : "Persona criada");
      fetchData();
    } catch (error) {
      toast.error("Erro ao salvar persona");
    }
  };

  const deletePersona = async (id: string) => {
    try {
      const { error } = await supabase.from("content_personas").delete().eq("id", id);
      if (error) throw error;
      toast.success("Persona excluída");
      fetchData();
    } catch (error) {
      toast.error("Erro ao excluir persona");
    }
  };

  // Journey CRUD
  const upsertJourneyStage = async (data: JourneyStageInput) => {
    try {
      const { error } = await supabase
        .from("content_journey_stages")
        .upsert({ ...data, product_id: productId }, { onConflict: 'persona_id,estagio' });
      if (error) throw error;
      fetchData();
    } catch (error) {
      toast.error("Erro ao salvar estágio da jornada");
    }
  };

  // Ideas CRUD
  const upsertIdea = async (data: ContentIdeaInput & { id?: string }) => {
    try {
      const { error } = await supabase
        .from("content_ideas")
        .upsert({ ...data, product_id: productId });
      if (error) throw error;
      toast.success(data.id ? "Ideia atualizada" : "Ideia criada");
      fetchData();
    } catch (error) {
      toast.error("Erro ao salvar ideia");
    }
  };

  const promoteIdea = async (idea: any) => {
    try {
      const { error: pubError } = await supabase.from("content_publications").insert({
        product_id: productId,
        idea_id: idea.id,
        titulo: idea.titulo,
        formato: idea.formato,
        status: 'producao',
        notas: idea.descricao
      });
      if (pubError) throw pubError;

      const { error: ideaError } = await supabase
        .from("content_ideas")
        .update({ promovida: true })
        .eq("id", idea.id);
      if (ideaError) throw ideaError;

      toast.success("Ideia promovida para publicação");
      fetchData();
    } catch (error) {
      toast.error("Erro ao promover ideia");
    }
  };

  // Publications CRUD
  const upsertPublication = async (data: PublicationInput & { id?: string }) => {
    try {
      const { error } = await supabase
        .from("content_publications")
        .upsert({ ...data, product_id: productId });
      if (error) throw error;
      toast.success(data.id ? "Publicação atualizada" : "Publicação agendada");
      fetchData();
    } catch (error) {
      toast.error("Erro ao salvar publicação");
    }
  };

  return {
    personas,
    journeyStages,
    ideas,
    publications,
    loading,
    upsertPersona,
    deletePersona,
    upsertJourneyStage,
    upsertIdea,
    promoteIdea,
    upsertPublication,
    refresh: fetchData
  };
}
