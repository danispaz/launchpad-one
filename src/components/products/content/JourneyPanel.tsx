import { useState } from "react";
import { JOURNEY_STAGES, JOURNEY_LABELS, JOURNEY_DESCRIPTIONS, JOURNEY_ICONS } from "@/lib/schemas/content-schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

export function JourneyPanel({ personas, journeyStages, onUpsert }: any) {
  const [needs, setNeeds] = useState<Record<string, string>>({});

  const getStageContent = (personaId: string, stage: string) => {
    return journeyStages.find((s: any) => s.persona_id === personaId && s.estagio === stage)?.necessidades || "";
  };

  const handleSave = (personaId: string, stage: string) => {
    const content = needs[`${personaId}-${stage}`];
    if (content !== undefined) {
      onUpsert({ persona_id: personaId, estagio: stage, necessidades: content });
    }
  };

  if (personas.length === 0) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center">
        <p className="text-sm text-slate-400 font-medium">Cadastre personas primeiro para definir a jornada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Jornada de Compra</h3>
        <p className="text-sm text-slate-500 font-medium">Mapeie as necessidades das personas em cada estágio do funil de vendas.</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 overflow-x-auto scrollbar-thin">
        <div className="min-w-[1200px]">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
              <TableHead className="w-[200px] font-black uppercase tracking-widest text-[10px]">Persona</TableHead>
              {JOURNEY_STAGES.map((stage) => {
                const Icon = JOURNEY_ICONS[stage];
                return (
                  <TableHead key={stage} className="min-w-[300px]">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-primary" />
                      <span className="font-black uppercase tracking-widest text-[10px]">{JOURNEY_LABELS[stage]}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-normal leading-tight lowercase">
                      {JOURNEY_DESCRIPTIONS[stage]}
                    </p>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {personas.map((persona: any) => (
              <TableRow key={persona.id}>
                <TableCell className="font-bold text-slate-700">{persona.nome}</TableCell>
                {JOURNEY_STAGES.map((stage) => (
                  <TableCell key={stage} className="p-4 align-top">
                    <div className="space-y-2">
                      <RichTextEditor
                        value={needs[`${persona.id}-${stage}`] ?? getStageContent(persona.id, stage)}
                        onChange={(v) => setNeeds({ ...needs, [`${persona.id}-${stage}`]: v })}
                        minHeight="120px"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full h-7 text-[10px] font-bold uppercase tracking-wider gap-1.5"
                        onClick={() => handleSave(persona.id, stage)}
                        disabled={needs[`${persona.id}-${stage}`] === undefined}
                      >
                        <Save className="w-3 h-3" /> Salvar Alteração
                      </Button>
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
  );
}
