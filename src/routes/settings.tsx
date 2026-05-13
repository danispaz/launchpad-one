import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { UserPlus, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Configurações — LaunchHub" }] }),
  component: SettingsPage,
});

const SECTIONS = [
  { title: "Usuários", description: "Gerencie os membros da equipe", url: "/users", icon: UserPlus },
];

function SettingsPage() {
  return (
    <AppLayout>
      <TopBar title="Configurações" subtitle="Ajustes da plataforma" />
      <div className="flex-1 px-8 py-10 max-w-[1000px] mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SECTIONS.map((s) => (
            <Link
              key={s.url}
              to={s.url}
              className="group flex items-center gap-4 p-5 rounded-xl bg-white border border-slate-100 hover:border-primary/30 shadow-sm hover:shadow-md transition-all"
            >
              <div className="p-3 rounded-xl bg-slate-50 text-primary">
                <s.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">{s.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}