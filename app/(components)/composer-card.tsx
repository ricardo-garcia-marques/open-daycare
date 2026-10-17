"use client";

import { useCreatePost } from "./create-post-provider";
import { ComposerTrigger } from "./composer-trigger";

export function ComposerCard() {
  const { openCreatePost } = useCreatePost();
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
