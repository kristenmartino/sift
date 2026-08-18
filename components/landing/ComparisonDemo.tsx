import { COPY } from "@/lib/copy";
import type { DailyCompareExample } from "@/lib/types";

const C = COPY.landingReskin.compare;

/**
 * "How outlets framed it" — the landing's comparison section.
 *
 * With a daily example (sift-api generates one real comparison per UTC day),
 * this renders live output from the actual compare tool, dated. Without one
 * (first deploy, or the table unreachable), it falls back to a generic
 * illustration of the format — no named outlets, no lean chips — which
 * noteLine labels as written rather than quoted. This resolves the old
 * TODO(live-compare): real data replaced the fixture the moment it could do
 * so without fabricating anything.
 */
export default function ComparisonDemo({
  example,
}: {
  example?: DailyCompareExample | null;
}) {
  const live = example && example.claims.length >= 2 ? example : null;
  const generatedDate = live
    ? new Date(live.generatedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <section className="sl-band sl-compare" id="compare">
      <div className="sl-wrap">
        <div className="sl-sec-head" data-reveal>
          <span className="sl-eyebrow">{C.eyebrow}</span>
          <h2>
            {C.titleLead}
            <span className="sl-it">{live ? C.liveTitleIt : C.titleIt}</span>
          </h2>
          <p>{C.subtitle}</p>
        </div>

        <div className="sl-frames" data-reveal>
          <div className="sl-topic">
            {live ? C.liveTopicLabel : C.topicLabel} —{" "}
            <b>{live ? live.topic : C.topic}</b>
          </div>
          {live
            ? // Claims arrive disputed-first from the workflow; the top three
              // are the spread worth showing. Agreement chips reuse the
              // compare view's labels; sources stay neutral ink.
              live.claims.slice(0, 3).map((claim) => (
                <div className="sl-frame" key={claim.claim}>
                  <div className="sl-out">
                    <span className="sl-nm">
                      {COPY.compare.agreement[claim.agreement] ??
                        COPY.compare.agreement.unique}
                    </span>
                    <span className="sl-ln">
                      <span className="sl-dot" aria-hidden />
                      {claim.agreement === "disputed"
                        ? [
                            (claim.sources_for ?? []).join(", "),
                            (claim.sources_against ?? []).join(", "),
                          ]
                            .filter(Boolean)
                            .join(C.liveDisputedVs)
                        : (claim.sources ?? []).join(", ")}
                    </span>
                  </div>
                  <q>{claim.claim}</q>
                </div>
              ))
            : // The fallback carries no lean chip: the frames are generic
              // placeholders, and a rating badge beside one would imply a real
              // outlet had been rated. noteLine labels the whole block instead.
              C.frames.map((f) => (
                <div className="sl-frame" key={f.outlet}>
                  <div className="sl-out">
                    <span className="sl-nm">{f.outlet}</span>
                  </div>
                  <q>{f.quote}</q>
                </div>
              ))}
        </div>

        <p className="sl-note-line" data-reveal>
          {live && generatedDate ? C.liveNote(generatedDate) : C.noteLine}
        </p>
      </div>
    </section>
  );
}
