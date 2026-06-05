import { createClient } from "@supabase/supabase-js";
import { env } from "@/config/env";
import type { Database } from "@/types/database";

const fallbackUrl = "https://example.supabase.co";
const fallbackKey = "missing-anon-key";

export const supabase = createClient<Database>(
  env.supabaseUrl || fallbackUrl,
  env.supabaseAnonKey || fallbackKey,
  {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  },
);

