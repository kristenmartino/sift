import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sift — AI-Curated News",
  description:
    "Stay informed with AI-curated news summaries across the topics you care about.",
  openGraph: {
    title: "Sift",
    description: "AI-curated news powered by Claude",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-nav">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
