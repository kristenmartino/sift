import { COPY } from "@/lib/copy";
import type { OutletStats } from "@/lib/outletStats";

const M = COPY.landingReskin.manifesto;

// Spectrum segment fills, in L/C/R/Specialty order. Presentation only — the
// labels + LIVE counts come from COPY.manifesto.spectrum(stats). Reverses
// visually with the manifesto band, which flips with the theme.
const SEG_COLORS = ["#8A8174", "#B3AA99", "#6B5F52", "#423D35"];

/**
 * "Why Sift" manifesto band + the live outlet-spectrum bar. Counts come from
 * the curated outlet list (issue #153); on an empty list (DB miss) the bar is
 * dropped and only the manifesto copy renders.
 */
export default function Manifesto({ stats }: { stats: OutletStats }) {
  const spectrum = M.spectrum(stats);
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

        {stats.total > 0 && (
          <div className="sl-spectrum" data-reveal>
            <div className="sl-bar" aria-hidden="true">
              {spectrum.map((s, i) => (
                <div
                  key={s.label}
                  className="sl-seg"
                  style={{ flex: s.count, background: SEG_COLORS[i] }}
                  title={`${s.label}: ${s.count}`}
                />
              ))}
            </div>
            <div className="sl-leg">
              {spectrum.map((s) => (
                <span key={s.label}>
                  {s.label} · {s.count}
                </span>
              ))}
            </div>
            <p className="sl-cap">{M.spectrumCaption}</p>
          </div>
        )}
      </div>
    </section>
  );
}
