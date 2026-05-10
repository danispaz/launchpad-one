import { useLifecycleHistory } from "@/hooks/useLifecycleHistory";
import { LIFECYCLE_LABELS, LIFECYCLE_ICONS } from "@/lib/schemas/product-schema";
import { Avatar } from "@/components/Badges";
import { History, ArrowRight } from "lucide-react";

interface LifecycleHistoryDisplayProps {
  productId: string;
}

export function LifecycleHistoryDisplay({ productId }: LifecycleHistoryDisplayProps) {
  const { history, loading, error } = useLifecycleHistory(productId);

  if (loading) {
    return (
      <div className="bg-white border border-border rounded-xl shadow-sm p-6">
        <div className="animate-pulse h-24 bg-surface rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-destructive/20 rounded-xl p-6">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          Histórico de transições ({history.length})
        </h3>
      </div>

      {history.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-xs text-muted-foreground italic">
            Nenhuma transição registrada ainda. Use o botão "Mudar estágio" no topo da página para registrar a primeira transição.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {history.map((item) => {
            const FromIcon = LIFECYCLE_ICONS[item.estagio_anterior];
            const ToIcon = LIFECYCLE_ICONS[item.estagio_novo];
            const dataFormatada = new Date(item.transicionado_em).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={item.id}
                className="flex flex-col gap-2 p-3 rounded-lg border border-border/50 bg-surface/30 hover:bg-surface/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1 font-medium text-muted-foreground">
                      <FromIcon className="w-3 h-3" />
                      {LIFECYCLE_LABELS[item.estagio_anterior]}
                    </div>
                    <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                    <div className="flex items-center gap-1 font-bold text-foreground">
                      <ToIcon className="w-3 h-3" />
                      {LIFECYCLE_LABELS[item.estagio_novo]}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {dataFormatada}
                  </span>
                </div>

                {item.motivo && (
                  <p className="text-xs text-muted-foreground leading-relaxed italic">
                    "{item.motivo}"
                  </p>
                )}

                <div className="flex items-center gap-2 mt-1 pt-2 border-t border-border/30">
                  <div className="flex-shrink-0">
                    <Avatar
                      initials={item.transicionado_por_nome?.[0] || "U"}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Transicionado por <span className="font-medium">{item.transicionado_por_nome || "Usuário"}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
