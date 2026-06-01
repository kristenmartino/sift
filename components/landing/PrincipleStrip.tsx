import { Fragment } from "react";
import { COPY } from "@/lib/copy";

const ITEMS = COPY.landingReskin.strip;

/** The "~50 vetted outlets / Left → Center → Right / …" principle strip. */
export default function PrincipleStrip() {
  return (
    <div className="sl-strip">
      <div className="sl-wrap sl-strip-inner">
        {ITEMS.map((item, i) => (
          <Fragment key={item}>
            {i > 0 && (
              <span className="sl-sep" aria-hidden>
                /
              </span>
            )}
            {i === 0 ? <b>{item}</b> : <span>{item}</span>}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
