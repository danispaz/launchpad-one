import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { NewTaskInput, TaskStatusEnum } from "@/lib/schemas/task-schema";

export function useTaskMutations() {
  const [submitting, setSubmitting] = useState(false);

  const createTask = async (data: NewTaskInput) => {
    setSubmitting(true);
    try {
      console.log("[RAW useTaskMutations create input]", data);

      const payload = {
        launch_id: data.launch_id,
        titulo: data.titulo,
        descricao: data.descricao && data.descricao.trim() !== "" ? data.descricao : null,
        status: data.status,
        prioridade: data.prioridade,
        team: data.team && data.team.trim() !== "" ? data.team : null,
        assignee_id: data.assignee_id || null,
        phase_id: data.phase_id || null,
        data_inicio: data.data_inicio && data.data_inicio.trim() !== "" ? data.data_inicio : null,
        data_entrega: data.data_entrega && data.data_entrega.trim() !== "" ? data.data_entrega : null,
      };

      console.log("[RAW useTaskMutations create payload]", payload);

      const { data: inserted, error } = await supabase
        .from("tasks")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        console.error("[ERROR useTaskMutations create]", error);
        throw error;
      }

      console.log("[RAW useTaskMutations created]", inserted);
      return { success: true, taskId: inserted.id };
    } finally {
      setSubmitting(false);
    }
  };

  const updateTask = async (id: string, data: Partial<NewTaskInput>) => {
    setSubmitting(true);
    try {
      console.log("[RAW useTaskMutations update input]", { id, data });

      const payload: Record<string, unknown> = {};

      if (data.titulo !== undefined) payload.titulo = data.titulo;
      if (data.descricao !== undefined) {
        payload.descricao = data.descricao && data.descricao.trim() !== "" ? data.descricao : null;
      }
      if (data.status !== undefined) payload.status = data.status;
      if (data.prioridade !== undefined) payload.prioridade = data.prioridade;
      if (data.team !== undefined) {
        payload.team = data.team && data.team.trim() !== "" ? data.team : null;
      }
      if (data.assignee_id !== undefined) payload.assignee_id = data.assignee_id || null;
      if (data.phase_id !== undefined) payload.phase_id = data.phase_id || null;
      if (data.data_inicio !== undefined) {
        payload.data_inicio = data.data_inicio && data.data_inicio.trim() !== "" ? data.data_inicio : null;
      }
      if (data.data_entrega !== undefined) {
        payload.data_entrega = data.data_entrega && data.data_entrega.trim() !== "" ? data.data_entrega : null;
      }

      console.log("[RAW useTaskMutations update payload]", payload);

      const { error } = await supabase.from("tasks").update(payload).eq("id", id);

      if (error) {
        console.error("[ERROR useTaskMutations update]", error);
        throw error;
      }

      return { success: true };
    } finally {
      setSubmitting(false);
    }
  };

  const updateTaskStatus = async (id: string, status: TaskStatusEnum) => {
    try {
      console.log("[RAW useTaskMutations updateStatus]", { id, status });

      const { error } = await supabase.from("tasks").update({ status }).eq("id", id);

      if (error) {
        console.error("[ERROR useTaskMutations updateStatus]", error);
        throw error;
      }

      return { success: true };
    } catch (err) {
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    setSubmitting(true);
    try {
      console.log("[RAW useTaskMutations delete]", { id });

      const { error } = await supabase.from("tasks").delete().eq("id", id);

      if (error) {
        console.error("[ERROR useTaskMutations delete]", error);
        throw error;
      }

      return { success: true };
    } finally {
      setSubmitting(false);
    }
  };

  return { createTask, updateTask, updateTaskStatus, deleteTask, submitting };
}