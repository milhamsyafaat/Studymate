import { getSupabase } from "./supabase.js";

export const load = (k, fb) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? fb;
  } catch {
    return fb;
  }
};

export const save = (k, v) => {
  localStorage.setItem(k, JSON.stringify(v));
  syncToSupabase(k, v);
};

let syncTimer = null;

const syncToSupabase = (key, data) => {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      if (key === "sm_tasks_v2") {
        const { error: delErr } = await supabase
          .from("tasks")
          .delete()
          .neq("id", 0);
        if (delErr) return;
        const { error: insErr } = await supabase
          .from("tasks")
          .insert(data.map((t) => ({
            id: t.id, title: t.title, subject: t.subject,
            deadline: t.deadline, priority: t.priority,
            notes: t.notes || "", subtasks: t.subtasks || [],
            done: t.done,
          })));
        if (insErr) return;
      } else if (key === "sm_stats_v2") {
        await supabase.from("stats").upsert({
          user_id: "default",
          pomo_total: data.pomoTotal || 0,
          tasks_done: data.tasksDone || 0,
        }, { onConflict: "user_id" });
      }
    } catch {}
  }, 2000);
};
