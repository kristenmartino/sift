import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sift — AI-Curated News",
    short_name: "Sift",
    start_url: "/news",
    display: "standalone",
    background_color: "#0c0a09",
    theme_color: "#4338ca",
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
