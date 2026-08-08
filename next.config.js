const { withSentryConfig } = require("@sentry/nextjs");
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allowlist of image hosts, derived from every image_url the pipeline has
    // ever stored. Next caps this array at 50 entries, so the 48 domains that
    // fit are chosen by CURRENT activity rather than all-time volume:
    // 100% of the last 30 days' images are covered and no active host is
    // dropped, against 99.34% of the all-time corpus. Ranking by lifetime
    // volume instead would have dropped decider.com, dwcdn.net and
    // boltdns.net, all of which are still serving.
    //
    // One pattern per domain where the data allows it — `**.d` for the 39
    // that only ever serve from subdomains, bare `d` for the apex-only ones.
    //
    // This was `hostname: "**"`, justified as "images are only loaded from
    // URLs stored in the database via trusted RSS feed ingestion". That is
    // true of the *app* and irrelevant to the risk: `/_next/image` is a public
    // endpoint that takes an arbitrary `url` parameter. With a wildcard,
    // anyone can point it at any HTTPS resource on the internet and bill this
    // account's Vercel image-optimization quota — the app's own behaviour
    // constrains nothing. remotePatterns is the only thing that does.
    //
    // Narrowing is low-risk here: components/CardImage.tsx already has an
    // onError handler, so a host that is not on this list degrades to the
    // same placeholder a broken image URL produces today. Many outlets (CBS
    // News, BBC, ESPN, NPR, Washington Post) serve no images at all and are
    // unaffected either way.
    //
    // Shared CDNs — cloudfront.net, amazonaws.com, jwplayer.com — are
    // necessarily broad, so this narrows the hole rather than closing it. It
    // still cuts the reachable surface from "the entire HTTPS internet" to a
    // handful of CDNs.
    //
    // To regenerate after adding outlets: group articles.image_url by
    // registrable domain, order by last-30-day count, and take domains until
    // the pattern count hits 50.
    remotePatterns: [
      { protocol: "https", hostname: "**.abc-cdn.net.au" },
      { protocol: "https", hostname: "**.abcnews.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.aolcdn.com" },
      { protocol: "https", hostname: "**.arstechnica.net" },
      { protocol: "https", hostname: "**.axios.com" },
      { protocol: "https", hostname: "**.boltdns.net" },
      { protocol: "https", hostname: "**.bwbx.io" },
      { protocol: "https", hostname: "**.cbsistatic.com" },
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "**.dailycaller.com" },
      { protocol: "https", hostname: "**.decrypt.co" },
      { protocol: "https", hostname: "**.dwcdn.net" },
      { protocol: "https", hostname: "**.forbes.com" },
      { protocol: "https", hostname: "**.foxnews.com" },
      { protocol: "https", hostname: "**.france24.com" },
      { protocol: "https", hostname: "**.ft.com" },
      { protocol: "https", hostname: "**.futurecdn.net" },
      { protocol: "https", hostname: "**.guim.co.uk" },
      { protocol: "https", hostname: "**.i-scmp.com" },
      { protocol: "https", hostname: "**.ignimgs.com" },
      { protocol: "https", hostname: "**.insider.com" },
      { protocol: "https", hostname: "**.japantimes.co.jp" },
      { protocol: "https", hostname: "**.minutemediacdn.com" },
      { protocol: "https", hostname: "**.mktw.net" },
      { protocol: "https", hostname: "**.nypost.com" },
      { protocol: "https", hostname: "**.nyt.com" },
      { protocol: "https", hostname: "**.pitchfork.com" },
      { protocol: "https", hostname: "**.politico.com" },
      { protocol: "https", hostname: "**.polygonimages.com" },
      { protocol: "https", hostname: "**.slate.com" },
      { protocol: "https", hostname: "**.statnews.com" },
      { protocol: "https", hostname: "**.theatlantic.com" },
      { protocol: "https", hostname: "**.toiimg.com" },
      { protocol: "https", hostname: "**.variety.com" },
      { protocol: "https", hostname: "**.washingtonexaminer.com" },
      { protocol: "https", hostname: "**.washtimes.com" },
      { protocol: "https", hostname: "**.wired.com" },
      { protocol: "https", hostname: "**.wp.com" },
      { protocol: "https", hostname: "deadline.com" },
      { protocol: "https", hostname: "decider.com" },
      { protocol: "https", hostname: "foreignpolicy.com" },
      { protocol: "https", hostname: "fortune.com" },
      { protocol: "https", hostname: "nypost.com" },
      { protocol: "https", hostname: "pagesix.com" },
      { protocol: "https", hostname: "qz.com" },
      { protocol: "https", hostname: "thedispatch.com" },
      { protocol: "https", hostname: "thehill.com" },
      { protocol: "https", hostname: "theintercept.com" },
      { protocol: "https", hostname: "variety.com" },
    ],
    // The feed rotates every 30 minutes, so without this each generated width
    // of each new image is re-transformed far more often than it is served.
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      // 'unsafe-inline' required for: theme init script (layout.tsx), Tailwind styles, Clerk UI
      "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.services https://clerk.siftnews.kristenmartino.ai https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // font-src: Google Fonts CDN
      "font-src 'self' https://fonts.gstatic.com data:",
      // img-src: self + any HTTPS (news article images from ~58 sources)
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
