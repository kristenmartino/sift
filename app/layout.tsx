import type { Metadata, Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import "./globals.css";

// Self-hosted via next/font: Next downloads the woff2s at build time, serves
// them from /_next/static/media (same-origin, cacheable, no CSP changes), and
// auto-injects <link rel="preload"> for the primary weights. CSS variables
// are wired into Tailwind (font-heading, font-body) and globals.css.
const fontHeading = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-heading",
});

const fontBody = Source_Sans_3({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: {
    default: "Sift — News with context, comparison, and transparency",
    template: "%s | Sift",
  },
  description:
    "Sift reads hundreds of sources and surfaces the civic context the news assumes you already know — with cross-spectrum comparison and the financial and political ties behind every story. Every claim links to a public record.",
  metadataBase: new URL("https://siftnews.kristenmartino.ai"),
  openGraph: {
    title: "Sift — Read the news with the context it deserves",
    description:
      "The civics the news assumes. The framing across the political spectrum. The money and politics behind every story. Linked to public records.",
    siteName: "Sift",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sift — Read the news with the context it deserves",
    description:
      "The civics the news assumes. The framing across the political spectrum. The money and politics behind every story.",
  },
};

// Browser chrome (iOS Safari address bar, Android task switcher) follows the OS
// color-scheme preference, not the user's in-app theme toggle. Late Edition
// background for dark; Newsprint background for light. Matches the CSS
// variables in app/globals.css.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f2ed" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
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
      className={`${fontHeading.variable} ${fontBody.variable}`}
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
      </body>
    </html>
  );
}
