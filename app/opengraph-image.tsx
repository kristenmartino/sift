import { ImageResponse } from "next/og";

// Updated 2026-05: the original card baked in three stale claims —
// "100+ sources" (true count is ~58), "Updated every 10 min" (pipeline
// runs every 30 min after the cost-cut bump), and an "AI-Curated News"
// positioning that doesn't communicate the actual differentiator (civic
// context / cross-spectrum framing / money trail). The current version
// uses the live product tagline and avoids numeric claims that go stale.
export const alt = "Sift — The news, with footnotes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
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
          background: "#0c0a09",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Diamond mark */}
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="#818cf8"
          style={{ marginBottom: 24 }}
        >
          <path d="M12 2L22 12L12 22L2 12Z" />
        </svg>

        {/* Wordmark */}
        <span
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          Sift
        </span>

        {/* Tagline — matches COPY.header.tagline */}
        <span
          style={{
            fontSize: 32,
            color: "rgba(255,255,255,0.75)",
            marginTop: 24,
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
            fontWeight: 400,
          }}
        >
          The news, with footnotes.
        </span>

        {/* Hairline rule */}
        <div
          style={{
            width: 96,
            height: 1,
            background: "rgba(255,255,255,0.2)",
            marginTop: 40,
            marginBottom: 28,
          }}
        />

        {/* Differentiator line — three durable claims, no numbers */}
        <span
          style={{
            display: "flex",
            fontSize: 18,
            color: "rgba(255,255,255,0.55)",
            fontFamily: "sans-serif",
            letterSpacing: "0.04em",
            textAlign: "center",
          }}
        >
          Civic context &middot; Cross-spectrum framing &middot; The money behind each story
        </span>
      </div>
    ),
    { ...size },
  );
}
