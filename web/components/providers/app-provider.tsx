"use client";

import {
  type Session,
  type SupabaseClient,
} from "@supabase/supabase-js";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  type CurrentUser,
  type PlanOverview,
  type TemplateDefinition,
  getCurrentUser,
  getPlan,
  getTemplates,
} from "@/lib/api/backend";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

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
  accountLoading: boolean;
  accountError: string | null;
  supabaseReady: boolean;
  refreshAccount: () => Promise<void>;
  refreshTemplates: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (
    email: string,
    password: string,
    fullName?: string,
  ) => Promise<{ requiresEmailVerification: boolean }>;
  signOut: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>(
    supabase ? "loading" : "anonymous",
  );
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [plan, setPlan] = useState<PlanOverview | null>(null);
  const [templates, setTemplates] = useState<TemplateDefinition[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [accountLoading, setAccountLoading] = useState(Boolean(supabase));
  const [accountError, setAccountError] = useState<string | null>(null);

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

  const loadAccount = useCallback(async (client: SupabaseClient, nextSession: Session | null) => {
    setSession(nextSession);

    if (!nextSession?.access_token) {
      setAuthStatus("anonymous");
      setCurrentUser(null);
      setPlan(null);
      setAccountError(null);
      setAccountLoading(false);
      return;
    }

    setAuthStatus("authenticated");
    setAccountLoading(true);
    setAccountError(null);

    try {
      const [userResponse, planResponse] = await Promise.all([
        getCurrentUser(nextSession.access_token),
        getPlan(nextSession.access_token),
      ]);

      setCurrentUser(userResponse.data);
      setPlan(planResponse.data);
    } catch (error) {
      setCurrentUser(null);
      setPlan(null);
      setAccountError(
        error instanceof Error
          ? error.message
          : "Failed to load your account details.",
      );
    } finally {
      setAccountLoading(false);
    }

    const { data } = await client.auth.getSession();
    if (data.session?.access_token !== nextSession.access_token) {
      setSession(data.session);
    }
  }, []);

  const refreshAccount = useCallback(async () => {
    if (!supabase) {
      setAuthStatus("anonymous");
      setCurrentUser(null);
      setPlan(null);
      setAccountLoading(false);
      return;
    }

    const { data } = await supabase.auth.getSession();
    await loadAccount(supabase, data.session);
  }, [loadAccount, supabase]);

  useEffect(() => {
    void refreshTemplates();
  }, [refreshTemplates]);

  useEffect(() => {
    if (!supabase) {
      setAuthStatus("anonymous");
      setAccountLoading(false);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }
      void loadAccount(supabase, data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) {
        return;
      }
      void loadAccount(supabase, nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadAccount, supabase]);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        throw new Error("Supabase auth is not configured in this web app.");
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        throw new Error(error.message);
      }

      await loadAccount(supabase, data.session);
    },
    [loadAccount, supabase],
  );

  const signUpWithPassword = useCallback(
    async (email: string, password: string, fullName?: string) => {
      if (!supabase) {
        throw new Error("Supabase auth is not configured in this web app.");
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

      await loadAccount(supabase, data.session);
      return {
        requiresEmailVerification: !data.session,
      };
    },
    [loadAccount, supabase],
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

    await loadAccount(supabase, null);
  }, [loadAccount, supabase]);

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
      accountLoading,
      accountError,
      supabaseReady: Boolean(supabase),
      refreshAccount,
      refreshTemplates,
      signInWithPassword,
      signUpWithPassword,
      signOut,
    }),
    [
      accountError,
      accountLoading,
      authStatus,
      currentUser,
      plan,
      refreshAccount,
      refreshTemplates,
      session,
      signInWithPassword,
      signOut,
      signUpWithPassword,
      supabase,
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
    throw new Error("useApp must be used within AppProvider.");
  }
  return context;
}
