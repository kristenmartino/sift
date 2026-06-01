import Link from "next/link";
import { COPY } from "@/lib/copy";

export interface SourceColophonOutlet {
  slug: string;
  name: string;
  /** AllSides lean if available — threaded for a possible future L/C/R group. */
  allSidesRating?: string | null;
}

const S = COPY.landingReskin.sources;

/**
 * "Curated & cited" — the sources/methodology block. Left column carries the
 * pitch, the methodology link, and the LIVE curated outlet list (server-fetched
 * from outlet_profiles in app/page.tsx; degrades to no list on a DB miss).
 * Right column is the static exclusions list.
 */
export default function SourceColophon({
  outlets,
}: {
  outlets: SourceColophonOutlet[];
}) {
  return (
    <section className="sl-band sl-sources" id="sources">
      <div className="sl-wrap sl-src-grid">
        <div className="sl-sec-head" style={{ marginBottom: 0 }} data-reveal>
          <span className="sl-eyebrow">{S.eyebrow}</span>
          <h2>
            {S.titleLead}
            <span className="sl-it">{S.titleIt}</span>
            {S.titleRest}
          </h2>
          <p>{S.body}</p>
          <div className="sl-hero-actions" style={{ marginTop: 26 }}>
            <Link href="/methodology" className="sl-btn sl-btn-ghost">
              {S.methodologyCta}
            </Link>
          </div>
          {outlets.length > 0 && (
            <ul className="sl-outlets" aria-label={S.outletsLabel}>
              {outlets.map((o) => (
                <li key={o.slug}>{o.name}</li>
              ))}
            </ul>
          )}
        </div>

        <div data-reveal>
          <p className="sl-src-label">{S.exclusionsLabel}</p>
          <ul className="sl-excl">
            {S.exclusions.map((e) => (
              <li key={e.term}>
                <span>
                  <b>{e.term}</b> — {e.desc}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
