import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Shared card factory for per-route Open Graph images.
 *
 * Every dossier route family (politician / org / bill / outlet) renders the
 * same 1200×630 editorial card through `dossierOgCard`, so unfurls stay
 * consistent and the layout lives in exactly one place.
 *
 * publishFloor note: below-floor dossiers keep `noindex` (lib/publishFloor.ts)
 * but still get an OG image — an unfurl only happens when someone shares the
 * link deliberately, and the card renders only fields the page itself renders,
 * so there is nothing here that the floor needs to hide.
 *
 * Fonts are vendored static TTF instances under public/og-fonts/ (both
 * families are OFL-licensed). `next/font` output can't be reused inside
 * ImageResponse, and Satori doesn't take variable fonts, so these are the
 * instantiated cuts Google Fonts serves to legacy user agents.
 */

// Late Edition (dark) values, mirrored from app/globals.css. ImageResponse
// can't resolve CSS custom properties, so the hex lives here too — if the
// dark palette shifts, update this block alongside it.
export const OG = {
  bg: "#15120C",
  ink: "#f2ecde",
  secondary: "#b9b1a0",
  tertiary: "#867d6c",
  accent: "#ec5b39",
  border: "rgba(242, 236, 222, 0.16)",
} as const;

export const OG_SIZE = { width: 1200, height: 630 };

interface OgFont {
  name: string;
  data: Buffer;
  weight: 400 | 500 | 600;
  style: "normal" | "italic";
}

let fontsPromise: Promise<OgFont[]> | null = null;

function readFont(file: string): Promise<Buffer> {
  return readFile(join(process.cwd(), "public", "og-fonts", file));
}

/** Memoized across renders within a server instance — the files never change. */
export function loadOgFonts(): Promise<OgFont[]> {
  fontsPromise ??= Promise.all([
    readFont("Fraunces-SemiBold.ttf"),
    readFont("Fraunces-Italic.ttf"),
    readFont("DMMono-Regular.ttf"),
  ]).then(([semiBold, italic, mono]) => [
    { name: "Fraunces", data: semiBold, weight: 600, style: "normal" },
    { name: "Fraunces", data: italic, weight: 500, style: "italic" },
    { name: "DM Mono", data: mono, weight: 400, style: "normal" },
  ]);
  return fontsPromise;
}

/** Bill titles can run to a paragraph; the card gets one clean clause. */
export function clampOgTitle(title: string, max = 90): string {
  if (title.length <= max) return title;
  const cut = title.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 40 ? lastSpace : max)}…`;
}

export interface DossierOgCardProps {
  /** Mono uppercase kicker, e.g. "Politician dossier". Rendered in accent. */
  eyebrow: string;
  /** The entity name. Long titles should pass through clampOgTitle first. */
  title: string;
  /** One mono line of neutral facts, e.g. "D-WA · Senate · 4 committees". */
  meta?: string | null;
  /**
   * Optional bordered chips under the meta line, e.g. sourced ratings on an
   * outlet card. Neutral ink only — the no-hue-coding rule from the page
   * applies to the unfurl too.
   */
  chips?: (string | null)[];
}

export function dossierOgCard({ eyebrow, title, meta, chips }: DossierOgCardProps) {
  const shownChips = (chips ?? []).filter((c): c is string => Boolean(c));
  const titleSize = title.length > 34 ? 54 : 72;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: OG.bg,
        padding: 72,
        fontFamily: "DM Mono",
      }}
    >
      {/* Masthead */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill={OG.accent}>
          <path d="M12 2L22 12L12 22L2 12Z" />
        </svg>
        <span
          style={{
            fontSize: 28,
            color: OG.ink,
            fontFamily: "Fraunces",
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          Sift
        </span>
      </div>

      {/* Body */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span
          style={{
            fontSize: 20,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: OG.accent,
          }}
        >
          {eyebrow}
        </span>
        <span
          style={{
            fontFamily: "Fraunces",
            fontWeight: 600,
            fontSize: titleSize,
            lineHeight: 1.08,
            color: OG.ink,
            marginTop: 20,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </span>
        {meta ? (
          <span style={{ fontSize: 24, color: OG.secondary, marginTop: 22 }}>
            {meta}
          </span>
        ) : null}
        {shownChips.length > 0 ? (
          <div style={{ display: "flex", gap: 12, marginTop: 26 }}>
            {shownChips.map((chip) => (
              <span
                key={chip}
                style={{
                  fontSize: 19,
                  color: OG.secondary,
                  border: `1px solid ${OG.border}`,
                  borderRadius: 999,
                  padding: "8px 18px",
                }}
              >
                {chip}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            width: 120,
            height: 1,
            background: OG.border,
            marginBottom: 22,
          }}
        />
        <span
          style={{
            fontFamily: "Fraunces",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 27,
            color: OG.tertiary,
          }}
        >
          The news, with footnotes.
        </span>
      </div>
    </div>
  );
}

/**
 * The app-icon mark, shared by every favicon/app-icon route. Same geometry at
 * every size — only the corner radius and the mark itself scale.
 */
export function siftIconCard({ radius, mark }: { radius: number; mark: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#E0492A",
        borderRadius: radius,
      }}
    >
      {/* Diamond mark — ◆ */}
      <svg width={mark} height={mark} viewBox="0 0 24 24" fill="#FBF8F1">
        <path d="M12 2L22 12L12 22L2 12Z" />
      </svg>
    </div>
  );
}
