import { useState, useEffect } from "react";
import {
  BRIEFING_AREA_LABELS,
  BRIEFING_AREA_ICONS,
  type BriefingArea,
} from "@/lib/schemas/briefing-schema";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

interface BriefingEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  area: BriefingArea;
  initialContent: string;
  updateArea: (area: BriefingArea, conteudo: string) => Promise<void>;
}

export function BriefingEditSheet({
  open,
  onOpenChange,
  area,
  initialContent,
  updateArea,
}: BriefingEditSheetProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const Icon = BRIEFING_AREA_ICONS[area];

  // Sync content quando initialContent muda (ex: usuário troca de área)
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateArea(area, content);
      onOpenChange(false); // Fecha apenas se salvou com sucesso
    } catch {
      // toast de erro já mostrado pelo hook useBriefing
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            Editar {BRIEFING_AREA_LABELS[area]}
          </SheetTitle>
          <SheetDescription>
            Conteúdo do briefing desta área. Texto em formato livre.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 py-4">
          <RichTextEditor
            value={content}
            onChange={(val) => setContent(val)}
            placeholder={`Escreva o briefing de ${BRIEFING_AREA_LABELS[area]}...`}
            minHeight="400px"
          />
          <p className="text-xs text-muted-foreground mt-2 text-right">
            {content.length}/10000
          </p>
        </div>

        <SheetFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
