"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useKidOptions } from "@/lib/use-kid-options";
import { useCurrentUser } from "@/lib/user-store";
import { kidsAvatarColors } from "@/lib/kid-presenters";
import { createClient } from "@/utils/supabase/client";
import { CreatePostModal, type CreatePostPayload } from "./create-post-modal";
import { prependFeedPost } from "./feed-posts-updater";

type CreatePostContextValue = {
  openCreatePost: () => void;
};

const CreatePostContext = createContext<CreatePostContextValue | null>(null);

const POST_IMAGES_BUCKET = "post-images";

function buildAddressedTo(
  kidsById: Map<string, string>,
  payload: CreatePostPayload
): string {
  if (payload.wholeRoom) {
    return "toda la sala";
  }
  const firstNames = payload.selectedKidIds
    .map((kidId) => kidsById.get(kidId))
    .filter((name): name is string => Boolean(name))
    .map((name) => name.split(" ")[0]);
  if (firstNames.length === 1) {
    return `familia de ${firstNames[0]}`;
  }
  return `familias de ${firstNames.join(", ")}`;
}

function getPhotoPathExtension(file: File): string {
  const extension = file.name.includes(".")
    ? file.name.split(".").pop()!
    : "jpg";
  return extension.toLowerCase();
}

function formatClock(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

async function runPublishFlow(
  kids: ReturnType<typeof useKidOptions>,
  userId: string,
  authorName: string,
  payload: CreatePostPayload
): Promise<void> {
  const supabase = createClient();
  const postId = crypto.randomUUID();
  const kidsById = new Map(kids.map((kid) => [kid.id, kid.name]));

  const { error: insertError } = await supabase
    .from("posts")
    .insert({
      id: postId,
      author_id: userId,
      type: payload.type,
      description: payload.description,
      whole_room: payload.wholeRoom,
    });
  if (insertError) {
    throw new Error(insertError.message);
  }

  if (!payload.wholeRoom && payload.selectedKidIds.length > 0) {
    const { error: recipientsError } = await supabase
      .from("post_recipients")
      .insert(
        payload.selectedKidIds.map((childId) => ({
          post_id: postId,
          child_id: childId,
        }))
      );
    if (recipientsError) {
      await supabase.from("posts").delete().eq("id", postId);
      throw new Error(recipientsError.message);
    }
  }

  const photos: string[] = [];
  const sessionPhotoUrls: string[] = [];
  try {
    for (const file of payload.photoFiles) {
      const extension = getPhotoPathExtension(file);
      const path = `${postId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from(POST_IMAGES_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (uploadError) {
        throw new Error(uploadError.message);
      }
      photos.push(path);
      sessionPhotoUrls.push(URL.createObjectURL(file));
    }
  } catch (uploadFailure) {
    if (photos.length > 0) {
      await supabase.storage.from(POST_IMAGES_BUCKET).remove(photos);
    }
    await supabase.from("posts").delete().eq("id", postId);
    throw uploadFailure;
  }

  if (photos.length > 0) {
    const { error: updateError } = await supabase
      .from("posts")
      .update({ photos })
      .eq("id", postId);
    if (updateError) {
      await supabase.storage.from(POST_IMAGES_BUCKET).remove(photos);
      await supabase.from("posts").delete().eq("id", postId);
      throw new Error(updateError.message);
    }
  }

  prependFeedPost({
    id: postId,
    authorName,
    authorInitial: authorName.trim().charAt(0).toUpperCase(),
    ...kidsAvatarColors(authorName),
    type: payload.type,
    addressedTo: buildAddressedTo(kidsById, payload),
    text: payload.description,
    time: formatClock(),
    photoUrls: sessionPhotoUrls,
    likes: 0,
    comments: 0,
  });
}

export function CreatePostProvider({ children }: { children: ReactNode }) {
  const kids = useKidOptions();
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreatePost = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  const handleSubmit = useCallback(
    async (payload: CreatePostPayload) => {
      if (user.status !== "ready") {
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        await runPublishFlow(kids, user.userId, user.fullName, payload);
        setOpen(false);
      } catch {
        setError("No se pudo publicar. Intentá de nuevo.");
      } finally {
        setSubmitting(false);
      }
    },
    [kids, user]
  );

  const value = useMemo(() => ({ openCreatePost }), [openCreatePost]);

  return (
    <CreatePostContext.Provider value={value}>
      {children}
      {open && (
        <CreatePostModal
          onClose={close}
          onSubmit={handleSubmit}
          submitting={submitting}
          error={error}
        />
      )}
    </CreatePostContext.Provider>
  );
}

export function useCreatePost(): CreatePostContextValue {
  const context = useContext(CreatePostContext);
  if (!context) {
    throw new Error("useCreatePost must be used within CreatePostProvider");
  }
  return context;
}
