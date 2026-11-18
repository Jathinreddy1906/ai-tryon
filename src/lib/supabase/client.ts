"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

let browserClient: SupabaseClient<Database> | null = null;

export function getSupabaseBrowserClient() {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  browserClient ??= createBrowserClient<Database>(config.url, config.publishableKey);
  return browserClient;
}
