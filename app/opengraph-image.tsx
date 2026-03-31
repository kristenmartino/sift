import { ImageResponse } from "next/og";

export const alt = "Sift — AI-Curated News";
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

        {/* Tagline */}
        <span
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.6)",
            marginTop: 20,
            fontFamily: "sans-serif",
            fontWeight: 400,
          }}
        >
          AI-Curated News, Already Read for You
        </span>

        {/* Stats line */}
        <span
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.3)",
            marginTop: 40,
            fontFamily: "sans-serif",
            letterSpacing: "0.05em",
          }}
        >
          100+ sources &middot; 10 categories &middot; Updated every 10 min
        </span>
      </div>
    ),
    { ...size },
  );
}
