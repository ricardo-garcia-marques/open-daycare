"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/utils/supabase/client";

export type CurrentUserRole = "staff" | "parent" | "admin";

export type CurrentUser =
  | { status: "loading" }
  | { status: "anonymous" }
  | {
      status: "ready";
      userId: string;
      fullName: string;
      initial: string;
      role: CurrentUserRole;
    };

type UserContextValue = {
  user: CurrentUser;
};

const UserContext = createContext<UserContextValue | null>(null);

function deriveInitial(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return "?";
  }
  return trimmed.charAt(0).toUpperCase();
}

function normalizeRole(rawRole: string | null | undefined): CurrentUserRole {
  if (rawRole === "parent" || rawRole === "admin") {
    return rawRole;
  }
  return "staff";
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    let loadGeneration = 0;

    async function loadCurrentUser() {
      const generation = ++loadGeneration;
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      if (cancelled || generation !== loadGeneration) {
        return;
      }
      if (error || !data.user) {
        setUser({ status: "anonymous" });
        return;
      }
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("full_name, role")
        .eq("id", data.user.id)
        .single();
      if (cancelled || generation !== loadGeneration) {
        return;
      }
      if (profileError || !profile) {
        setUser({ status: "anonymous" });
        return;
      }
      const fullName = profile.full_name ?? "";
      setUser({
        status: "ready",
        userId: data.user.id,
        fullName,
        initial: deriveInitial(fullName),
        role: normalizeRole(profile.role),
      });
    }

    // Re-run on every auth change (login, logout, user switch within the
    // same client session): the root layout keeps this provider mounted
    // across client-side navigations, so a mount-only fetch goes stale.
    // The callback must stay sync and free of auth calls besides the
    // deferred load — supabase-js fires it synchronously inside
    // signInWithPassword/signOut, and re-entering the client there can
    // deadlock the login promise, hanging the form on "Iniciando sesión…".
    const {
      data: { subscription },
    } = createClient().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        setUser({ status: "loading" });
        queueMicrotask(() => {
          if (!cancelled) {
            loadCurrentUser();
          }
        });
      }
    });
    loadCurrentUser();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ user }), [user]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useCurrentUser(): CurrentUser {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useCurrentUser must be used within UserProvider");
  }
  return context.user;
}
