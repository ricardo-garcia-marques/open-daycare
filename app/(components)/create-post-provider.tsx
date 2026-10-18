"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useKidsStore } from "@/lib/kids-store";
import { usePostsStore } from "@/lib/posts-store";
import { useCurrentUser } from "@/lib/user-store";
import { CreatePostModal, type CreatePostPayload } from "./create-post-modal";

type CreatePostContextValue = {
  openCreatePost: () => void;
};

const CreatePostContext = createContext<CreatePostContextValue | null>(null);

function formatClock(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

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

export function CreatePostProvider({ children }: { children: ReactNode }) {
  const { kids } = useKidsStore();
  const { addPost } = usePostsStore();
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);

  const openCreatePost = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  const handleSubmit = useCallback(
    (payload: CreatePostPayload) => {
      const kidsById = new Map(kids.map((kid) => [kid.id, kid.name]));
      const authorName = user.status === "ready" ? user.fullName : "Anónimo";
      const authorInitial =
        user.status === "ready" ? user.initial : authorName.charAt(0).toUpperCase();
      addPost({
        authorInitial,
        avatarBgColor: "#F2937A",
        avatarTextColor: "#FFFFFF",
        authorName,
        time: formatClock(),
        type: payload.type,
        addressedTo: buildAddressedTo(kidsById, payload),
        text: payload.description,
        likes: 0,
        comments: 0,
        photoUrls: payload.photos.length > 0 ? payload.photos : undefined,
        photoCount: payload.photos.length > 0 ? payload.photos.length : undefined,
      });
      setOpen(false);
    },
    [kids, addPost, user]
  );

  const value = useMemo(() => ({ openCreatePost }), [openCreatePost]);

  return (
    <CreatePostContext.Provider value={value}>
      {children}
      {open && <CreatePostModal onClose={close} onSubmit={handleSubmit} />}
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
