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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <TabsList className="bg-slate-100/50 p-1 h-11 w-full sm:w-auto flex overflow-x-auto overflow-y-hidden scrollbar-none rounded-xl">
            <TabsTrigger value="personas" className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 h-9 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">
              <Users className="w-4 h-4" />
              Personas
            </TabsTrigger>
            <TabsTrigger value="journey" className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 h-9 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">
              <Map className="w-4 h-4" />
              Jornada
            </TabsTrigger>
            <TabsTrigger value="ideas" className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 h-9 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">
              <Lightbulb className="w-4 h-4" />
              Ideias
            </TabsTrigger>
            <TabsTrigger value="publications" className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 h-9 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">
              <Send className="w-4 h-4" />
              Publicações
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 h-9 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">
              <Calendar className="w-4 h-4" />
              Calendário
            </TabsTrigger>
          </TabsList>
        </div>

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
