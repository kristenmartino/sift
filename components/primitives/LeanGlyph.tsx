import { formatAllSidesLabel } from "@/lib/outlet";
import type { OutletAllSidesRating } from "@/lib/types";

/**
 * AllSides political lean as a 5-tick position indicator in NEUTRAL ink.
 *
 * Brand-critical rule (SIFT_THEME_MIGRATION.md §3): lean is NEVER hue-coded —
 * Left and Right render identically. Differentiate by POSITION (which tick is
 * filled), not color. "mixed" has no single position, so no tick is filled.
 */
const POSITION: Record<OutletAllSidesRating, number | null> = {
  left: 0,
  "lean-left": 1,
  center: 2,
  "lean-right": 3,
  right: 4,
  mixed: null,
};

interface LeanGlyphProps {
  rating: OutletAllSidesRating | null | undefined;
  className?: string;
}

export default function LeanGlyph({ rating, className = "" }: LeanGlyphProps) {
  if (!rating) return null;
  const label = formatAllSidesLabel(rating);
  const pos = POSITION[rating];

  return (
    <span
      className={`inline-flex items-center gap-[3px] align-middle ${className}`}
      role="img"
      aria-label={`AllSides lean: ${label}`}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          aria-hidden
          className="inline-block w-[3px] h-[10px] rounded-[1px]"
          // Neutral ink only: filled tick = secondary text, empty = strong
          // border. No red/blue, ever.
          style={{
            background:
              i === pos ? "var(--text-secondary)" : "var(--border-strong)",
          }}
        />
      ))}
    </span>
  );
}
