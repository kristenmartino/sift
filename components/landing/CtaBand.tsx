import Link from "next/link";
import { COPY } from "@/lib/copy";

const C = COPY.landingReskin.cta;

/** Closing CTA band → /news. */
export default function CtaBand({ count }: { count: number }) {
  return (
    <section className="sl-cta">
      <div className="sl-wrap sl-cta-inner">
        <h2>
          {C.titleLead}
          <em>{C.titleEm}</em>
        </h2>
        <p>{C.body(count)}</p>
        <div className="sl-hero-actions">
          <Link href="/news" className="sl-btn sl-btn-solid">
            {C.ctaPrimary}{" "}
            <span className="sl-arrow" aria-hidden>
              →
            </span>
          </Link>
          <Link href="/methodology" className="sl-btn sl-btn-ghost">
            {C.ctaSecondary}
          </Link>
        </div>
      </div>
    </section>
  );
}
