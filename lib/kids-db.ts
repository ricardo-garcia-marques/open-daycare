import { cookies } from "next/headers";
import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import { calculateAgeInYears, kidsAvatarColors } from "@/lib/kid-presenters";

export type Room = {
  id: string;
  name: string;
};

export type KidListItem = {
  id: string;
  name: string;
  ageInYears: number;
  initial: string;
  avatarBgColor: string;
  avatarTextColor: string;
  allergies: string[];
  linkedParents: never[];
};

export type KidDetail = KidListItem & {
  birthDate: string;
  enrolledAt: string;
  room: string;
  allergyNote: string;
};

const kidColumns =
  "id, room_id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, rooms(name)";

type ChildRow = {
  id: string;
  room_id: string | null;
  full_name: string;
  birth_date: string;
  enrolled_at: string;
  medical_notes: string;
  allergy_tags: string[] | null;
  rooms: { name: string } | null;
};

function toListItem(row: ChildRow): KidListItem {
  const colors = kidsAvatarColors(row.full_name);
  return {
    id: row.id,
    name: row.full_name,
    ageInYears: calculateAgeInYears(row.birth_date),
    initial: row.full_name.trim().charAt(0).toUpperCase(),
    ...colors,
    allergies: row.allergy_tags ?? [],
    linkedParents: [],
  };
}

export const listKids = cache(async (): Promise<KidListItem[]> => {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase
    .from("children")
    .select(kidColumns)
    .order("full_name", { ascending: true });
  if (error) {
    throw new Error(`Failed to list children: ${error.message}`);
  }
  return (data as unknown as ChildRow[]).map(toListItem);
});

export async function getKidById(id: string): Promise<KidDetail | null> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase
    .from("children")
    .select(kidColumns)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load child ${id}: ${error.message}`);
  }
  if (!data) {
    return null;
  }
  const row = data as unknown as ChildRow;
  return {
    ...toListItem(row),
    birthDate: row.birth_date,
    enrolledAt: row.enrolled_at,
    room: row.rooms?.name ?? "Sin sala",
    allergyNote: row.medical_notes,
  };
}

export const listRooms = cache(async (): Promise<Room[]> => {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase
    .from("rooms")
    .select("id, name")
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error(`Failed to list rooms: ${error.message}`);
  }
  return data as Room[];
});
