import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#4338ca",
          borderRadius: 36,
        }}
      >
        {/* Diamond mark — ◆ */}
        <svg
          width="120"
          height="120"
          viewBox="0 0 24 24"
          fill="#fff"
        >
          <path d="M12 2L22 12L12 22L2 12Z" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
