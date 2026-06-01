"use client";

import type { SkeletonCardProps } from "@/lib/types";

const BARS = [
  { h: "h-3", w: "w-[30%]" },
  { h: "h-4", w: "w-[90%]" },
  { h: "h-4", w: "w-[70%]" },
  { h: "h-3.5", w: "w-full" },
  { h: "h-3.5", w: "w-[80%]" },
  { h: "h-3", w: "w-[45%]" },
];

interface ExtendedSkeletonCardProps extends SkeletonCardProps {
  hasImage?: boolean;
}

export default function SkeletonCard({ featured, hasImage = true }: ExtendedSkeletonCardProps) {
  return (
    <div
      className={`
        bg-(--surface-raised) rounded-[14px] overflow-hidden border border-(--border)
        ${featured && hasImage ? "col-span-full grid grid-cols-1 md:grid-cols-2" : ""}
      `}
      style={!hasImage ? { borderTop: "3px solid var(--surface-sunken)" } : undefined}
    >
      {hasImage && (
        <div
          className={`
            bg-(--surface-sunken) animate-shimmer
            ${featured ? "min-h-[280px]" : "h-[140px]"}
          `}
        />
      )}
      <div className={featured ? "p-8" : "p-5"}>
        {BARS.map((bar, i) => (
          <div
            key={i}
            className={`${bar.h} ${bar.w} bg-(--surface-sunken) rounded-md animate-shimmer ${
              i < BARS.length - 1 ? (i === 2 || i === 4 ? "mb-4" : "mb-2.5") : ""
            }`}
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    </div>
  );
}
