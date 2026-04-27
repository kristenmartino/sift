import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        // CSS variables are injected by next/font in app/layout.tsx.
        heading: ["var(--font-heading)", "Georgia", "Times New Roman", "serif"],
        body: ["var(--font-body)", "Segoe UI", "sans-serif"],
      },
      fontSize: {
        kicker:        ["11px",   { lineHeight: "1.2",  letterSpacing: "0.12em" }],
        meta:          ["11px",   { lineHeight: "1.3",  letterSpacing: "0.02em" }],
        outlet:        ["11px",   { lineHeight: "1.2",  letterSpacing: "0.08em" }],
        body:          ["13.5px", { lineHeight: "1.5",  letterSpacing: "0" }],
        "body-lg":     ["15px",   { lineHeight: "1.55", letterSpacing: "-0.005em" }],
        headline:      ["19px",   { lineHeight: "1.25", letterSpacing: "-0.015em" }],
        "headline-lg": ["24px",   { lineHeight: "1.2",  letterSpacing: "-0.02em" }],
        display:       ["32px",   { lineHeight: "1.1",  letterSpacing: "-0.025em" }],
      },
      colors: {
        sift: {
          bg: "var(--bg)",
          card: "var(--card-bg)",
          border: "var(--border)",
          accent: "var(--accent)",
          skeleton: "var(--skeleton)",
        },
        category: {
          top: "#dc2626",
          technology: "#2563eb",
          business: "#059669",
          science: "#7c3aed",
          energy: "#0d9488",
          world: "#d97706",
          health: "#db2777",
          politics: "#6366f1",
          sports: "#0891b2",
          entertainment: "#e11d48",
        },
      },
      keyframes: {
        shimmer: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "0.8" },
        },
        "fade-slide-in": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        spin: {
          to: { transform: "rotate(360deg)" },
        },
        "bookmark-pop": {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.35)" },
          "60%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1.15)" },
        },
        "sift-refresh": {
          "0%": { transform: "rotate(0deg) scale(1)", opacity: "0.5" },
          "50%": { transform: "rotate(180deg) scale(1.1)", opacity: "1" },
          "100%": { transform: "rotate(360deg) scale(1)", opacity: "0.5" },
        },
        "category-fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.8s ease-in-out infinite",
        "fade-slide-in": "fade-slide-in 0.5s ease-out both",
        "spin-slow": "spin 1s linear infinite",
        "bookmark-pop": "bookmark-pop 0.4s cubic-bezier(0.16,1,0.3,1) both",
        "sift-refresh": "sift-refresh 1.2s ease-in-out infinite",
        "category-fade-in": "category-fade-in 0.3s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
