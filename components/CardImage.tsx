"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { CardImageProps } from "@/lib/types";

export default function CardImage({ src, alt, featured }: CardImageProps) {
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
        referrerPolicy="no-referrer"
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        className="object-cover transition-opacity duration-500"
        style={{ opacity: status === "loaded" ? 1 : 0 }}
      />

      {/* Shimmer placeholder while loading */}
      {status === "loading" && (
        <div className="absolute inset-0 bg-[var(--skeleton)] animate-shimmer" />
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
    </div>
  );
}
