import { createClient } from "@supabase/supabase-js";
import { getRewardSupabaseEnv } from "@/lib/rewards/environment";

export function createSupabaseServiceClient() {
  const { url: supabaseUrl, serviceRoleKey } = getRewardSupabaseEnv();

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
