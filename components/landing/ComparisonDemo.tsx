import CoveragePreview from "@/components/CoveragePreview";
import UsageView from "@/components/analytics/UsageView";
import { COPY } from "@/lib/copy";
import type { DailyCompareExample, Story } from "@/lib/types";
import { comparisonProvenance, eligibleComparisonExample, comparisonClaimLabel } from "@/lib/comparison";

const C = COPY.landingReskin.compare;

/** A recent, source-accounted saved result, or an honest original-headline preview. */
export default function ComparisonDemo({ example, coverageStories = [] }: {
  example?: DailyCompareExample | null;
  coverageStories?: Story[];
}) {
  const live = eligibleComparisonExample(example);
  if (!live) return <section className="sl-band sl-compare" id="compare">
    <div className="sl-wrap"><CoveragePreview stories={coverageStories} /></div>
  </section>;
  const record = comparisonProvenance(live);
  const generatedDate = new Date(live.generatedAt).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  });

  return <UsageView name="comparison_viewed" viewKey={`landing:${live.generatedAt}`}
    properties={{ contentId: `daily:${live.generatedAt}`, surface: "daily_compare" }}>
    <section className="sl-band sl-compare" id="compare">
      <div className="sl-wrap">
        <div className="sl-sec-head" data-reveal>
          <span className="sl-eyebrow">{C.eyebrow}</span>
          <h2>{C.titleLead}<span className="sl-it">{C.liveTitleIt}</span></h2>
          <p>{C.subtitle}</p>
        </div>
        <div className="sl-frames" data-reveal>
          <div className="sl-topic">{C.liveTopicLabel} — <b>{live.topic}</b></div>
          {live.claims.slice(0, 3).map((claim) => <div className="sl-frame" key={claim.claim}>
            <div className="sl-out">
              <span className="sl-nm">{comparisonClaimLabel(claim, record)}</span>
              <span className="sl-ln"><span className="sl-dot" aria-hidden />
                {claim.agreement === "disputed" ? [
                  (claim.sources_for ?? []).join(", "), (claim.sources_against ?? []).join(", "),
                ].filter(Boolean).join(C.liveDisputedVs) : (claim.sources ?? []).join(", ")}
              </span>
            </div>
            <p className="font-heading italic text-[18px] leading-[1.4] text-(--text-primary)">{claim.claim}</p>
          </div>)}
        </div>
        <p className="sl-note-line" data-reveal>{C.liveNote(generatedDate)}</p>
      </div>
    </section>
  </UsageView>;
}
