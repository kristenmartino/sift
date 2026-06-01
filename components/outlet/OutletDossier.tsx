import Link from "next/link";

import LandingMasthead from "@/components/landing/LandingMasthead";
import { LeanGlyph, FactualChip } from "@/components/primitives";
import {
  formatAllSidesLabel,
  formatFundingLabel,
  formatMbfcLabel,
} from "@/lib/outlet";
import { COPY } from "@/lib/copy";
import { timeAgo } from "@/lib/utils";
import type { Article, OutletProfile } from "@/lib/types";

interface OutletDossierProps {
  outlet: OutletProfile;
  recentArticles: Article[];
}

/**
 * Server-rendered outlet dossier. Mirrors the editorial visual register of
 * `app/colophon/page.tsx` — kicker eyebrows, hairline rules, mono labels,
 * Fraunces display type. Content is read-only from `outlet_profiles` plus a
 * recent-articles JOIN.
 *
 * The layout is intentionally one-column (max-w 800px). Outlet provenance
 * deserves a contemplative reading register, not a dashboard. Mobile is the
 * same layout, just narrower padding.
 */
export default function OutletDossier({
  outlet,
  recentArticles,
}: OutletDossierProps) {
  const allSidesLabel = formatAllSidesLabel(outlet.allSidesRating);
  const mbfcLabel = formatMbfcLabel(outlet.mbfcFactual);
  const fundingLabel = formatFundingLabel(outlet.fundingModel);

  // Combine top-line metadata for the lede line under the headline.
  const ledeBits: string[] = [];
  if (outlet.parentCompany) ledeBits.push(outlet.parentCompany);
  if (outlet.foundedYear) ledeBits.push(`Founded ${outlet.foundedYear}`);
  if (fundingLabel) ledeBits.push(fundingLabel);

  // Build the external-links list from the JSONB blob, in a stable order.
  const linkOrder: Array<keyof typeof COPY.dossier.externalLinkLabels> = [
    "wikipedia",
    "official",
    "ownership",
  ];
  const externalLinkEntries = linkOrder
    .map((key) => {
      const url = outlet.externalLinks[key];
      return url ? { key, url, label: COPY.dossier.externalLinkLabels[key] } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // Plus any extra external_links keys we haven't pre-labeled (forward-compat).
  for (const [key, url] of Object.entries(outlet.externalLinks)) {
    if (!linkOrder.includes(key as typeof linkOrder[number]) && url) {
      externalLinkEntries.push({
        key,
        url,
        label: COPY.dossier.externalLinkLabels[key] ?? key,
      });
    }
  }

  return (
    <div className="min-h-screen bg-(--surface-base) text-(--text-primary)">
      <LandingMasthead />

      <main
        id="main-content"
        className="max-w-[800px] mx-auto px-6 pt-12 pb-24"
      >
        {/* Eyebrow + headline */}
        <header className="mb-9">
          <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3 flex items-center">
            <span
              aria-hidden
              className="inline-block w-7 h-px bg-(--border) mr-3"
            />
            {COPY.dossier.eyebrow}
          </p>
          <h1 className="font-heading text-[36px] md:text-[44px] font-bold leading-[1.05] tracking-tight text-(--text-primary)">
            {outlet.name}
          </h1>
          {ledeBits.length > 0 && (
            <p className="font-body text-[16px] text-(--text-secondary) mt-3 max-w-[60ch] leading-relaxed">
              {ledeBits.join(" · ")}
            </p>
          )}
        </header>

        <hr className="border-0 border-t border-(--border) my-10" />

        {/* Ratings: AllSides + MBFC. Each rating cites its source with a date
            so the reader can verify and replicate; methodology page (Phase
            2.D) will document the curation cadence. */}
        {(allSidesLabel || mbfcLabel) && (
          <section className="mb-12 grid gap-8 md:grid-cols-2">
            {allSidesLabel && (
              <div>
                <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
                  {COPY.dossier.bias}
                </p>
                <p className="font-heading text-[26px] font-semibold text-(--text-primary) leading-tight mb-2">
                  {allSidesLabel}
                </p>
                <div className="mb-2.5">
                  <LeanGlyph rating={outlet.allSidesRating} />
                </div>
                <p className="font-body text-[12px] text-(--text-tertiary) leading-relaxed">
                  {outlet.allSidesUrl ? (
                    <a
                      href={outlet.allSidesUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-(--text-secondary) no-underline hover:underline hover:text-(--accent)"
                    >
                      {COPY.dossier.citation("AllSides", outlet.allSidesLastChecked)}{" "}
                      <span aria-hidden>↗</span>
                    </a>
                  ) : (
                    COPY.dossier.citation("AllSides", outlet.allSidesLastChecked)
                  )}
                </p>
              </div>
            )}
            {mbfcLabel && (
              <div>
                <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
                  {COPY.dossier.factual}
                </p>
                <p className="font-heading text-[26px] font-semibold text-(--text-primary) leading-tight mb-2">
                  {mbfcLabel}
                </p>
                <div className="mb-2.5">
                  <FactualChip rating={outlet.mbfcFactual} meterOnly />
                </div>
                <p className="font-body text-[12px] text-(--text-tertiary) leading-relaxed">
                  {outlet.mbfcUrl ? (
                    <a
                      href={outlet.mbfcUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-(--text-secondary) no-underline hover:underline hover:text-(--accent)"
                    >
                      {COPY.dossier.citation(
                        "Media Bias/Fact Check",
                        outlet.mbfcLastChecked,
                      )}{" "}
                      <span aria-hidden>↗</span>
                    </a>
                  ) : (
                    COPY.dossier.citation(
                      "Media Bias/Fact Check",
                      outlet.mbfcLastChecked,
                    )
                  )}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Ownership */}
        {(outlet.parentCompany || outlet.parentCompanyUrl) && (
          <section className="mb-10">
            <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
              {COPY.dossier.ownership}
            </p>
            <p className="font-body text-[15px] text-(--text-secondary) leading-relaxed max-w-[60ch]">
              {outlet.parentCompanyUrl && outlet.parentCompany ? (
                <a
                  href={outlet.parentCompanyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-(--text-primary) no-underline hover:underline hover:text-(--accent) font-semibold"
                >
                  {outlet.parentCompany} <span aria-hidden>↗</span>
                </a>
              ) : (
                <span className="text-(--text-primary) font-semibold">
                  {outlet.parentCompany}
                </span>
              )}
            </p>
          </section>
        )}

        {/* Major funders (foundation/donations-funded outlets) */}
        {outlet.majorFunders.length > 0 && (
          <section className="mb-10">
            <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
              {COPY.dossier.majorFunders}
            </p>
            <ul className="space-y-1.5">
              {outlet.majorFunders.map((funder) => (
                <li
                  key={funder}
                  className="font-body text-[15px] text-(--text-secondary) leading-relaxed"
                >
                  {funder}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* External links — Wikipedia, official site, ownership reference */}
        {externalLinkEntries.length > 0 && (
          <section className="mb-10">
            <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
              {COPY.dossier.links}
            </p>
            <ul className="space-y-2.5">
              {externalLinkEntries.map(({ key, url, label }) => (
                // Stack on mobile so long URLs aren't crammed into the
                // narrow value column at 375px. Side-by-side on md+.
                <li
                  key={key}
                  className="flex flex-col gap-y-1 md:grid md:grid-cols-[180px_1fr] md:gap-y-0 md:gap-x-6 md:items-baseline border-b border-(--border-subtle) pb-2.5"
                >
                  <span className="font-body text-outlet uppercase tracking-wider text-(--text-tertiary)">
                    {label}
                  </span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body text-[14px] text-(--text-secondary) no-underline hover:underline hover:text-(--accent) truncate"
                  >
                    {url} <span aria-hidden>↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Free-form notes */}
        {outlet.notes && (
          <section className="mb-10">
            <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-3">
              {COPY.dossier.notes}
            </p>
            <p className="font-body text-[15px] text-(--text-secondary) leading-relaxed max-w-[60ch] italic">
              {outlet.notes}
            </p>
          </section>
        )}

        <hr className="border-0 border-t border-(--border) my-10" />

        {/* Recent stories from this outlet on Sift */}
        <section className="mb-12">
          <p className="font-body text-kicker uppercase text-(--text-tertiary) mb-5">
            {COPY.dossier.recentStories}
          </p>
          {recentArticles.length === 0 ? (
            <p className="font-body text-[14px] text-(--text-tertiary) italic max-w-[60ch] leading-relaxed">
              {COPY.dossier.noRecent}
            </p>
          ) : (
            <ul className="space-y-0">
              {recentArticles.map((article) => (
                <li
                  key={article.id}
                  className="border-b border-(--border-subtle) last:border-b-0 py-3.5"
                >
                  <a
                    href={article.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group no-underline"
                  >
                    <p className="font-heading text-[17px] leading-snug text-(--text-primary) group-hover:text-(--accent) transition-colors">
                      {article.title}
                    </p>
                    <p className="font-body text-meta text-(--text-tertiary) mt-1.5 flex items-center gap-3">
                      <span>{timeAgo(article.publishedDate)}</span>
                      <span className="opacity-30">·</span>
                      <span>{article.readTime} min read</span>
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <hr className="border-0 border-t border-(--border) my-10" />

        {/* Footer: methodology hint + back link */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Link
            href="/"
            className="font-body text-outlet uppercase tracking-wider text-(--text-secondary) hover:text-(--accent) transition-colors no-underline inline-flex items-center gap-1.5"
          >
            <span aria-hidden>←</span> Back to Sift
          </Link>
          <Link
            href="/methodology"
            className="font-body text-meta text-(--text-tertiary) italic no-underline hover:text-(--accent) hover:not-italic transition-colors"
          >
            {COPY.dossier.methodologyHint}
          </Link>
        </div>
      </main>
    </div>
  );
}
