"use client";

import { useState, useRef, useEffect } from "react";
import { COPY } from "@/lib/copy";
import { CUSTOM_TOPIC_COLORS } from "@/lib/constants";
import type { CustomTopic, TopicGenerateResponse } from "@/lib/types";

interface TopicModalProps {
  onClose: () => void;
  onAdd: (topic: CustomTopic) => void;
  existingTopics: CustomTopic[];
  colorIndex: number;
}

type ModalStep = "input" | "generating" | "preview";

export default function TopicModal({ onClose, onAdd, existingTopics, colorIndex }: TopicModalProps) {
  const [step, setStep] = useState<ModalStep>("input");
  const [inputValue, setInputValue] = useState("");
  const [preview, setPreview] = useState<TopicGenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const color = CUSTOM_TOPIC_COLORS[colorIndex % CUSTOM_TOPIC_COLORS.length];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Restore focus to whoever opened the modal when it unmounts.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    return () => {
      // Guard against the opener being unmounted (e.g. the "+" button hides
      // when the topic limit is reached after the new topic is added).
      if (opener && document.contains(opener)) opener.focus();
    };
  }, []);

  // Escape closes; Tab/Shift+Tab cycles within the dialog so focus can't leak
  // into the muted background page.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const generate = async () => {
    const trimmed = inputValue.trim();
    if (trimmed.length < 2) return;

    setStep("generating");
    setError(null);

    try {
      const res = await fetch("/api/topics/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawTopic: trimmed,
          existingTopics: existingTopics.map((t) => t.shortLabel),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const data: TopicGenerateResponse = await res.json();
      setPreview(data);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate topic");
      setStep("input");
    }
  };

  const confirm = () => {
    if (!preview) return;

    const topic: CustomTopic = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36),
      rawInput: inputValue.trim(),
      shortLabel: preview.shortLabel,
      icon: preview.icon,
      searchQueries: preview.searchQueries,
      description: preview.description,
      createdAt: new Date().toISOString(),
      colorIndex,
    };

    onAdd(topic);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="topic-modal-title"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-[460px] rounded-2xl border border-(--border) overflow-hidden animate-fade-slide-in"
        style={{ background: "var(--surface-raised)" }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <h2 id="topic-modal-title" className="font-heading text-lg font-bold text-(--text-primary)">
            {step === "preview" ? COPY.topics.previewTitle : COPY.topics.modalTitle}
          </h2>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-(--text-tertiary) text-xl cursor-pointer p-1 transition-colors duration-200"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Input step */}
          {(step === "input" || step === "generating") && (
            <form
              onSubmit={(e) => { e.preventDefault(); generate(); }}
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={COPY.topics.modalPlaceholder}
                maxLength={200}
                disabled={step === "generating"}
                className="w-full px-4 py-3 rounded-xl text-sm font-body transition-all duration-200 outline-hidden"
                style={{
                  background: "var(--surface-base)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  opacity: step === "generating" ? 0.6 : 1,
                }}
              />
              {error && (
                <p className="text-xs text-red-500 mt-2">{error}</p>
              )}
              {step === "generating" && (
                <div className="flex items-center gap-2 mt-3">
                  <span className="animate-sift-refresh inline-block text-sm" style={{ color: color.hex }}>
                    &#x25C6;
                  </span>
                  <span className="text-xs text-(--text-tertiary)">
                    {COPY.topics.generating}
                  </span>
                </div>
              )}
              {step === "input" && (
                <button
                  type="submit"
                  disabled={inputValue.trim().length < 2}
                  className="mt-3 w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 border-none"
                  style={{
                    background: inputValue.trim().length >= 2 ? color.hex : "var(--border)",
                    color: inputValue.trim().length >= 2 ? "#fff" : "var(--text-tertiary)",
                    cursor: inputValue.trim().length >= 2 ? "pointer" : "not-allowed",
                  }}
                >
                  Generate preview
                </button>
              )}
            </form>
          )}

          {/* Preview step */}
          {step === "preview" && preview && (
            <div className="space-y-4">
              {/* Label + icon */}
              <div className="flex items-center gap-3">
                <span
                  className="flex items-center justify-center w-10 h-10 rounded-full text-lg"
                  style={{ background: `rgba(${color.rgb}, 0.12)` }}
                >
                  {preview.icon}
                </span>
                <div>
                  <p className="font-bold text-(--text-primary)">{preview.shortLabel}</p>
                  <p className="text-xs text-(--text-tertiary)">{preview.description}</p>
                </div>
              </div>

              {/* Search queries */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-(--text-tertiary) mb-2">
                  {COPY.topics.previewQueries}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {preview.searchQueries.map((q) => (
                    <span
                      key={q}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                      style={{
                        background: `rgba(${color.rgb}, 0.08)`,
                        color: color.hex,
                        border: `1px solid rgba(${color.rgb}, 0.15)`,
                      }}
                    >
                      {q}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setStep("input"); setPreview(null); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200"
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {COPY.topics.edit}
                </button>
                <button
                  onClick={confirm}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 border-none"
                  style={{ background: color.hex, color: "#fff" }}
                >
                  {COPY.topics.confirm}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
