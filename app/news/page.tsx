import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import NewsAggregator from "@/components/NewsAggregator";
import AuthButtons from "@/components/AuthButtons";

export const metadata: Metadata = {
  title: "News",
  description:
    "AI-curated news summaries across technology, business, science, energy, world, and health.",
};

const clerkPk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const clerkEnabled = !!clerkPk && clerkPk.startsWith("pk_");

function NewsLoading() {
  return (
    <div
      className="min-h-screen font-body"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <header
        className="sticky top-0 z-50 border-b border-(--border)"
        style={{ background: "var(--nav-bg)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-3.5 h-14" />
      </header>
      <main id="main-content" className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 pt-7 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4 sm:gap-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`bg-(--card-bg) rounded-[14px] overflow-hidden border border-(--border) ${i === 0 ? "col-span-full" : ""}`}
            >
              <div className={`bg-(--skeleton) animate-shimmer ${i === 0 ? "h-[200px]" : "h-[140px]"}`} />
              <div className="p-5 space-y-3">
                <div className="h-3 w-[30%] bg-(--skeleton) rounded-md animate-shimmer" />
                <div className="h-4 w-[90%] bg-(--skeleton) rounded-md animate-shimmer" />
                <div className="h-4 w-[70%] bg-(--skeleton) rounded-md animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default async function NewsPage() {
  const userId = clerkEnabled ? (await auth()).userId ?? null : null;

  return (
    <Suspense fallback={<NewsLoading />}>
      <NewsAggregator userId={userId} authSlot={<AuthButtons />} />
    </Suspense>
  );
}
