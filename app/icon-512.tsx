import { ImageResponse } from "next/og";

import { siftIconCard } from "@/lib/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon512() {
  return new ImageResponse(siftIconCard({ radius: 96, mark: 320 }), {
    ...size,
  });
}
