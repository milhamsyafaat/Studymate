import { supabase } from "./supabase.js";

let isOnline = true;

export const setOnline = (v) => (isOnline = v);

export const load = (k, fb) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? fb;
  } catch {
    return fb;
  }
};

export const save = (k, v) => {
  localStorage.setItem(k, JSON.stringify(v));
  if (!isOnline) return;
  syncToSupabase(k, v);
};

const syncToSupabase = async (key, data) => {
  try {
    if (key === "sm_tasks_v2") {
      for (const task of data) {
        const { data: existing } = await supabase
          .from("tasks")
          .select("id")
          .eq("id", task.id)
          .maybeSingle();
        if (existing) {
          await supabase.from("tasks").update({
            title: task.title,
            subject: task.subject,
            deadline: task.deadline,
            priority: task.priority,
            notes: task.notes || "",
            subtasks: task.subtasks || [],
            done: task.done,
          }).eq("id", task.id);
        } else {
          await supabase.from("tasks").insert({
            id: task.id,
            title: task.title,
            subject: task.subject,
            deadline: task.deadline,
            priority: task.priority,
            notes: task.notes || "",
            subtasks: task.subtasks || [],
            done: task.done,
          });
        }
      }
    } else if (key === "sm_stats_v2") {
      await supabase.from("stats").upsert({
        user_id: "default",
        pomo_total: data.pomoTotal || 0,
        tasks_done: data.tasksDone || 0,
      }, { onConflict: "user_id" });
    } else if (key === "sm_subjects_v2") {
      const { data: existing } = await supabase.from("subjects").select("name");
      const currentNames = new Set(existing?.map((s) => s.name) || []);
      const newNames = data.filter((n) => !currentNames.has(n));
      for (const name of newNames) {
        await supabase.from("subjects").insert({ name, user_id: "default" });
      }
    }
  } catch {
    setOnline(false);
  }
};
