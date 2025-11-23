// components/AuthProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const s = data.session;
      if (!mounted) return;
      setSession(s ?? null);
      setUser(s?.user ?? null);

      if (s?.user?.id) {
        const { data: p } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", s.user.id)
          .single();
        setProfile(p ?? null);
      }
      setLoading(false);
    })();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession ?? null);
        setUser(newSession?.user ?? null);

        if (newSession?.user?.id) {
          const { data: p } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", newSession.user.id)
            .single();
          setProfile(p ?? null);
        } else {
          setProfile(null);
        }
      }
    );

    // subscribe to profiles (RLS will filter what client can see)
    const channel = supabase
      .channel("realtime-profiles")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload: any) => {
          const newRow = payload.new ?? payload.record;
          const oldRow = payload.old ?? payload.old_record;

          if (newRow && newRow.id === user?.id) setProfile(newRow);
          if (payload.eventType === "DELETE" && oldRow?.id === user?.id)
            setProfile(null);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      try {
        authListener?.subscription?.unsubscribe?.();
      } catch {}
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
