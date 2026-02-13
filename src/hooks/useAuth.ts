"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import type { User } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import React from "react";

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User | null;
  initialProfile?: Profile | null;
}

export function AuthProvider({ children, initialUser, initialProfile }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [profile, setProfile] = useState<Profile | null>(initialProfile ?? null);
  const [loading, setLoading] = useState(!initialProfile);

  useEffect(() => {
    const supabase = createClient();

    // If we already have initial data from the server, just listen for changes
    if (!initialProfile) {
      // Fallback: fetch client-side if no server data was provided
      async function getSession() {
        try {
          const {
            data: { user: authUser },
            error: authError,
          } = await supabase.auth.getUser();

          if (authError) {
            console.error("[useAuth] getUser error:", authError.message);
          }

          setUser(authUser);

          if (authUser) {
            const { data, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", authUser.id)
              .single();

            if (profileError) {
              console.error("[useAuth] profile fetch error:", profileError.message);
            }

            setProfile(data);
          }
        } catch (err) {
          console.error("[useAuth] Unexpected error:", err);
        }

        setLoading(false);
      }

      getSession();
    }

    // Listen for auth state changes (logout, token refresh, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setProfile(data);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [initialProfile]);

  const refreshProfile = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (data) {
        setProfile(data);
      }
    }
  }, []);

  return React.createElement(
    AuthContext.Provider,
    { value: { user, profile, loading, refreshProfile } },
    children
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
