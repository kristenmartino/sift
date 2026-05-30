const { withSentryConfig } = require("@sentry/nextjs");
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow news article images from any HTTPS domain.
    // Sift aggregates from 100+ RSS sources with diverse CDN domains,
    // making a strict allowlist impractical. Images are only loaded from
    // URLs stored in the database via trusted RSS feed ingestion.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      // 'unsafe-inline' required for: theme init script (layout.tsx), Tailwind styles, Clerk UI
      "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.services https://clerk.siftnews.kristenmartino.ai https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // font-src: Google Fonts CDN
      "font-src 'self' https://fonts.gstatic.com data:",
      // img-src: self + any HTTPS (news article images from 100+ sources)
      "img-src 'self' https: data:",
      // connect-src: API calls to self, Clerk, server-side proxied services,
      // and the Sentry ingest endpoint (only used when NEXT_PUBLIC_SENTRY_DSN is set)
      "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.services https://clerk.siftnews.kristenmartino.ai https://*.sentry.io",
      // Clerk auth iframes
      "frame-src https://*.clerk.accounts.dev https://*.clerk.services https://clerk.siftnews.kristenmartino.ai https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      // Clerk uses web workers for session management
      "worker-src 'self' blob:",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: csp,
          },
        ],
      },
    ];
  },
};

// Wrap with Sentry. Source-map upload is gated on SENTRY_AUTH_TOKEN, so CI and
// any unconfigured build skip upload and never fail for a missing token.
module.exports = withSentryConfig(withBundleAnalyzer(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  silent: true,
});
