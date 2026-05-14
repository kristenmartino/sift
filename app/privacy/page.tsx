import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <main
      id="main-content"
      className="min-h-screen px-6 py-16"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <div className="max-w-[640px] mx-auto">
        <Link
          href="/"
          className="text-xs text-[var(--text-muted)] no-underline hover:text-[var(--text-secondary)] transition-colors mb-8 inline-block"
        >
          &larr; Back to Sift
        </Link>
        <h1 className="font-heading text-3xl font-bold mb-6">Privacy Policy</h1>

        <div className="space-y-6 text-sm leading-relaxed text-[var(--text-secondary)]">
          <section>
            <h2 className="font-heading text-lg font-bold text-[var(--text)] mb-2">What we collect</h2>
            <p>
              If you sign in with Clerk, we store your user ID and bookmarks so they sync across devices.
              We don&apos;t sell, share, or monetize your data. If you don&apos;t sign in, bookmarks and
              preferences stay in your browser&apos;s local storage.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[var(--text)] mb-2">Cookies and storage</h2>
            <p>
              Sift uses local storage for theme preference, bookmarks, and custom topics.
              Clerk may use cookies for session management when you sign in. We don&apos;t use
              analytics or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[var(--text)] mb-2">Third-party services</h2>
            <p>
              Sift uses Clerk for authentication and Anthropic&apos;s Claude for AI features. Article
              content is sourced from publicly available RSS feeds. Each article links to the
              original source.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[var(--text)] mb-2">Search analytics</h2>
            <p>
              When you use Sift&apos;s topic search, we log the query text along with anonymous
              technical metadata (per-stage latency, result counts, fallback usage, a coarse
              user-agent class like &quot;mobile&quot; or &quot;desktop&quot;). Your IP address is
              <em> never stored in raw form</em> &mdash; it&apos;s hashed with HMAC-SHA256 and a
              server-side secret before we write it. Search-query logs are retained for{" "}
              <strong>90 days</strong>, then deleted. We use these logs to understand what people
              actually search for so we can improve the feature; we don&apos;t share them with
              anyone outside Sift.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[var(--text)] mb-2">Your rights</h2>
            <p>
              You can delete your account and all associated data by contacting us. Local storage
              data can be cleared through your browser settings at any time.
            </p>
          </section>
        </div>

        <p className="text-xs text-[var(--text-muted)] mt-10">
          Last updated: May 2026
        </p>
      </div>
    </main>
  );
}
