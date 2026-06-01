"use client";

import Link from "next/link";

import { COPY } from "@/lib/copy";
import { entityHref, entityTypeLabel } from "@/lib/entityLinks";
import type { EntityLink } from "@/lib/types";
import EntityChipTooltip from "./EntityChipTooltip";

interface EntityLinksListProps {
  links: EntityLink[] | undefined;
}

/**
 * Renders the "Mentioned in this story" pill row at the foot of an
 * ArticleCard — civic-literacy MVP Phase 3.H.
 *
 * Each pill is a clickable chip that navigates to the entity's dossier
 * route (`/politician/[bioguide]`, `/org/[slug]`, `/bill/[id]`, or
 * `/outlet/[slug]`). The tiny mono glyph prefix encodes the entity type
 * at a glance; the surface form preserves the original casing as it
 * appeared in the article.
 *
 * Renders nothing when there are no links (graceful — articles
 * predating the entity-linker pipeline, or articles with no curated
 * matches, simply omit this section).
 *
 * z-index note: ArticleCard wraps its title in a stretched `<a>`
 * overlay (`<span class="absolute inset-0 z-1">`). Anchors here use
 * `relative z-2` + `e.stopPropagation()` to opt out of that overlay,
 * mirroring how the bookmark, primer toggle, and OutletBadge already
 * escape the card-link.
 */
export default function EntityLinksList({ links }: EntityLinksListProps) {
  if (!links || links.length === 0) return null;

  return (
    <section
      className="mt-2 flex flex-col gap-1.5"
      aria-labelledby="entity-list-eyebrow"
    >
      <p
        id="entity-list-eyebrow"
        className="text-kicker font-bold uppercase text-(--text-tertiary)"
      >
        {COPY.glossary.eyebrow}
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {links.map((link) => {
          const glyph = COPY.glossary.typeGlyphs[link.type];
          return (
            // `relative group` is the anchor for the EntityChipTooltip's
            // `group-hover:` / `group-focus-within:` reveal. The Tailwind
            // group utility scopes the hover to this single chip, not
            // the whole list, so other chips in the row don't flash.
            <li
              key={`${link.type}:${link.canonicalId}`}
              className="relative group"
            >
              <Link
                href={entityHref(link)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`${entityTypeLabel(link.type)}: ${link.surfaceForm}. Open dossier.`}
                // Touch-target note: py-1.5 + 12px line-height + border = ~32px
                // visible height on mobile, which is still under the 44px
                // Apple HIG recommendation but materially better than the
                // 22-24px the chip had originally. Side padding bumped from
                // px-2 to px-2.5 for the same reason. Visual weight stays
                // small enough to read as a "chip" not a "button."
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:py-0.5 rounded-full text-[12px] leading-none no-underline transition-colors duration-200 relative z-2 border border-(--border) text-(--text-secondary) bg-(--surface-raised) hover:border-(--accent) hover:text-(--accent)"
              >
                {glyph && (
                  <span
                    aria-hidden
                    className="font-mono text-[10px] text-(--text-tertiary)"
                  >
                    {glyph}
                  </span>
                )}
                <span className="font-medium">{link.surfaceForm}</span>
              </Link>
              {link.civicContext && (
                <EntityChipTooltip context={link.civicContext} />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
