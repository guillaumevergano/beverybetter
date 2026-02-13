"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, TeamRole } from "@/types";
import type { User } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import React from "react";

interface TeamInfo {
  id: string;
  name: string;
  invite_code: string;
  role: TeamRole;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  team: TeamInfo | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  refreshTeam: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  team: null,
  loading: true,
  refreshProfile: async () => {},
  refreshTeam: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User | null;
  initialProfile?: Profile | null;
  initialTeam?: TeamInfo | null;
}

export function AuthProvider({ children, initialUser, initialProfile, initialTeam }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [profile, setProfile] = useState<Profile | null>(initialProfile ?? null);
  const [team, setTeam] = useState<TeamInfo | null>(initialTeam ?? null);
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
        setTeam(null);
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

  const refreshTeam = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      setTeam(null);
      return;
    }

    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id, role")
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (!membership) {
      setTeam(null);
      return;
    }

    const { data: teamData } = await supabase
      .from("teams")
      .select("id, name, invite_code")
      .eq("id", membership.team_id)
      .single();

    if (teamData) {
      setTeam({
        id: teamData.id,
        name: teamData.name,
        invite_code: teamData.invite_code,
        role: membership.role as TeamRole,
      });
    }
  }, []);

  return React.createElement(
    AuthContext.Provider,
    { value: { user, profile, team, loading, refreshProfile, refreshTeam } },
    children
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
