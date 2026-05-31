import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://ifwujxkkdururfurutgt.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_UIk9KBSva4_4ygnF1zJaLw_YiTcFObU";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
