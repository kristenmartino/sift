"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { COPY } from "@/lib/copy";
import { computeOutletStats } from "@/lib/outletStats";
import LandingHeader from "./landing/LandingHeader";
import LeadStory from "./landing/LeadStory";
import PrincipleStrip from "./landing/PrincipleStrip";
import Manifesto from "./landing/Manifesto";
import WhatSiftAdds from "./landing/WhatSiftAdds";
import ComparisonDemo from "./landing/ComparisonDemo";
import SourceColophon, {
  type SourceColophonOutlet,
} from "./landing/SourceColophon";
import CtaBand from "./landing/CtaBand";
import LandingFooter from "./landing/LandingFooter";
import type { Article } from "@/lib/types";

interface LandingPageProps {
  /** Server-fetched lead story (ISR @ 600s in app/page.tsx). Null = DB miss. */
  leadStory: Article | null;
  /** Curated outlets from `outlet_profiles` (ISR @ 600s). Empty = DB miss/empty. */
  outlets: SourceColophonOutlet[];
}

const HERO = COPY.landingReskin.hero;

export default function LandingPage({ leadStory, outlets }: LandingPageProps) {
  // Live spectrum stats from the server-fetched outlet list — drives every
  // outlet-count surface on the landing (issue #153). Pure + already-fetched,
  // so no extra round-trip; an empty list (DB miss) degrades to count-free copy.
  const stats = computeOutletStats(outlets);
  const rootRef = useRef<HTMLDivElement>(null);
  // `sl-anim` gates the reveal/stagger starting states. It's added only after
  // mount, and only when motion is allowed — so SSR / no-JS / reduced-motion
  // all render every section fully visible from first paint.
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const reveals = root.querySelectorAll<HTMLElement>("[data-reveal]");

    if (reduceMotion || !("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("in"));
      return;
    }

    setAnimate(true);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    reveals.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div ref={rootRef} className={`sift-landing${animate ? " sl-anim" : ""}`}>
      <LandingHeader />

      <main id="top">
        <section className="sl-hero">
          <div className="sl-wrap sl-hero-grid">
            <div className="sl-hero-copy">
              <span className="sl-eyebrow">{HERO.eyebrow}</span>
              <h1>
                {HERO.headingLead}
                <span className="sl-ul">
                  {HERO.headingAccent}
                  <svg
                    viewBox="0 0 200 14"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 9 C 50 2, 150 2, 198 8"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                .
              </h1>
              <p className="sl-lede">{HERO.lede(stats.total)}</p>
              <div className="sl-hero-actions">
                <Link href="/news" className="sl-btn sl-btn-solid">
                  {HERO.ctaPrimary}{" "}
                  <span className="sl-arrow" aria-hidden>
                    →
                  </span>
                </Link>
                <a href="#adds" className="sl-btn sl-btn-ghost">
                  {HERO.ctaSecondary}
                </a>
              </div>
              <div className="sl-hero-foot">
                <span className="sl-pip" aria-hidden />
                {HERO.foot(stats.total)}
              </div>
            </div>

            <LeadStory article={leadStory} />
          </div>
        </section>

        <PrincipleStrip count={stats.total} />
        <Manifesto stats={stats} />
        <WhatSiftAdds />
        <ComparisonDemo />
        <SourceColophon outlets={outlets} />
        <CtaBand count={stats.total} />
      </main>

      <LandingFooter count={stats.total} />
    </div>
  );
}
