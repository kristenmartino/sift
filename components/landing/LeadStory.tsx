import Link from "next/link";
import { COPY } from "@/lib/copy";
import ReadingSummary from "@/components/ReadingSummary";
import { articleContentLabel } from "@/lib/articlePresentation";
import SlDiamond from "./SlDiamond";
import type { Article } from "@/lib/types";

const CARD = COPY.landingReskin.card;

/**
 * The hero's footnoted story card, rendered from the LIVE lead story
 * (app/page.tsx → getTopStoryForLanding, ISR). Civic context is shown only
 * where the real data exists:
 *   - primer.background  → the "what you should know first" block
 *   - primer.terms[]     → the numbered footnotes
 *   - outlet.allSides/mbfc → the AllSides / MBFC chips
 * When a field is absent we omit that affordance — never fabricate a primer,
 * a footnote, or a rating on the homepage. Falls back to LeadFallback on a
 * DB miss so the page still renders (graceful degradation).
 */
export default function LeadStory({ article }: { article: Article | null }) {
  if (!article) return <LeadFallback />;

  const primer = article.contextPrimer ?? null;
  const background = primer?.background?.trim() || "";
  // Cap footnotes so the hero card stays a preview, not a wall of text.
  const terms = (primer?.terms ?? []).slice(0, 2);
  const typeLabel = articleContentLabel(article);
  const published = article.publishedDate ? new Date(article.publishedDate) : null;
  const publishedLabel = published && Number.isFinite(published.getTime()) ? published.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : null;
  const hasCivic = Boolean(background || terms.length);

  return (
    <div className="sl-card">
      <div className="sl-card-bar">
        <SlDiamond />
        {CARD.barLabel}
        {hasCivic && <span className="sl-badge">{CARD.badge}</span>}
      </div>

      <div className="sl-card-body">
        <div className="sl-chip-row">
          <span className="sl-chip sl-src">{article.sourceName}</span>
          {typeLabel && <span className="sl-chip">{typeLabel}</span>}
          <span className="sl-chip">{publishedLabel ? `Published ${publishedLabel}` : "Publication date unavailable"}</span>
        </div>

        {article.sourceUrl ? (
          <a
            href={article.sourceUrl}
              data-sift-source-id={article.id}
              data-sift-source-surface="landing"
            target="_blank"
            rel="noopener noreferrer"
            className="sl-lead-link"
          >
            <h3 className="sl-lead">{article.title}</h3>
          </a>
        ) : (
          <h3 className="sl-lead">{article.title}</h3>
        )}

        <ReadingSummary summary={article.summary} previewChars={200} className="my-4" />
        {background && <details className="sl-primer" open>
          <summary className="sl-label cursor-pointer">{CARD.primerLabel}</summary>
          <p>{background}</p>
        </details>}

        {terms.length > 0 && (
          <div className="sl-notes">
            {terms.map((t, i) => (
              <div className="sl-note" key={t.term}>
                <span className="sl-m" aria-hidden>
                  {i + 1}
                </span>
                <span>
                  <b>{t.term}</b> — {t.definition}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-[13px]">
          {article.sourceUrl && <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" data-sift-source-id={article.id} className="text-(--accent) hover:underline">Read original ↗</a>}
          {article.outlet && <Link href={`/outlet/${article.outlet.slug}`} className="text-(--accent) hover:underline">About {article.sourceName} →</Link>}
        </div>
      </div>
    </div>
  );
}

function LeadFallback() {
  return (
    <div className="sl-card">
      <div className="sl-card-bar">
        <SlDiamond />
        {CARD.barLabel}
      </div>
      <div className="sl-card-body">
        <div className="sl-chip-row">
          <span className="sl-chip sl-src">Sift</span>
        </div>
        <h3 className="sl-lead">{COPY.landing.leadFallbackTitle}</h3>
        <p className="sl-card-summary">{COPY.landing.leadFallbackBody}</p>
        <div style={{ marginTop: 16 }}>
          <Link href="/news" className="sl-btn sl-btn-ghost">
            {COPY.landing.feedCta}{" "}
            <span className="sl-arrow" aria-hidden>
              →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
