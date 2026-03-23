import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getPublicEnv } from "@/lib/env";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  const env = getPublicEnv();

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  if (browserClient) {
    return browserClient;
  }

  browserClient = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    },
  );

  return browserClient;
}

export async function getSupabaseSessionPlaceholder() {
  const client = getSupabaseBrowserClient();

  if (!client) {
    return {
      error: "Supabase public env vars are missing.",
      session: null,
    };
  }

  const { data, error } = await client.auth.getSession();

  return {
    error: error?.message ?? null,
    session: data.session,
  };
}
