import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 6,
        }}
      >
        {/* Diamond mark — ◆ */}
        <svg
          width="22"
          height="22"
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
