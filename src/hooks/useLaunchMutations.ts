import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function useLaunchMutations() {
  const deleteLaunch = async (id: string) => {
    console.log("[RAW useLaunchMutations delete]", id);
    const { error } = await supabase.from("launches").delete().eq("id", id);
    if (error) {
      console.error("[ERROR useLaunchMutations delete]", error);
      toast.error("Erro ao deletar lançamento", { description: error.message });
      throw error;
    }
    toast.success("Lançamento deletado com sucesso");
  };

  return { deleteLaunch };
}