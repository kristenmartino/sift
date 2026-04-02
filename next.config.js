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
      "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      // img-src: self + any HTTPS (news article images from 100+ sources)
      "img-src 'self' https: data:",
      // connect-src: API calls to self, Clerk, and server-side proxied services
      "connect-src 'self' https://*.clerk.accounts.dev",
      // Clerk auth iframes
      "frame-src https://*.clerk.accounts.dev https://challenges.cloudflare.com",
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

module.exports = nextConfig;
