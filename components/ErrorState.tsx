"use client";

import { COPY } from "@/lib/copy";
import type { ErrorStateProps } from "@/lib/types";

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="text-center py-16 px-5 text-(--text-muted)">
      <div className="text-5xl mb-4 opacity-30">⚠</div>
      <p className="text-base font-semibold text-(--text-secondary) mb-2">
        {COPY.error.title}
      </p>
      <p className="text-sm max-w-[400px] mx-auto mb-5 leading-relaxed">
        {message || COPY.error.body}
      </p>
      <button
        onClick={onRetry}
        className="bg-(--accent) text-white border-none px-7 py-2.5 rounded-3xl text-sm font-semibold cursor-pointer font-body hover:opacity-90 transition-opacity"
      >
        {COPY.error.button}
      </button>
    </div>
  );
}
