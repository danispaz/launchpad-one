import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

interface ReleaseItem {
  id: string;
  nome: string;
  status: string;
  ordem: number;
}

interface Release {
  id: string;
  nome: string;
  data_inicio: string | null;
  data_prevista: string | null;
  status: string;
  ordem: number;
  items: ReleaseItem[];
}

interface Launch {
  id: string;
  nome: string;
  status: string;
  data_inicio: string | null;
  data_lancamento_prevista: string | null;
  releases: Release[];
}

const LAUNCH_COLORS: Record<string, { bar: string; text: string }> = {
  "Planejamento": { bar: "bg-slate-400", text: "text-slate-600" },
  "Em Andamento": { bar: "bg-blue-500", text: "text-blue-600" },
  "Concluído":    { bar: "bg-emerald-500", text: "text-emerald-600" },
  "Atrasado":     { bar: "bg-rose-500", text: "text-rose-600" },
  "Cancelado":    { bar: "bg-slate-300", text: "text-slate-400" },
};

const RELEASE_COLORS: Record<string, string> = {
  "Planejamento": "bg-slate-300",
  "Em Andamento": "bg-blue-300",
  "Concluído":    "bg-emerald-300",
  "Atrasado":     "bg-rose-300",
};

const ITEM_STATUS: Record<string, { dot: string; text: string }> = {
  "pendente":     { dot: "bg-slate-300", text: "text-slate-400" },
  "em_progresso": { dot: "bg-blue-400", text: "text-blue-600" },
  "concluido":    { dot: "bg-emerald-400", text: "text-emerald-600" },
};

const QUARTERS = [
  { label: "Q1", monthNames: ["Jan", "Fev", "Mar"] },
  { label: "Q2", monthNames: ["Abr", "Mai", "Jun"] },
  { label: "Q3", monthNames: ["Jul", "Ago", "Set"] },
  { label: "Q4", monthNames: ["Out", "Nov", "Dez"] },
];

function getDaysInYear(year: number): number {
  return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function getBarPosition(startStr: string | null, endStr: string | null, year: number) {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const totalDays = getDaysInYear(year);
  let start = startStr ? new Date(startStr) : null;
  let end = endStr ? new Date(endStr) : null;
  if (!start && !end) return { left: "0%", width: "0%", visible: false };
  if (!start) start = end!;
  if (!end) end = start;
  if (end < yearStart || start > yearEnd) return { left: "0%", width: "0%", visible: false };
  const clampedStart = start < yearStart ? yearStart : start;
  const clampedEnd = end > yearEnd ? yearEnd : end;
  const startDay = getDayOfYear(clampedStart);
  const endDay = getDayOfYear(clampedEnd);
  const left = ((startDay - 1) / totalDays) * 100;
  const width = Math.max(((endDay - startDay + 1) / totalDays) * 100, 1.5);
  return { left: `${left.toFixed(2)}%`, width: `${width.toFixed(2)}%`, visible: true };
}

interface Props {
  productId: string;
}
