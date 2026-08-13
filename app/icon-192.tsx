import { ImageResponse } from "next/og";

import { siftIconCard } from "@/lib/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon192() {
  return new ImageResponse(siftIconCard({ radius: 36, mark: 120 }), {
    ...size,
  });
}
