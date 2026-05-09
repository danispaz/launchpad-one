import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  newProductSchema,
  type NewProductInput,
  type ProductCategory,
  PRODUCT_CATEGORIES,
  PRODUCT_LIFECYCLE_STAGES,
  CATEGORY_LABELS,
  LIFECYCLE_LABELS,
} from "@/lib/schemas/product-schema";
import { useAuth } from "@/hooks/useAuth";
import { useProfilesForOwner } from "@/hooks/useProfilesForOwner";
import { useProducts } from "@/hooks/useProducts";
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

interface NewProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewProductDialog({ open, onOpenChange }: NewProductDialogProps) {
  const { user } = useAuth();
  const { profiles, loading: loadingProfiles } = useProfilesForOwner();
  const { createProduct } = useProducts();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(newProductSchema) as never,
    defaultValues: {
      nome: "",
      descricao: "",
      categoria: "" as ProductCategory,
      estagio_atual: "descoberta",
      owner_id: "",
    },
  });

  useEffect(() => {
    if (user?.id && !form.getValues("owner_id")) {
      form.setValue("owner_id", user.id);
    }
  }, [user, form]);

  const onSubmit = async (data: NewProductInput) => {
    console.log("[RAW newProduct submit]", data);
    setIsSubmitting(true);

    try {
      const payload: NewProductInput = {
        ...data,
        descricao: data.descricao && data.descricao.trim() !== "" ? data.descricao : "",
      };

      console.log("[RAW newProduct payload]", payload);

      await createProduct(payload);

      form.reset();
      onOpenChange(false);
    } catch (err) {
      console.error("[ERROR newProduct submit]", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Novo Produto</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para cadastrar um novo produto.
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
                    <Input placeholder="Nome do produto" {...field} />
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
                      placeholder="Descreva brevemente o produto"
                      rows={3}
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
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRODUCT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {CATEGORY_LABELS[cat]}
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
                name="estagio_atual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estágio atual</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um estágio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRODUCT_LIFECYCLE_STAGES.map((stage) => (
                          <SelectItem key={stage} value={stage}>
                            {LIFECYCLE_LABELS[stage]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
