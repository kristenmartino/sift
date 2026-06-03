import { Fragment } from "react";
import { COPY } from "@/lib/copy";

/** The "{n} curated outlets / Left → Center → Right / …" principle strip. The
 *  count comes from the live outlet list (issue #153); the rest is static. */
export default function PrincipleStrip({ count }: { count: number }) {
  const items = COPY.landingReskin.strip(count);
  return (
    <div className="sl-strip">
      <div className="sl-wrap sl-strip-inner">
        {items.map((item, i) => (
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
