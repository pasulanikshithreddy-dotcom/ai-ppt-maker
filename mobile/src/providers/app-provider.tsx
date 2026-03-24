import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";

import {
  type CurrentUser,
  type PlanOverview,
  type TemplateDefinition,
  getCurrentUser,
  getPlan,
  getTemplates,
} from "@/lib/api";
import { supabase } from "@/lib/supabase";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AppContextValue = {
  authStatus: AuthStatus;
  session: Session | null;
  accessToken: string | null;
  currentUser: CurrentUser | null;
  plan: PlanOverview | null;
  templates: TemplateDefinition[];
  templatesLoading: boolean;
  templatesError: string | null;
  supabaseReady: boolean;
  refreshAccount: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (
    email: string,
    password: string,
    fullName?: string,
  ) => Promise<{ requiresEmailVerification: boolean }>;
  signOut: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>(supabase ? "loading" : "anonymous");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [plan, setPlan] = useState<PlanOverview | null>(null);
  const [templates, setTemplates] = useState<TemplateDefinition[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  const refreshTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    setTemplatesError(null);

    try {
      const response = await getTemplates();
      setTemplates(response.data.items);
    } catch (error) {
      setTemplatesError(
        error instanceof Error ? error.message : "Failed to load templates.",
      );
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  const loadAccount = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);

    if (!nextSession?.access_token) {
      setCurrentUser(null);
      setPlan(null);
      setAuthStatus("anonymous");
      return;
    }

    setAuthStatus("authenticated");
    const [userResponse, planResponse] = await Promise.all([
      getCurrentUser(nextSession.access_token),
      getPlan(nextSession.access_token),
    ]);
    setCurrentUser(userResponse.data);
    setPlan(planResponse.data);
  }, []);

  const refreshAccount = useCallback(async () => {
    if (!supabase) {
      return;
    }
    const { data } = await supabase.auth.getSession();
    await loadAccount(data.session);
  }, [loadAccount]);

  useEffect(() => {
    void refreshTemplates();
  }, [refreshTemplates]);

  useEffect(() => {
    if (!supabase) {
      setAuthStatus("anonymous");
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }
      void loadAccount(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) {
        return;
      }
      void loadAccount(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadAccount]);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        throw new Error("Supabase auth is not configured in this app.");
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw new Error(error.message);
      }

      await loadAccount(data.session);
    },
    [loadAccount],
  );

  const signUpWithPassword = useCallback(
    async (email: string, password: string, fullName?: string) => {
      if (!supabase) {
        throw new Error("Supabase auth is not configured in this app.");
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: fullName ? { full_name: fullName } : undefined,
        },
      });
      if (error) {
        throw new Error(error.message);
      }

      await loadAccount(data.session);
      return {
        requiresEmailVerification: !data.session,
      };
    },
    [loadAccount],
  );

  const signOut = useCallback(async () => {
    if (!supabase) {
      setSession(null);
      setCurrentUser(null);
      setPlan(null);
      setAuthStatus("anonymous");
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }

    await loadAccount(null);
  }, [loadAccount]);

  const value = useMemo<AppContextValue>(
    () => ({
      authStatus,
      session,
      accessToken: session?.access_token ?? null,
      currentUser,
      plan,
      templates,
      templatesLoading,
      templatesError,
      supabaseReady: Boolean(supabase),
      refreshAccount,
      signInWithPassword,
      signUpWithPassword,
      signOut,
    }),
    [
      authStatus,
      currentUser,
      plan,
      refreshAccount,
      session,
      signInWithPassword,
      signOut,
      signUpWithPassword,
      templates,
      templatesError,
      templatesLoading,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used inside AppProvider.");
  }
  return context;
}
