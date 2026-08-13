import { jsonLdString } from "@/lib/structuredData";

interface JsonLdProps {
  /** A JSON-LD graph built by lib/structuredData.ts. */
  data: Record<string, unknown>;
}

/**
 * Emits a JSON-LD script tag. The serializer escapes `<`, which is what makes
 * the `dangerouslySetInnerHTML` here safe — see lib/structuredData.ts.
 */
export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdString(data) }}
    />
  );
}
