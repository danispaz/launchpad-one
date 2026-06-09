import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { 
  Calendar as CalendarIcon, 
  List, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  parseISO
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ContentSheet } from "./ContentSheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const STATUS_COLORS: Record<string, { label: string, color: string }> = {
  ideia: { label: "Ideia", color: "#94A3B8" },
  rascunho: { label: "Rascunho", color: "#3761E9" },
  em_revisão: { label: "Em revisão", color: "#BA68C8" },
  aprovado: { label: "Aprovado", color: "#FFB400" },
  agendado: { label: "Agendado", color: "#0EA5E9" },
  publicado: { label: "Publicado", color: "#16CFAE" },
};

export function ContentTab() {
  const [view, setView] = useState<"agenda" | "lista">("agenda");
  const [loading, setLoading] = useState(true);
  const [contents, setContents] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [campanhas, setCampanhas] = useState<any[]>([]);
  const [influenciadores, setInfluenciadores] = useState<any[]>([]);
  
  // Filtros
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCanal, setFilterCanal] = useState<string>("all");
  const [filterResponsavel, setFilterResponsavel] = useState<string>("all");
  const [filterCampanha, setFilterCampanha] = useState<string>("all");
  
  // Agenda
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: contentsRaw },
        { data: profilesRaw },
        { data: campanhasRaw },
        { data: influenciadoresRaw }
      ] = await Promise.all([
        supabase.from("marketing_conteudos").select("*").order("data_publicacao", { ascending: true, nullsFirst: false }),
        supabase.from("profiles").select("id, nome"),
        supabase.from("marketing_campanhas").select("id, nome"),
        supabase.from("marketing_influenciadores").select("id, nome")
      ]);

      const profileMap = new Map((profilesRaw || []).map(p => [p.id, p]));
      const campanhaMap = new Map((campanhasRaw || []).map(c => [c.id, c]));
      const influenciadorMap = new Map((influenciadoresRaw || []).map(i => [i.id, i]));

      const merged = (contentsRaw || []).map(c => ({
        ...c,
        responsavel: profileMap.get(c.responsavel_id),
        campanha: campanhaMap.get(c.campanha_id),
        influenciador: influenciadorMap.get(c.influenciador_id)
      }));

      setContents(merged);
      setProfiles(profilesRaw || []);
      setCampanhas(campanhasRaw || []);
      setInfluenciadores(influenciadoresRaw || []);
    } catch (err: any) {
      toast.error("Erro ao carregar dados: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredContents = contents.filter(c => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterCanal !== "all" && c.canal !== filterCanal) return false;
    if (filterResponsavel !== "all" && c.responsavel_id !== filterResponsavel) return false;
    if (filterCampanha !== "all" && c.campanha_id !== filterCampanha) return false;
    return true;
  });

  const canais = Array.from(new Set(contents.map(c => c.canal).filter(Boolean)));

  const handleAddClick = (date?: Date) => {
    setSelectedContent(null);
    setDefaultDate(date ? format(date, "yyyy-MM-dd") : undefined);
    setSheetOpen(true);
  };

  const handleEditClick = (content: any) => {
    setSelectedContent(content);
    setSheetOpen(true);
  };

  // Agenda helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { locale: ptBR });
  const endDate = endOfWeek(monthEnd, { locale: ptBR });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Barra de Filtros e Visualização */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white border rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              {Object.entries(STATUS_COLORS).map(([val, info]) => (
                <SelectItem key={val} value={val}>{info.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterCanal} onValueChange={setFilterCanal}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Canais</SelectItem>
              {canais.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterResponsavel} onValueChange={setFilterResponsavel}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Responsáveis</SelectItem>
              {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterCampanha} onValueChange={setFilterCampanha}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Campanha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Campanhas</SelectItem>
              {campanhas.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 border rounded-lg bg-slate-50">
            <Button 
              variant={view === "agenda" ? "white" : "ghost"} 
              size="sm" 
              className={`h-7 px-3 ${view === "agenda" ? "shadow-sm" : ""}`}
              onClick={() => setView("agenda")}
            >
              <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
              Agenda
            </Button>
            <Button 
              variant={view === "lista" ? "white" : "ghost"} 
              size="sm" 
              className={`h-7 px-3 ${view === "lista" ? "shadow-sm" : ""}`}
              onClick={() => setView("lista")}
            >
              <List className="w-3.5 h-3.5 mr-1.5" />
              Lista
            </Button>
          </div>
          <Button size="sm" onClick={() => handleAddClick()} className="h-9">
            <Plus className="w-4 h-4 mr-1.5" />
            Novo
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-white border rounded-xl shadow-sm min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : view === "agenda" ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header Agenda */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>Hoje</Button>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Grid Agenda */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="grid grid-cols-7 border-b bg-slate-50/50">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
                  <div key={d} className="px-2 py-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider border-r last:border-r-0">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 auto-rows-[minmax(120px,1fr)]">
                {calendarDays.map((day, idx) => {
                  const dayContents = filteredContents.filter(c => c.data_publicacao && isSameDay(parseISO(c.data_publicacao), day));
                  const isCurrentMonth = isSameMonth(day, monthStart);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <div 
                      key={idx} 
                      className={`min-h-[120px] p-2 border-r border-b last:border-r-0 group hover:bg-slate-50/50 transition-colors cursor-pointer ${!isCurrentMonth ? "bg-slate-50/30 text-slate-400" : ""}`}
                      onClick={() => handleAddClick(day)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-primary text-white" : ""}`}>
                          {format(day, "d")}
                        </span>
                      </div>
                      <div className="space-y-1 overflow-hidden">
                        {dayContents.map(content => (
                          <div 
                            key={content.id}
                            className="px-2 py-1 rounded text-[10px] font-medium truncate text-white"
                            style={{ backgroundColor: STATUS_COLORS[content.status]?.color || "#94A3B8" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(content);
                            }}
                          >
                            {content.titulo}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Campanha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center text-slate-400">Nenhum conteúdo encontrado.</TableCell>
                  </TableRow>
                ) : (
                  filteredContents.map(c => (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleEditClick(c)}>
                      <TableCell className="font-medium">{c.titulo}</TableCell>
                      <TableCell className="capitalize">{c.tipo?.replace("_", " ")}</TableCell>
                      <TableCell>{c.canal}</TableCell>
                      <TableCell>
                        <Badge variant="outline" style={{ 
                          backgroundColor: STATUS_COLORS[c.status]?.color + "20", 
                          color: STATUS_COLORS[c.status]?.color,
                          borderColor: STATUS_COLORS[c.status]?.color + "40"
                        }}>
                          {STATUS_COLORS[c.status]?.label || c.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{c.data_publicacao ? format(parseISO(c.data_publicacao), "dd/MM/yyyy") : "-"}</TableCell>
                      <TableCell>{c.responsavel?.nome || "-"}</TableCell>
                      <TableCell>{c.campanha?.nome || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ContentSheet 
        open={sheetOpen} 
        onOpenChange={setSheetOpen} 
        content={selectedContent}
        profiles={profiles}
        campanhas={campanhas}
        influenciadores={influenciadores}
        onSuccess={fetchData}
        defaultDate={defaultDate}
      />
    </div>
  );
}
