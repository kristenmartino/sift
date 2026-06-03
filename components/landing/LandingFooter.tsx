import Link from "next/link";
import { COPY } from "@/lib/copy";
import SlDiamond from "./SlDiamond";

const F = COPY.landingReskin.footer;

/** Reskinned footer — real in-app routes + byline → kristenmartino.ai. */
export default function LandingFooter({ count }: { count: number }) {
  const year = new Date().getFullYear();

  return (
    <footer className="sl-foot">
      <div className="sl-wrap">
        <div className="sl-foot-top">
          <div className="sl-foot-brand">
            <a href="#top" className="sl-brand" aria-label="Sift home">
              <SlDiamond />
              Sift
            </a>
            <p>{F.blurb(count)}</p>
          </div>

          <div className="sl-foot-cols">
            {F.cols.map((col) => (
              <div className="sl-foot-col" key={col.heading}>
                <h5>{col.heading}</h5>
                {col.links.map((l) => (
                  <Link key={l.href} href={l.href}>
                    {l.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="sl-foot-bottom">
          <span>
            © {year} Sift · {F.tagline}
          </span>
          <span>
            {F.bylinePre}
            <a href={F.bylineHref} target="_blank" rel="noopener noreferrer">
              {F.bylineName}
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
