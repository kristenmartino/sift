import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Sift — AI-Curated News, Already Read for You",
    template: "%s | Sift",
  },
  description:
    "AI-curated news summaries from 100+ sources across technology, business, science, energy, world, and health. Updated every 10 minutes.",
  metadataBase: new URL("https://siftnews.kristenmartino.ai"),
  openGraph: {
    title: "Sift — AI-Curated News",
    description:
      "AI-curated news summaries from 100+ sources. Get the key points in 60 seconds.",
    siteName: "Sift",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sift — AI-Curated News",
    description:
      "AI-curated news summaries from 100+ sources. Get the key points in 60 seconds.",
  },
  other: {
    "theme-color": "#0a0a0f",
    "color-scheme": "dark light",
  },
};

const clerkPk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const clerkEnabled = !!clerkPk && clerkPk.startsWith("pk_");

// Blocking script that sets data-theme on <html> before first paint.
// Reads from localStorage; defaults to "dark" if unset.
const themeScript = `(function(){try{var t=JSON.parse(localStorage.getItem("sift-theme"));document.documentElement.dataset.theme=t===false?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const inner = (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a href="#main-content" className="skip-nav">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );

  if (!clerkEnabled) return inner;

  return <ClerkProvider>{inner}</ClerkProvider>;
}
