import Link from "next/link";
import { COPY } from "@/lib/copy";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
};

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-5"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <div className="text-center max-w-[400px]">
        <div
          className="text-[80px] leading-none mb-6 text-[var(--accent)]"
          style={{ opacity: 0.15 }}
        >
          &#x25C6;
        </div>
        <p className="font-heading text-xl font-bold text-[var(--text-secondary)] mb-2">
          {COPY.notFound.title}
        </p>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">
          {COPY.notFound.body}
        </p>
        <Link
          href="/"
          className="inline-block bg-[var(--accent)] text-white px-7 py-2.5 rounded-full text-sm font-semibold font-body hover:opacity-90 transition-opacity no-underline"
        >
          {COPY.notFound.button}
        </Link>
      </div>
    </div>
  );
}
