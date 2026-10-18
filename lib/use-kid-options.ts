"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { kidsAvatarColors } from "@/lib/kid-presenters";

export type KidOption = {
  id: string;
  name: string;
  room: string;
  initial: string;
  avatarBgColor: string;
  avatarTextColor: string;
};

export function useKidOptions(): KidOption[] {
  const [kids, setKids] = useState<KidOption[]>([]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("children")
        .select("id, full_name, rooms(name)")
        .order("full_name", { ascending: true });
      if (cancelled) {
        return;
      }
      const rows =
        (data ?? []) as unknown as Array<{
          id: string;
          full_name: string;
          rooms: { name: string } | null;
        }>;
      setKids(
        rows.map((row) => ({
          id: row.id,
          name: row.full_name,
          room: row.rooms?.name ?? "Sin sala",
          initial: row.full_name.trim().charAt(0).toUpperCase(),
          ...kidsAvatarColors(row.full_name),
        }))
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return kids;
}
