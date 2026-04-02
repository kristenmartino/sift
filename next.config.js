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
        ],
      },
    ];
  },
};

module.exports = nextConfig;
