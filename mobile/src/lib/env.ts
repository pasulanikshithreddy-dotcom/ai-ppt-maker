export type PublicEnv = {
  EXPO_PUBLIC_API_BASE_URL: string;
  EXPO_PUBLIC_SUPABASE_URL: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
  EXPO_PUBLIC_WEB_APP_URL: string;
};

export function getPublicEnv(): PublicEnv {
  return {
    EXPO_PUBLIC_API_BASE_URL:
      process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8000/api/v1",
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || "",
    EXPO_PUBLIC_SUPABASE_ANON_KEY:
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || "",
    EXPO_PUBLIC_WEB_APP_URL:
      process.env.EXPO_PUBLIC_WEB_APP_URL?.trim() || "http://localhost:3000/pricing",
  };
}
