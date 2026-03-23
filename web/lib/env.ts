const DEFAULT_API_BASE_URL = "http://localhost:8000/api/v1";

export type PublicEnv = {
  NEXT_PUBLIC_API_BASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  NEXT_PUBLIC_SUPABASE_URL: string;
};

export function getPublicEnv(): PublicEnv {
  return {
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "",
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "",
  };
}

export function getPublicEnvStatus() {
  const env = getPublicEnv();
  const missingKeys: string[] = [];

  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    missingKeys.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missingKeys.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return {
    apiBaseUrl: env.NEXT_PUBLIC_API_BASE_URL,
    backendReady: Boolean(env.NEXT_PUBLIC_API_BASE_URL),
    supabaseReady:
      Boolean(env.NEXT_PUBLIC_SUPABASE_URL) &&
      Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    missingKeys,
  };
}
