import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useLaunchesByProduct } from "@/hooks/useLaunchesByProduct";
import { LAUNCH_TYPE_LABELS, LAUNCH_TYPE_ICONS } from "@/lib/schemas/launch-schema";
import { Avatar } from "@/components/Badges";
import { Plus, Rocket, Calendar } from "lucide-react";
import { NewLaunchDialog } from "@/components/launches/NewLaunchDialog";

interface ProductLaunchesListProps {
  productId: string;
}

export function ProductLaunchesList({ productId }: ProductLaunchesListProps) {
  const { launches, loading, error, refetch } = useLaunchesByProduct(productId);
  const [isNewLaunchOpen, setIsNewLaunchOpen] = useState(false);

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
    <>
      <div className="bg-white border border-border rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Lançamentos do produto ({launches.length})
            </h3>
          </div>
          <button
            onClick={() => setIsNewLaunchOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium bg-foreground text-background hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3 h-3" />
            Novo Lançamento
          </button>
        </div>

        {launches.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-muted-foreground">
              Nenhum lançamento cadastrado para este produto. Clique em "+ Novo Lançamento" para começar.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {launches.map((launch) => {
              const TypeIcon = LAUNCH_TYPE_ICONS[launch.tipo];
              const dataFormatada = new Date(launch.data_lancamento_prevista).toLocaleDateString("pt-BR");
              const ownerInitials = launch.owner_nome
                ? launch.owner_nome.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
                : "??";

              return (
                <Link
                  key={launch.id}
                  to="/launches/$id"
                  params={{ id: launch.id }}
                  className="block border border-border/60 rounded-lg p-4 hover:shadow-sm hover:border-border transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <TypeIcon className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {LAUNCH_TYPE_LABELS[launch.tipo]}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground truncate">{launch.nome}</p>
                      {launch.descricao && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{launch.descricao}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {dataFormatada}
                      </div>
                      {launch.owner_nome && <Avatar initials={ownerInitials} />}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <NewLaunchDialog
        open={isNewLaunchOpen}
        onOpenChange={(open) => {
          setIsNewLaunchOpen(open);
          if (!open) refetch();
        }}
        defaultProductId={productId}
      />
    </>
  );
}
