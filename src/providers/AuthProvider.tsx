import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";
import { upsertProfileForUser, type Profile } from "@/services/profiles";

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const syncProfile = useCallback(async (user: User | null) => {
    if (!user) {
      setProfile(null);
      return;
    }

    try {
      const nextProfile = await upsertProfileForUser(user);
      setProfile(nextProfile);
    } catch (error) {
      console.warn("Could not sync Supabase profile.", error);
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const [{ data, error }, { data: sessionData, error: sessionError }] =
      await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession(),
      ]);

    if (error) {
      throw error;
    }

    if (sessionError) {
      throw sessionError;
    }

    setSession(sessionData.session);
    await syncProfile(data.user);
  }, [syncProfile]);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (error) throw error;
        if (!mounted) return;

        setSession(data.session);
        await syncProfile(data.session?.user ?? null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        setSession(nextSession);
        await syncProfile(nextSession?.user ?? null);
        setLoading(false);
      },
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [syncProfile]);

  const value = useMemo(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      profile,
      refreshProfile,
    }),
    [loading, profile, refreshProfile, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
