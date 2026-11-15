import { cookies } from "next/headers";
import { connection } from "next/server";
import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import { kidsAvatarColors } from "@/lib/kid-presenters";
import type { PostType } from "@/lib/mock-feed";

export interface FeedPostRow {
  id: string;
  authorName: string;
  authorInitial: string;
  avatarBgColor: string;
  avatarTextColor: string;
  type: PostType;
  addressedTo: string;
  text: string;
  createdAt: string;
  time: string;
  photoUrls: string[];
  likes: number;
  comments: number;
}

type PostQueryRow = {
  id: string;
  type: PostType;
  description: string;
  whole_room: boolean;
  photos: string[] | null;
  created_at: string;
  users: { full_name: string | null } | null;
  post_recipients:
    | Array<{ children: { full_name: string } | null } | null>
    | null;
};

const POST_COLUMNS =
  "id, type, description, whole_room, photos, created_at, " +
  "users:users!posts_author_id_fkey(full_name), " +
  "post_recipients(children(full_name))";

const PHOTO_URL_TTL_SECONDS = 60 * 60;

function formatTime(createdAt: string): string {
  const date = new Date(createdAt);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function buildAddressedTo(wholeRoom: boolean, firstNames: string[]): string {
  if (wholeRoom || firstNames.length === 0) {
    return "toda la sala";
  }
  if (firstNames.length === 1) {
    return `familia de ${firstNames[0]}`;
  }
  return `familias de ${firstNames.join(", ")}`;
}

async function signPhotoUrls(
  supabase: ReturnType<typeof createClient>,
  paths: string[]
): Promise<string[]> {
  const results = await Promise.all(
    paths.map(async (path) => {
      const { data } = await supabase.storage
        .from("post-images")
        .createSignedUrl(path, PHOTO_URL_TTL_SECONDS);
      return data?.signedUrl ?? null;
    })
  );
  return results.filter((url): url is string => url !== null);
}

export const fetchFeedPosts = cache(async (): Promise<FeedPostRow[]> => {
  await connection();
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(`Failed to fetch feed posts: ${error.message}`);
  }
  const rows = (data ?? []) as unknown as PostQueryRow[];
  return Promise.all(
    rows.map(async (row) => {
      const authorName = row.users?.full_name ?? "Anónimo";
      const firstNames = (row.post_recipients ?? [])
        .map((recipient) => recipient?.children?.full_name ?? null)
        .filter((name): name is string => Boolean(name))
        .map((name) => name.split(" ")[0]);
      const colors = kidsAvatarColors(authorName);
      return {
        id: row.id,
        authorName,
        authorInitial: authorName.trim().charAt(0).toUpperCase(),
        ...colors,
        type: row.type,
        addressedTo: buildAddressedTo(row.whole_room, firstNames),
        text: row.description,
        createdAt: row.created_at,
        time: formatTime(row.created_at),
        photoUrls: await signPhotoUrls(supabase, row.photos ?? []),
        likes: 0,
        comments: 0,
      };
    })
  );
});
