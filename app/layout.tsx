import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Fraunces, Hanken_Grotesk, DM_Mono } from "next/font/google";
import "./globals.css";

// Self-hosted via next/font: Next downloads the woff2s at build time, serves
// them from /_next/static/media (same-origin, cacheable, no CSP changes), and
// auto-injects <link rel="preload"> for the primary weights. CSS variables
// are wired into Tailwind (font-heading, font-body, font-mono) and globals.css.
//
// Fraunces is a variable font — we omit `weight` to keep the full wght range
// and opt into the optical-size axis so large display headings get the high-
// contrast cut while body-sized headings stay readable. Italics are pulled in
// for the editorial accent spans (e.g. the vermillion emphasis in headings).
const fontHeading = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-heading",
});

const fontBody = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-body",
});

// DM Mono is not variable — request the two cuts we use for eyebrows, labels,
// captions, and footnote markers.
const fontMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Sift — The news, with footnotes.",
    template: "%s | Sift",
  },
  description:
    "Sift curates outlets across the political spectrum and adds the footnotes — the civic context the news assumes, the framing across the spectrum, and the financial and political ties behind every story. Every claim links to a public record.",
  // siftnews.io as of 2026-07-28. Drives canonical URLs and OG/Twitter card
  // resolution, so it has to be the domain people are actually sent to —
  // /agencies and /think-tanks go out in the week-one test on this host.
  //
  // The three Clerk entries in next.config.js still pin
  // clerk.siftnews.kristenmartino.ai. That is deliberate and separable: the
  // pages being sent use no auth, so they serve correctly here, while
  // sign-in / bookmarks / compare stay on the old host until the Clerk
  // production instance is migrated. See docs/WEEK_ONE_OUTREACH.md.
  metadataBase: new URL("https://siftnews.io"),
  openGraph: {
    title: "Sift — The news, with footnotes.",
    description:
      "The civic context the news assumes. The framing across the political spectrum. The money behind every story. Linked to public records.",
    siteName: "Sift",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sift — The news, with footnotes.",
    description:
      "The civic context the news assumes. The framing across the political spectrum. The money behind every story.",
  },
};

// Browser chrome (iOS Safari address bar, Android task switcher) follows the OS
// color-scheme preference, not the user's in-app theme toggle. Warm paper for
// light; deep ink for dark. Matches the --paper token in app/globals.css.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF8F1" },
    { media: "(prefers-color-scheme: dark)", color: "#15120C" },
  ],
  colorScheme: "dark light",
};

// Blocking script that sets data-theme on <html> before first paint.
// Reads from localStorage; defaults to "dark" if unset.
const themeScript = `(function(){try{var t=JSON.parse(localStorage.getItem("sift-theme"));document.documentElement.dataset.theme=t===false?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${fontHeading.variable} ${fontBody.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a href="#main-content" className="skip-nav">
          Skip to content
        </a>
        {children}
        <SpeedInsights />
        {/* Vercel Analytics: privacy-friendly page-view counts (no cookies,
            no cross-site tracking, GDPR/CCPA-clean by default). Free hobby
            tier covers ~25k events/mo. */}
        <Analytics />
      </body>
    </html>
  );
}
