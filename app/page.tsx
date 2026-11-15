import { Sidebar } from "./(components)/sidebar";
import { ComposerCard } from "./(components)/composer-card";
import { FeedPosts } from "./(components)/feed-posts";
import { FeedGreeting } from "./(components)/feed-greeting";
import { fetchFeedPosts } from "@/lib/posts-db";

export const instant = false;

export default async function HomePage() {
  const initialPosts = await fetchFeedPosts();
  return (
    <div className="flex min-h-screen bg-page-bg">
      <Sidebar />

      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="max-w-[760px] w-full mx-auto px-10 pt-[34px] pb-20">
          <div className="mb-6">
            <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-primary mb-1">
              GUARDERÍA · SALA SOLES
            </div>
            <FeedGreeting />
            <p className="mt-[5px] mb-0 text-muted text-[14.5px]">
              12 niños · martes 17 jun
            </p>
          </div>

          <ComposerCard />

          <div className="flex items-center gap-[14px] mb-[14px] mt-6">
            <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-label">
              PUBLICADO HOY
            </span>
            <span className="flex-1 h-px bg-divider" />
          </div>

          <FeedPosts initialPosts={initialPosts} />
        </div>
      </main>
    </div>
  );
}
