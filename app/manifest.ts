import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sift — AI-Curated News",
    short_name: "Sift",
    start_url: "/news",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#6366f1",
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
