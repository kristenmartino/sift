import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
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

const clerkPk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const clerkEnabled = !!clerkPk && clerkPk.startsWith("pk_");

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const inner = (
    <html lang="en">
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
