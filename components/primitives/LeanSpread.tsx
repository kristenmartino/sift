import { CROSS_SPECTRUM_BUCKETS } from "@/lib/crossSpectrum";
import type { LeanSpread as LeanSpreadData } from "@/lib/storySources";

const BUCKET_LABEL: Record<(typeof CROSS_SPECTRUM_BUCKETS)[number], string> = {
  left: "Left",
  center: "Center",
  right: "Right",
};

interface LeanSpreadProps {
  spread: LeanSpreadData;
  className?: string;
}

/**
 * Coverage-spread cue — three position cells (Left · Center · Right), a cell
 * filled for each part of the spectrum the outlets covering a story fall on.
 * On a single-outlet card exactly one cell fills. Shown above the headline.
 *
 * NEUTRAL by construction (SIFT_THEME_MIGRATION.md §3): encodes position, never
 * hue — same ink language as LeanGlyph. Carries an explanatory tooltip + aria
 * label so the bars are self-describing.
 */
export default function LeanSpread({ spread, className = "" }: LeanSpreadProps) {
  const cells = CROSS_SPECTRUM_BUCKETS.map((b) => ({ key: b, on: spread[b] > 0 }));
  const covered = cells.filter((c) => c.on).map((c) => BUCKET_LABEL[c.key]);
  const tip =
    "Political coverage spread (AllSides Left · Center · Right). " +
    "A filled bar marks each part of the spectrum the outlets covering this story fall on" +
    (covered.length ? ` — here: ${covered.join(", ")}.` : ".");

  return (
    <span
      role="img"
      aria-label={tip}
      title={tip}
      className={`inline-flex items-center gap-[3px] align-middle ${className}`}
    >
      {cells.map((c) => (
        <span
          key={c.key}
          aria-hidden
          className="inline-block w-[10px] h-[3px] rounded-[1px]"
          style={{
            background: c.on ? "var(--text-secondary)" : "var(--border-strong)",
          }}
        />
      ))}
    </span>
  );
}
