"use client";

import { useCallback } from "react";

import { COPY } from "@/lib/copy";
import { useCopyToClipboard } from "@/lib/hooks";

/**
 * Share + cite affordances for pages whose URL is the artifact — dossiers
 * now, compare results next. Client component so it can reach the Web Share
 * API and the clipboard; everything it copies is derived from
 * `window.location` at click time, so no route needs to thread its own URL.
 *
 * The label swap ("Share" → "Link copied") is the whole confirmation — no
 * toast, matching the quiet register of the dossier pages.
 */

const ACTION_CLASS =
  "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border bg-transparent " +
  "font-body text-[13px] cursor-pointer transition-colors duration-200 " +
  "hover:border-(--accent) hover:text-(--accent)";

function actionStateClass(active: boolean): string {
  return active
    ? `${ACTION_CLASS} border-(--accent) text-(--accent)`
    : `${ACTION_CLASS} border-(--border) text-(--text-secondary)`;
}

export function ShareButton({ title }: { title?: string }) {
  const { copied, copy } = useCopyToClipboard();

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: title ?? document.title, url });
        return;
      } catch (err) {
        // The user closing the share sheet is a decision, not a failure —
        // don't follow it with a surprise clipboard write.
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    await copy(url);
  }, [title, copy]);

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={COPY.share.shareAria}
      className={actionStateClass(copied)}
    >
      <span aria-hidden>⤴</span>
      <span aria-live="polite">
        {copied ? COPY.share.shared : COPY.share.share}
      </span>
    </button>
  );
}

export function CiteButton({
  entry,
  sources = [],
}: {
  /** The works-cited entry title, e.g. "Maria Cantwell (D-WA) — Politician dossier". */
  entry: string;
  /** Names of the public records behind the page, e.g. ["Congress.gov", "OpenSecrets"]. */
  sources?: string[];
}) {
  const { copied, copy } = useCopyToClipboard();

  const handleCite = useCallback(async () => {
    const address = `${window.location.host}${window.location.pathname}`;
    const accessed = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    await copy(COPY.share.citation(entry, address, accessed, sources));
  }, [entry, sources, copy]);

  return (
    <button
      type="button"
      onClick={handleCite}
      aria-label={COPY.share.citeAria}
      className={actionStateClass(copied)}
    >
      <span aria-hidden>❝</span>
      <span aria-live="polite">
        {copied ? COPY.share.cited : COPY.share.cite}
      </span>
    </button>
  );
}

/** The standard dossier action row: Share + Cite, under the headline. */
export default function ShareActions({
  citeEntry,
  citeSources,
}: {
  citeEntry: string;
  citeSources?: string[];
}) {
  return (
    <div className="flex items-center gap-2.5 mt-6">
      <ShareButton />
      <CiteButton entry={citeEntry} sources={citeSources} />
    </div>
  );
}
