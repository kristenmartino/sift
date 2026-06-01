import { COPY } from "@/lib/copy";

const C = COPY.landingReskin.compare;

/**
 * "How outlets framed it" — a representative side-by-side of how three outlets
 * framed one story.
 *
 * TODO(live-compare): this Fed example is intentionally STATIC. Wiring it to a
 * real multi-source comparison (today's top story across outlets, with live
 * AllSides leans) is a larger, separate build — the deterministic compare path
 * already exists at /news and app/api/compare. Until then this stays a fixed,
 * honest illustration of the feature, not fabricated live data.
 */
export default function ComparisonDemo() {
  return (
    <section className="sl-band sl-compare" id="compare">
      <div className="sl-wrap">
        <div className="sl-sec-head" data-reveal>
          <span className="sl-eyebrow">{C.eyebrow}</span>
          <h2>
            {C.titleLead}
            <span className="sl-it">{C.titleIt}</span>
          </h2>
          <p>{C.subtitle}</p>
        </div>

        <div className="sl-frames" data-reveal>
          <div className="sl-topic">
            {C.topicLabel} — <b>{C.topic}</b>
          </div>
          {C.frames.map((f) => (
            <div className="sl-frame" key={f.outlet}>
              <div className="sl-out">
                <span className="sl-nm">{f.outlet}</span>
                <span className="sl-ln">
                  <span className="sl-dot" aria-hidden />
                  {f.lean}
                </span>
              </div>
              <q>{f.quote}</q>
            </div>
          ))}
        </div>

        <p className="sl-note-line" data-reveal>
          {C.noteLine}
        </p>
      </div>
    </section>
  );
}
