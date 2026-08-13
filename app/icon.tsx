import { ImageResponse } from "next/og";

import { siftIconCard } from "@/lib/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(siftIconCard({ radius: 6, mark: 22 }), {
    ...size,
  });
}
