import { createClient } from "@supabase/supabase-js";
import { getRequiredEnv } from "../utils/env.js";

export function createSupabaseServiceClient() {
  const supabaseUrl = getRequiredEnv("SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        "X-Client-Info": "oioi-melting-dashboard-indexer",
      },
    },
  });
}
