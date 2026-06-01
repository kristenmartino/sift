"use client";

import Link from "next/link";
import { useState } from "react";
import { COPY } from "@/lib/copy";
import { useTheme } from "@/lib/hooks";
import SlDiamond from "./SlDiamond";

const NAV = COPY.landingReskin.nav;

/**
 * Reskinned homepage header. Reuses the app's existing dark-mode toggle
 * (lib/hooks.ts useTheme → data-theme on <html>) — no second theme state. The
 * shared LandingMasthead is intentionally left untouched for the other pages
 * (colophon, methodology, civic, dossiers); this header is homepage-only.
 */
export default function LandingHeader() {
  const { dark, toggle, mounted } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <header className="sl-header">
      <div className="sl-wrap sl-nav">
        <a href="#top" className="sl-brand" aria-label="Sift home">
          <SlDiamond filled />
          Sift
        </a>

        <nav
          className={`sl-nav-links${open ? " sl-open" : ""}`}
          id="sl-navlinks"
          aria-label="Primary"
        >
          {NAV.links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="sl-nav-cta">
          <button
            type="button"
            className="sl-toggle"
            onClick={toggle}
            aria-label={
              mounted
                ? dark
                  ? "Switch to light mode"
                  : "Switch to dark mode"
                : "Toggle dark mode"
            }
          >
            {/* Gated on `mounted` so the icon matches the real (post-hydration)
                theme rather than the server's dark default — avoids a mismatch. */}
            {mounted && (dark ? <MoonIcon /> : <SunIcon />)}
          </button>

          <Link href="/news" className="sl-btn sl-btn-solid">
            {NAV.cta}{" "}
            <span className="sl-arrow" aria-hidden>
              →
            </span>
          </Link>

          <button
            type="button"
            className="sl-menu-btn"
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="sl-navlinks"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? NAV.menuOpen : NAV.menuClosed}
          </button>
        </div>
      </div>
    </header>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}
