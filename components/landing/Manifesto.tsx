import { COPY } from "@/lib/copy";

const M = COPY.landingReskin.manifesto;

// Spectrum segment fills, in L/C/R/Specialty order. Presentation only — the
// labels + counts live in COPY. Reverses visually with the manifesto band,
// which flips with the theme.
const SEG_COLORS = ["#8A8174", "#B3AA99", "#6B5F52", "#423D35"];

/**
 * "Why Sift" manifesto band + the outlet-spectrum bar. Counts (22/24/11/20)
 * are the real curated totals from /methodology; static here is fine.
 */
export default function Manifesto() {
  return (
    <section className="sl-manifesto">
      <div className="sl-wrap sl-manifesto-grid">
        <div data-reveal>
          <span className="sl-eyebrow">{M.eyebrow}</span>
          <h2>
            {M.headingLead}
            <em>{M.headingEm}</em>
          </h2>
          <p>{M.body}</p>
        </div>

        <div className="sl-spectrum" data-reveal>
          <div className="sl-bar" aria-hidden="true">
            {M.spectrum.map((s, i) => (
              <div
                key={s.label}
                className="sl-seg"
                style={{ flex: s.count, background: SEG_COLORS[i] }}
                title={`${s.label}: ${s.count}`}
              />
            ))}
          </div>
          <div className="sl-leg">
            {M.spectrum.map((s) => (
              <span key={s.label}>
                {s.label} · {s.count}
              </span>
            ))}
          </div>
          <p className="sl-cap">{M.spectrumCaption}</p>
        </div>
      </div>
    </section>
  );
}
