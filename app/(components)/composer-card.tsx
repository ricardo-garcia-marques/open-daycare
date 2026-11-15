"use client";

import { useCreatePost } from "./create-post-provider";
import { useCurrentUser } from "@/lib/user-store";
import { ComposerTrigger } from "./composer-trigger";

export function ComposerCard() {
  const { openCreatePost } = useCreatePost();
  const user = useCurrentUser();
  const canCreatePosts =
    user.status === "ready" && (user.role === "staff" || user.role === "admin");
  if (!canCreatePosts) {
    return null;
  }
  return (
    <button
      type="button"
      onClick={openCreatePost}
      className="block w-full cursor-pointer text-left"
    >
      <ComposerTrigger />
    </button>
  );
}
