import type { PostType } from "@/lib/mock-feed";

export interface FeedPostView {
  id: string;
  authorName: string;
  authorInitial: string;
  avatarBgColor: string;
  avatarTextColor: string;
  type: PostType;
  addressedTo: string;
  text: string;
  time: string;
  photoUrls: string[];
  likes: number;
  comments: number;
}

export type FeedPostsUpdater = {
  prepend: (post: FeedPostView) => void;
};

let currentUpdater: FeedPostsUpdater | null = null;

export function setFeedPostsUpdater(updater: FeedPostsUpdater | null): void {
  currentUpdater = updater;
}

export function prependFeedPost(post: FeedPostView): void {
  currentUpdater?.prepend(post);
}
