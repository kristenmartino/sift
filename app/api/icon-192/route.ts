import { ImageResponse } from "next/og";

import { siftIconCard } from "@/lib/og";

export const GET = () => {
  return new ImageResponse(siftIconCard({ radius: 36, mark: 120 }), {
    width: 192,
    height: 192,
  });
};
