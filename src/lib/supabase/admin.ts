import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

export function isSupabaseAdminConfigured() {
  return (
    getSupabasePublicConfig() !== null &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
  );
}

export function createSupabaseAdminClient() {
  const config = getSupabasePublicConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!config || !serviceRoleKey) {
    throw new Error(
      "Private photo storage requires the Supabase URL and server-only service role key.",
    );
  }

  return createClient<Database>(config.url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
