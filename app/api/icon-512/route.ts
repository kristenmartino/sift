import { ImageResponse } from "next/og";

import { siftIconCard } from "@/lib/og";

export const GET = () => {
  return new ImageResponse(siftIconCard({ radius: 96, mark: 320 }), {
    width: 512,
    height: 512,
  });
};
