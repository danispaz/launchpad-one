import { FORMAT_ICONS, STATUS_LABELS } from "@/lib/schemas/content-schema";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CalendarPanel({ publications }: any) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padding = Array.from({ length: firstDay }, (_, i) => null);

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const getPubsForDay = (day: number) => {
    return publications.filter((p: any) => {
      if (!p.data_publicacao) return false;
      const d = new Date(p.data_publicacao);
      // Ajuste para fuso horário local se necessário, aqui usamos comparação simples YYYY-MM-DD
      const pubDate = new Date(p.data_publicacao + 'T00:00:00');
      return pubDate.getDate() === day && 
             pubDate.getMonth() === currentDate.getMonth() && 
             pubDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Cronograma</h3>
          <p className="text-xs text-slate-500">Visão mensal das publicações agendadas.</p>
        </div>
        <div className="flex items-center gap-4">
          <h4 className="font-black uppercase tracking-widest text-xs text-slate-400">{monthName}</h4>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-100">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="p-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 border-r last:border-0 border-slate-100">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {[...padding, ...days].map((day, idx) => (
            <div key={idx} className={`min-h-[120px] p-2 border-r border-b border-slate-100 last:border-r-0 ${day === null ? 'bg-slate-50/20' : ''}`}>
              {day && (
                <>
                  <span className="text-xs font-bold text-slate-300 mb-2 block">{day}</span>
                  <div className="space-y-1.5">
                    {getPubsForDay(day).map((pub: any) => {
                      const Icon = FORMAT_ICONS[pub.formato as keyof typeof FORMAT_ICONS] || ChevronRight;
                      return (
                        <div key={pub.id} className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col gap-1 hover:border-primary/30 transition-colors cursor-pointer group">
                          <div className="flex items-center gap-1.5">
                            <Icon className="w-2.5 h-2.5 text-slate-400 group-hover:text-primary transition-colors" />
                            <span className="text-[9px] font-bold text-slate-700 leading-tight line-clamp-2">{pub.titulo}</span>
                          </div>
                          <Badge variant="secondary" className="text-[8px] uppercase font-black px-1 h-3.5 w-fit border-none bg-white text-slate-400">
                            {STATUS_LABELS[pub.status as keyof typeof STATUS_LABELS]}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
