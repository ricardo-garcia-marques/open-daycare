import Link from "next/link";
import { Sidebar } from "./(components)/sidebar";
import { FEED_POSTS, POST_TYPE_LABELS } from "@/lib/mock-feed";

function HeartIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="#E0654A"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function PhotoPlaceholderIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
    </svg>
  );
}

function MegaphoneIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}

const BADGE_STYLES = {
  achievement: "bg-badge-achievement-bg text-badge-achievement",
  activity: "bg-badge-activity-bg text-badge-activity",
  announcement: "bg-badge-announcement-bg text-badge-announcement",
} as const;

function PostCard({ post }: { post: (typeof FEED_POSTS)[number] }) {
  const isAnnouncement = post.type === "announcement";

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
          className={`flex items-center gap-[7px] px-3 py-1.5 rounded-full text-[12px] font-extrabold tracking-[0.5px] ${BADGE_STYLES[post.type]}`}
        >
          <span className="w-2 h-2 rounded-full bg-current" />
          {POST_TYPE_LABELS[post.type]}
        </div>
      </div>

      <div className="text-[12.5px] text-muted-light mb-2.5">
        Para: {post.addressedTo}
      </div>
      <p className="text-[15.5px] leading-[1.55] text-body m-0">{post.text}</p>

      {post.photoPlaceholder && (
        <Link
          href="#"
          className="flex flex-col items-center justify-center gap-2 mt-[14px] border-[1.5px] border-dashed border-photo-border rounded-[16px] bg-surface-alt h-[200px] text-photo-text"
        >
          <PhotoPlaceholderIcon />
          <span className="text-[13.5px]">{post.photoPlaceholder.alt}</span>
        </Link>
      )}

      <div className="flex items-center gap-[18px] mt-4 pt-[14px] border-t border-border-soft">
        <span className="flex items-center gap-[7px] text-like font-bold text-[14px]">
          <HeartIcon />
          {post.likes}
        </span>
        <Link
          href="#"
          className="flex items-center gap-[7px] text-muted font-bold text-[14px]"
        >
          <CommentIcon />
          {post.comments}
        </Link>
        <span className="flex-1" />
        <Link
          href="/crear-publicacion"
          className="text-primary-strong font-extrabold text-[14px]"
        >
          Editar
        </Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen bg-page-bg">
      <Sidebar />

      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="max-w-[760px] w-full mx-auto px-10 pt-[34px] pb-20">
          <div className="mb-6">
            <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-primary mb-1">
              GUARDERÍA · SALA SOLES
            </div>
            <h1 className="font-display font-semibold text-[30px] m-0 text-heading">
              Buenas, Caro
            </h1>
            <p className="mt-[5px] mb-0 text-muted text-[14.5px]">
              12 niños · martes 17 jun
            </p>
          </div>

          <Link
            href="/crear-publicacion"
            className="flex items-center gap-[14px] bg-surface border border-border rounded-[18px] px-[18px] py-[14px] mb-6 shadow-[0_4px_14px_-10px_rgba(120,90,60,0.4)]"
          >
            <div className="w-10 h-10 rounded-full bg-accent text-white font-display font-semibold text-[16px] flex items-center justify-center flex-none">
              C
            </div>
            <span className="flex-1 text-muted-light text-[15px]">
              Compartí un momento…
            </span>
            <span className="w-[38px] h-[38px] rounded-[12px] bg-nav-active-bg text-like flex items-center justify-center">
              <CameraIcon />
            </span>
          </Link>

          <div className="flex items-center gap-[14px] mb-[14px]">
            <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-label">
              PUBLICADO HOY
            </span>
            <span className="flex-1 h-px bg-divider" />
          </div>

          <div className="flex flex-col gap-4">
            {FEED_POSTS.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
