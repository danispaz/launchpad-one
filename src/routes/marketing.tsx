import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/marketing")({
  head: () => ({ meta: [{ title: "Marketing — LaunchHub" }] }),
  component: MarketingPage,
});

function MarketingPage() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <TopBar title="Marketing" />
      <div className="flex-1 overflow-hidden p-6">
        <Tabs defaultValue="conteudo" className="h-full flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
            <TabsTrigger value="campanhas">Campanhas</TabsTrigger>
            <TabsTrigger value="influenciadores">Influenciadores</TabsTrigger>
          </TabsList>
          
          <TabsContent value="conteudo" className="flex-1 overflow-hidden">
             {/* Conteúdo virá aqui */}
             <div className="flex items-center justify-center h-full text-slate-400">Conteúdo</div>
          </TabsContent>
          
          <TabsContent value="campanhas" className="flex-1 overflow-hidden">
             <div className="flex items-center justify-center h-full text-slate-400">Em breve</div>
          </TabsContent>
          
          <TabsContent value="influenciadores" className="flex-1 overflow-hidden">
             <div className="flex items-center justify-center h-full text-slate-400">Em breve</div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
