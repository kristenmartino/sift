const { withSentryConfig } = require("@sentry/nextjs");
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allowlist of image hosts, derived from every image_url the pipeline has
    // ever stored (62 registrable domains with >=5 images across 182,855; the 4 that
    // fall below it are one-off singletons).
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
    // To regenerate after adding outlets:
    //   SELECT DISTINCT ... FROM articles WHERE image_url IS NOT NULL
    // grouped by registrable domain, keeping those with >=5 images.
    remotePatterns: [
      "abc-cdn.net.au", "abcnews.com", "amazonaws.com", "aolcdn.com",
      "arstechnica.net", "axios.com", "bwbx.io", "cbsistatic.com",
      "cdn-si-edu.com", "cloudfront.net", "ctfassets.net", "dailycaller.com",
      "deadline.com", "decider.com", "decrypt.co", "dwcdn.net",
      "engadget.com", "forbes.com", "foreignpolicy.com", "fortune.com",
      "foxnews.com", "france24.com", "ft.com", "futurecdn.net",
      "guim.co.uk", "i-scmp.com", "ieee.org", "ignimgs.com", "insider.com",
      "japantimes.co.jp", "jwplayer.com", "minutemediacdn.com", "mktw.net",
      "nasa.gov", "newscientist.com", "nypost.com", "nyt.com",
      "opensecrets.org", "pagesix.com", "pitchfork.com", "politico.com",
      "polygonimages.com", "quantamagazine.org", "qz.com", "rbl.ms",
      "restofworld.org", "rollcall.com", "sciencenews.org", "slate.com",
      "statnews.com", "theatlantic.com", "thediplomat.com", "thedispatch.com",
      "thehill.com", "theintercept.com", "toiimg.com", "variety.com",
      "washingtonexaminer.com", "washtimes.com", "wired.com", "wp.com",
      "youtube.com",
    ].flatMap((domain) => [
      { protocol: "https", hostname: domain },
      { protocol: "https", hostname: `**.${domain}` },
    ]),
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
