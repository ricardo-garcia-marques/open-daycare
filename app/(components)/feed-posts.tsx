"use client";

import { PhotoPlaceholderIcon } from "./photo-placeholder-icon";
import { usePostsStore, type StoredPost } from "@/lib/posts-store";
import {
  POST_TYPE_BADGE_COLORS,
  POST_TYPE_LABELS,
  type FeedPost,
} from "@/lib/mock-feed";
import { MegaphoneIcon } from "./megaphone-icon";
import { HeartIcon, CommentIcon } from "./feed-icons";

export function FeedPosts() {
  const { posts } = usePostsStore();
  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

function PostCard({ post }: { post: StoredPost }) {
  const isAnnouncement = post.type === "announcement";
  const badgeColors = POST_TYPE_BADGE_COLORS[post.type];
  const sessionPhotoUrl = post.photoUrls?.[0];
  const persistedPhotoCount = post.photoCount ?? 0;

  return (
    <div className="bg-surface border border-border rounded-[20px] px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,0.5)]">
      <div className="flex items-center gap-3 mb-[14px]">
        {isAnnouncement ? (
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center flex-none"
            style={{
              background: post.avatarBgColor,
              color: post.avatarTextColor,
            }}
          >
            <MegaphoneIcon />
          </div>
        ) : (
          <div
            className="w-11 h-11 rounded-full font-display font-semibold text-[17px] flex items-center justify-center flex-none"
            style={{
              background: post.avatarBgColor,
              color: post.avatarTextColor,
            }}
          >
            {post.authorInitial}
          </div>
        )}
        <div className="flex-1">
          <div className="font-display font-semibold text-[16.5px] text-heading">
            {post.authorName}
          </div>
          <div className="text-[12.5px] text-muted-light">
            {post.time} · publicado por vos
          </div>
        </div>
        <div
          className="flex items-center gap-[7px] px-3 py-1.5 rounded-full text-[12px] font-extrabold tracking-[0.5px]"
          style={{
            backgroundColor: badgeColors.bg,
            color: badgeColors.text,
          }}
        >
          <span className="w-2 h-2 rounded-full bg-current" />
          {POST_TYPE_LABELS[post.type]}
        </div>
      </div>

      <div className="text-[12.5px] text-muted-light mb-2.5">
        Para: {post.addressedTo}
      </div>
      <p className="text-[15.5px] leading-[1.55] text-body m-0">{post.text}</p>

      {sessionPhotoUrl ? (
        <div className="flex flex-wrap gap-3 mt-[14px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sessionPhotoUrl}
            alt="Foto de la publicación"
            className="h-[200px] w-auto max-w-full rounded-[16px] border border-border object-cover"
          />
        </div>
      ) : persistedPhotoCount > 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 mt-[14px] border-[1.5px] border-dashed border-photo-border rounded-[16px] bg-surface-alt h-[200px] text-photo-text">
          <PhotoPlaceholderIcon />
          <span className="text-[13.5px]">
            {persistedPhotoCount} {persistedPhotoCount === 1 ? "foto" : "fotos"}
          </span>
        </div>
      ) : null}

      <div className="flex items-center gap-[18px] mt-4 pt-[14px] border-t border-border-soft">
        <span className="flex items-center gap-[7px] text-like font-bold text-[14px]">
          <HeartIcon />
          {post.likes}
        </span>
        <span className="flex items-center gap-[7px] text-muted font-bold text-[14px]">
          <CommentIcon />
          {post.comments}
        </span>
      </div>
    </div>
  );
}

export type { FeedPost };
