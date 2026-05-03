import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { newLaunchSchema, type NewLaunchInput } from "@/lib/schemas/launch-schema";
import { useAuth } from "@/hooks/useAuth";
import { useProfilesForOwner } from "@/hooks/useProfilesForOwner";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
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

interface NewLaunchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewLaunchDialog({ open, onOpenChange }: NewLaunchDialogProps) {
  const { user } = useAuth();
  const { profiles, loading: loadingProfiles } = useProfilesForOwner();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<NewLaunchInput>({
    resolver: zodResolver(newLaunchSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      produto: "",
      data_inicio: "",
      data_lancamento_prevista: "",
      prioridade: "média",
      owner_id: "",
    },
  });

  useEffect(() => {
    if (user?.id && !form.getValues("owner_id")) {
      form.setValue("owner_id", user.id);
    }
  }, [user, form]);

  const onSubmit = async (data: NewLaunchInput) => {
    console.log("[RAW newLaunch submit]", data);
    setIsSubmitting(true);

    try {
      // Normaliza descrição vazia para null (mais limpo no banco)
      const payload = {
        nome: data.nome,
        descricao: data.descricao && data.descricao.trim() !== "" 
          ? data.descricao 
          : null,
        produto: data.produto,
        data_inicio: data.data_inicio,
        data_lancamento_prevista: data.data_lancamento_prevista,
        prioridade: data.prioridade,
        owner_id: data.owner_id,
      };

      console.log("[RAW newLaunch payload]", payload);

      const { data: insertedLaunch, error } = await supabase
        .from("launches")
        .insert(payload)
        .select("id")
        .single();

      console.log("[RAW newLaunch response]", { insertedLaunch, error });

      if (error) {
        throw error;
      }

      if (!insertedLaunch?.id) {
        throw new Error("Lançamento criado mas ID não foi retornado");
      }

      // Reset do form para próxima abertura limpa
      form.reset();
      
      // Fecha o modal
      onOpenChange(false);

      // Redireciona para tela de detalhe do lançamento criado
      navigate({ to: "/launches/$id", params: { id: insertedLaunch.id } });
      toast.success("Lançamento criado com sucesso!");

    } catch (err: any) {
      console.error("[ERROR newLaunch insert]", err);
      toast.error("Erro ao criar lançamento", {
        description: err?.message || "Erro desconhecido. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Novo Lançamento</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para criar um novo lançamento.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do lançamento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="produto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Produto</FormLabel>
                  <FormControl>
                    <Input placeholder="Produto associado" {...field} />
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
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Breve descrição do lançamento (opcional)"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de início</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_lancamento_prevista"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data prevista de lançamento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="prioridade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a prioridade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="média">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="crítica">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="owner_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={loadingProfiles}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={loadingProfiles ? "Carregando..." : "Selecione o responsável"}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}