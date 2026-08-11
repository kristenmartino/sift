import { ImageResponse } from "next/og";

import { loadOgFonts, OG } from "@/lib/og";

// Updated 2026-05: the original card baked in three stale claims —
// "100+ sources" (true count is ~58), "Updated every 10 min" (pipeline
// runs every 30 min after the cost-cut bump), and an "AI-Curated News"
// positioning that doesn't communicate the actual differentiator (civic
// context / cross-spectrum framing / money trail). The current version
// uses the live product tagline and avoids numeric claims that go stale.
// Updated 2026-08: retired the pre-reskin indigo + Georgia for the current
// brand — warm dark surface, vermillion mark, Fraunces/DM Mono (vendored
// static cuts via lib/og.tsx, shared with the dossier OG routes).
export const alt = "Sift — The news, with footnotes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  const fonts = await loadOgFonts();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: OG.bg,
        }}
      >
        {/* Diamond mark */}
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill={OG.accent}
          style={{ marginBottom: 24 }}
        >
          <path d="M12 2L22 12L12 22L2 12Z" />
        </svg>

        {/* Wordmark */}
        <span
          style={{
            fontFamily: "Fraunces",
            fontSize: 96,
            fontWeight: 600,
            color: OG.ink,
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          Sift
        </span>

        {/* Tagline — matches COPY.header.tagline */}
        <span
          style={{
            fontSize: 34,
            color: OG.secondary,
            marginTop: 26,
            fontFamily: "Fraunces",
            fontStyle: "italic",
            fontWeight: 500,
          }}
        >
          The news, with footnotes.
        </span>

        {/* Hairline rule */}
        <div
          style={{
            width: 96,
            height: 1,
            background: OG.border,
            marginTop: 40,
            marginBottom: 28,
          }}
        />

        {/* Differentiator line — three durable claims, no numbers */}
        <span
          style={{
            display: "flex",
            fontSize: 19,
            color: OG.tertiary,
            fontFamily: "DM Mono",
            letterSpacing: "0.04em",
            textAlign: "center",
          }}
        >
          Civic context &middot; Cross-spectrum framing &middot; The money behind each story
        </span>
      </div>
    ),
    { ...size, fonts },
  );
}
