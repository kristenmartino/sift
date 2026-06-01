"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { CATEGORY_COLORS } from "@/lib/constants";
import type { CardImageProps } from "@/lib/types";

export default function CardImage({ src, alt, featured, category }: CardImageProps) {
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.top;
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    src ? "loading" : "error"
  );

  useEffect(() => {
    setStatus(src ? "loading" : "error");
  }, [src]);

  // No image — render nothing (parent handles text-first layout)
  if (!src || status === "error") return null;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        height: featured ? "100%" : 170,
        minHeight: featured ? 280 : undefined,
      }}
    >
      <Image
        src={src}
        alt={alt || ""}
        fill
        sizes={featured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 640px) 100vw, 340px"}
        // The featured (index-0) card image is the LCP element on /news.
        // priority adds fetchpriority="high", loading="eager", and a <link rel="preload">.
        priority={featured}
        referrerPolicy="no-referrer"
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        className="object-cover transition-opacity duration-500"
        style={{ opacity: status === "loaded" ? 1 : 0 }}
      />

      {/* Shimmer placeholder while loading */}
      {status === "loading" && (
        <div className="absolute inset-0 bg-(--skeleton) animate-shimmer" />
      )}

      {/* Vignette overlay */}
      {status === "loaded" && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 40%)",
          }}
        />
      )}

      {/* Category-color hairline ties image to card body */}
      {status === "loaded" && (
        <div
          aria-hidden
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: 1,
            background: `linear-gradient(90deg, ${color.hex} 0%, ${color.hex}80 30%, transparent 100%)`,
            opacity: 0.85,
          }}
        />
      )}
    </div>
  );
}
