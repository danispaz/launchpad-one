import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  lifecycleTransitionSchema,
} from "@/lib/schemas/lifecycle-schema";
import {
  PRODUCT_LIFECYCLE_STAGES,
  LIFECYCLE_LABELS,
  LIFECYCLE_ICONS,
  type ProductLifecycleStage,
} from "@/lib/schemas/product-schema";
import { useLifecycleTransition } from "@/hooks/useLifecycleTransition";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface LifecycleTransitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  estagioAtual: ProductLifecycleStage;
  onTransitionComplete?: () => void;
}

export function LifecycleTransitionDialog({
  open,
  onOpenChange,
  productId,
  estagioAtual,
  onTransitionComplete,
}: LifecycleTransitionDialogProps) {
  const { transition, submitting } = useLifecycleTransition();

  const form = useForm({
    resolver: zodResolver(lifecycleTransitionSchema) as any,
    defaultValues: {
      product_id: productId,
      estagio_anterior: estagioAtual,
      motivo: "",
    } as never,
  });

  useEffect(() => {
    form.reset({
      product_id: productId,
      estagio_anterior: estagioAtual,
      motivo: "",
    } as never);
  }, [productId, estagioAtual, form]);

  const onSubmit = async (data: any) => {
    try {
      await transition({
        productId: data.product_id,
        estagioAnterior: data.estagio_anterior,
        estagioNovo: data.estagio_novo,
        motivo: data.motivo,
      });

      toast.success("Estágio do produto atualizado!");
      form.reset();
      onOpenChange(false);
      onTransitionComplete?.();
    } catch (err) {
      console.error("[ERROR transition submit]", err);
      toast.error("Erro ao atualizar estágio", {
        description: err instanceof Error ? err.message : "Tente novamente mais tarde",
      });
    }
  };

  const CurrentIcon = LIFECYCLE_ICONS[estagioAtual];
  const availableStages = PRODUCT_LIFECYCLE_STAGES.filter((s) => s !== estagioAtual);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Mudar estágio do produto</DialogTitle>
          <DialogDescription>
            A mudança será registrada no histórico de transições do produto.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="bg-surface border border-border/50 rounded-lg p-3">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                Estágio atual
              </div>
              <div className="flex items-center gap-2">
                <CurrentIcon className="w-4 h-4" />
                <span className="text-sm font-semibold">{LIFECYCLE_LABELS[estagioAtual]}</span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="estagio_novo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Novo estágio</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o novo estágio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableStages.map((stage) => {
                        const Icon = LIFECYCLE_ICONS[stage];
                        return (
                          <SelectItem key={stage} value={stage}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {LIFECYCLE_LABELS[stage]}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo da transição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: produto validado com 50 clientes, partindo para MVP..."
                      className="resize-none min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Atualizando..." : "Confirmar transição"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
