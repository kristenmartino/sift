import { COPY } from "@/lib/copy";

const A = COPY.landingReskin.adds;

/** "What Sift adds" — the four footnote types, as a 2×2 card grid. */
export default function WhatSiftAdds() {
  return (
    <section className="sl-band sl-adds" id="adds">
      <div className="sl-wrap">
        <div className="sl-sec-head" data-reveal>
          <span className="sl-eyebrow">{A.eyebrow}</span>
          <h2>
            {A.titleLead}
            <span className="sl-it">{A.titleIt}</span>
          </h2>
          <p>{A.subtitle}</p>
        </div>

        <div className="sl-add-grid" data-reveal>
          {A.cards.map((c) => (
            <div className="sl-add" key={c.title}>
              <div className="sl-ai" aria-hidden>
                {c.icon}
              </div>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
