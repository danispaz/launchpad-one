import { useState } from "react";
import { useContentPlan } from "@/hooks/useContentPlan";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonasPanel } from "./PersonasPanel";
import { JourneyPanel } from "./JourneyPanel";
import { IdeasPanel } from "./IdeasPanel";
import { PublicationsPanel } from "./PublicationsPanel";
import { CalendarPanel } from "./CalendarPanel";
import { Users, Map, Lightbulb, Send, Calendar } from "lucide-react";

interface ContentTabProps {
  productId: string;
}

export function ContentTab({ productId }: ContentTabProps) {
  const { 
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
    upsertPublication
  } = useContentPlan(productId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="personas" className="w-full">
        <TabsList className="bg-slate-100/50 p-1 mb-8 h-12 w-full flex overflow-x-auto overflow-y-hidden scrollbar-none">
          <TabsTrigger value="personas" className="flex items-center gap-2 px-4 text-xs font-bold uppercase tracking-widest">
            <Users className="w-3.5 h-3.5" />
            Personas
          </TabsTrigger>
          <TabsTrigger value="journey" className="flex items-center gap-2 px-4 text-xs font-bold uppercase tracking-widest">
            <Map className="w-3.5 h-3.5" />
            Jornada
          </TabsTrigger>
          <TabsTrigger value="ideas" className="flex items-center gap-2 px-4 text-xs font-bold uppercase tracking-widest">
            <Lightbulb className="w-3.5 h-3.5" />
            Ideias
          </TabsTrigger>
          <TabsTrigger value="publications" className="flex items-center gap-2 px-4 text-xs font-bold uppercase tracking-widest">
            <Send className="w-3.5 h-3.5" />
            Publicações
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2 px-4 text-xs font-bold uppercase tracking-widest">
            <Calendar className="w-3.5 h-3.5" />
            Calendário
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personas">
          <PersonasPanel 
            personas={personas} 
            onUpsert={upsertPersona} 
            onDelete={deletePersona} 
          />
        </TabsContent>
        <TabsContent value="journey">
          <JourneyPanel 
            personas={personas} 
            journeyStages={journeyStages} 
            onUpsert={upsertJourneyStage} 
          />
        </TabsContent>
        <TabsContent value="ideas">
          <IdeasPanel 
            personas={personas} 
            ideas={ideas} 
            onUpsert={upsertIdea} 
            onPromote={promoteIdea} 
          />
        </TabsContent>
        <TabsContent value="publications">
          <PublicationsPanel 
            publications={publications} 
            onUpsert={upsertPublication} 
          />
        </TabsContent>
        <TabsContent value="calendar">
          <CalendarPanel publications={publications} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
