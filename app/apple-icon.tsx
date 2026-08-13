import { ImageResponse } from "next/og";

import { siftIconCard } from "@/lib/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(siftIconCard({ radius: 36, mark: 120 }), {
    ...size,
  });
}
