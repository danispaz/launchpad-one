import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  newTaskSchema,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_PRIORITIES,
   TASK_PRIORITY_LABELS,
  type NewTaskInput,
} from "@/lib/schemas/task-schema";
import { useTaskMutations } from "@/hooks/useTaskMutations";
import { useProfilesForOwner } from "@/hooks/useProfilesForOwner";
import { teamMap, type TeamName } from "@/lib/utils/formatters";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Phase {
  id: string;
  nome: string;
}

interface TaskToEdit {
  id: string;
  titulo: string;
  descricao?: string | null;
  status: string;
  prioridade: string;
  team?: string | null;
  assignee_id?: string | null;
  phase_id?: string | null;
  data_inicio?: string | null;
  data_entrega?: string | null;
}

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  launchId: string;
  phases: Phase[];
  taskToEdit?: TaskToEdit | null;
  onSuccess?: () => void;
}

export function TaskFormDialog({
  open,
  onOpenChange,
  launchId,
  phases,
  taskToEdit,
  onSuccess,
}: TaskFormDialogProps) {
  const { createTask, updateTask, submitting } = useTaskMutations();
  const { profiles, loading: loadingProfiles } = useProfilesForOwner();

  const isEdit = !!taskToEdit;

  const form = useForm({
    resolver: zodResolver(newTaskSchema) as any,
    defaultValues: {
      launch_id: launchId,
      titulo: "",
      descricao: "",
      status: "a_fazer",
      prioridade: "média",
      team: "",
      assignee_id: "",
      phase_id: "",
      data_inicio: "",
      data_entrega: "",
    },
  });

  useEffect(() => {
    if (taskToEdit) {
      form.reset({
        launch_id: launchId,
        titulo: taskToEdit.titulo,
        descricao: taskToEdit.descricao || "",
        status: taskToEdit.status,
        prioridade: taskToEdit.prioridade,
        team: taskToEdit.team || "",
        assignee_id: taskToEdit.assignee_id || "",
        phase_id: taskToEdit.phase_id || "",
        data_inicio: taskToEdit.data_inicio || "",
        data_entrega: taskToEdit.data_entrega || "",
      } as never);
    } else {
      form.reset({
        launch_id: launchId,
        titulo: "",
        descricao: "",
        status: "a_fazer",
        prioridade: "média",
        team: "",
        assignee_id: "",
        phase_id: "",
        data_inicio: "",
        data_entrega: "",
      } as never);
    }
  }, [taskToEdit, launchId, form]);

  const onSubmit = async (data: any) => {
    try {
      if (isEdit && taskToEdit) {
        await updateTask(taskToEdit.id, data);
        toast.success("Tarefa atualizada com sucesso!");
      } else {
        await createTask(data);
        toast.success("Tarefa criada com sucesso!");
      }
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("[ERROR task form submit]", err);
      toast.error(`Erro ao ${isEdit ? "atualizar" : "criar"} tarefa`, {
        description: err instanceof Error ? err.message : "Tente novamente mais tarde",
      });
    }
  };

  const teamKeys = Object.keys(teamMap) as TeamName[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Atualize as informações da tarefa." : "Preencha os campos para criar uma nova tarefa."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Definir copy do hero" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes da tarefa..."
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TASK_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {TASK_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prioridade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Prioridade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TASK_PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {TASK_PRIORITY_LABELS[p]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="team"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teamKeys.map((tk) => (
                          <SelectItem key={tk} value={tk}>
                            {teamMap[tk]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignee_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""} disabled={loadingProfiles}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingProfiles ? "Carregando..." : "Selecione"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {profiles.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nome || "Sem nome"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {phases.length > 0 && (
              <FormField
                control={form.control}
                name="phase_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fase (opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma fase" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {phases.map((ph) => (
                          <SelectItem key={ph.id} value={ph.id}>
                            {ph.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de início</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_entrega"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de entrega</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                {submitting ? "Salvando..." : isEdit ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
