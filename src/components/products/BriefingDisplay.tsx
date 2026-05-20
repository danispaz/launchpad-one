import { useState } from "react";
import { useBriefing } from "@/hooks/useBriefing";
import {
  BRIEFING_AREAS,
  BRIEFING_AREA_LABELS,
  BRIEFING_AREA_ICONS,
  type BriefingArea,
  type BriefingAreaContent,
} from "@/lib/schemas/briefing-schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil } from "lucide-react";
import { BriefingEditSheet } from "./BriefingEditSheet";

interface BriefingDisplayProps {
  productId: string;
}

export function BriefingDisplay({ productId }: BriefingDisplayProps) {
  const { briefing, loading, error, updateArea } = useBriefing(productId);
  const [editingArea, setEditingArea] = useState<BriefingArea | null>(null);

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-destructive/20 rounded-2xl p-8 text-center">
        <p className="text-sm text-destructive font-medium">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <Tabs defaultValue="marketing" className="w-full">
          <div className="border-b border-slate-100 px-4 pt-4">
            <TabsList className="bg-slate-50">
              {BRIEFING_AREAS.map((area) => {
                const Icon = BRIEFING_AREA_ICONS[area];
                return (
                  <TabsTrigger key={area} value={area} className="gap-2">
                    <Icon className="w-4 h-4" />
                    {BRIEFING_AREA_LABELS[area]}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {BRIEFING_AREAS.map((area) => {
            const areaContent = briefing?.[area] as BriefingAreaContent | undefined;
            const conteudo = areaContent?.conteudo;
            const Icon = BRIEFING_AREA_ICONS[area];

            return (
              <TabsContent key={area} value={area} className="p-6 mt-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-slate-500" />
                    <h3 className="text-base font-semibold text-foreground">
                      {BRIEFING_AREA_LABELS[area]}
                    </h3>
                  </div>
                  <button
                    onClick={() => setEditingArea(area)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium text-foreground hover:bg-slate-100 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    Editar
                  </button>
                </div>

                {conteudo ? (
                  <div 
                    className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: conteudo }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Esta área ainda não foi preenchida. Clique em Editar pra começar.
                  </p>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      {editingArea && (
        <BriefingEditSheet
          open={editingArea !== null}
          onOpenChange={(open) => {
            if (!open) setEditingArea(null);
          }}
          area={editingArea}
          initialContent={
            ((briefing?.[editingArea] as BriefingAreaContent | undefined)?.conteudo) || ""
          }
          updateArea={updateArea}
        />
      )}
    </>
  );
}
