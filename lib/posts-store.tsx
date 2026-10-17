"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { FEED_POSTS, type FeedPost } from "@/lib/mock-feed";

const STORAGE_KEY = "opendaycare:posts:v1";

export interface StoredPost extends FeedPost {
  photoUrls?: string[];
  photoCount?: number;
}

type PostsStoreValue = {
  posts: StoredPost[];
  hydrated: boolean;
  addPost: (post: Omit<StoredPost, "id">) => void;
};

let storeSnapshot: { posts: StoredPost[]; hydrated: boolean } = {
  posts: FEED_POSTS,
  hydrated: false,
};

const storeListeners = new Set<() => void>();

function emitStoreChange(next: { posts: StoredPost[]; hydrated: boolean }) {
  storeSnapshot = next;
  for (const listener of storeListeners) {
    listener();
  }
}

function subscribeToStore(listener: () => void): () => void {
  storeListeners.add(listener);
  return () => storeListeners.delete(listener);
}

function getStoreSnapshot(): { posts: StoredPost[]; hydrated: boolean } {
  return storeSnapshot;
}

const SERVER_STORE_SNAPSHOT: { posts: StoredPost[]; hydrated: boolean } = {
  posts: FEED_POSTS,
  hydrated: false,
};

function getServerStoreSnapshot(): { posts: StoredPost[]; hydrated: boolean } {
  return SERVER_STORE_SNAPSHOT;
}

function readStoredPosts(): StoredPost[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredPost[]) : null;
  } catch {
    return null;
  }
}

function hydrateStore() {
  if (!storeSnapshot.hydrated) {
    emitStoreChange({ posts: readStoredPosts() ?? FEED_POSTS, hydrated: true });
  }
}

function persistPosts(posts: StoredPost[]) {
  try {
    const serializable = posts.map((post) => {
      if (!post.photoUrls) {
        return post;
      }
      const persisted: StoredPost = { ...post, photoUrls: undefined };
      return persisted;
    });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch {
    // localStorage unavailable: the posts list still updates in memory.
  }
}

const PostsStoreContext = createContext<PostsStoreValue | null>(null);

export function PostsStoreProvider({ children }: { children: ReactNode }) {
  const store = useSyncExternalStore(
    subscribeToStore,
    getStoreSnapshot,
    getServerStoreSnapshot
  );

  useEffect(() => {
    hydrateStore();
  }, []);

  const addPost = useCallback((post: Omit<StoredPost, "id">) => {
    const newPost: StoredPost = {
      ...post,
      id: `post-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    };
    const nextPosts = [newPost, ...storeSnapshot.posts];
    persistPosts(nextPosts);
    emitStoreChange({ posts: nextPosts, hydrated: true });
  }, []);

  const value = useMemo(
    () => ({ posts: store.posts, hydrated: store.hydrated, addPost }),
    [store, addPost]
  );

  return (
    <PostsStoreContext.Provider value={value}>
      {children}
    </PostsStoreContext.Provider>
  );
}

export function usePostsStore(): PostsStoreValue {
  const context = useContext(PostsStoreContext);
  if (!context) {
    throw new Error("usePostsStore must be used within PostsStoreProvider");
  }
  return context;
}
