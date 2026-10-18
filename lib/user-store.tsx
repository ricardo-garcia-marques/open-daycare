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

    async function loadCurrentUser() {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      if (cancelled) {
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
      if (cancelled) {
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

    loadCurrentUser();

    return () => {
      cancelled = true;
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
