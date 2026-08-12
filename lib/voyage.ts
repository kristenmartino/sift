/**
 * Voyage AI embeddings client — the one place the HTTP call lives.
 *
 * Topic search embeds three different things (the live query, the category
 * descriptions, and the web-search fallback's articles) and each had its own
 * copy of the same fetch, differing only in `input_type` and its error text.
 */
const VOYAGE_EMBEDDINGS_URL = "https://api.voyageai.com/v1/embeddings";
export const VOYAGE_MODEL = "voyage-3-lite";

function apiKey(): string {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) throw new Error("VOYAGE_API_KEY environment variable is not set");
  return key;
}

/**
 * Embeds `texts` and returns one vector per input, in order.
 *
 * `inputType` is Voyage's asymmetric-retrieval hint: "query" for a search
 * string, "document" for the corpus side. Throws on a non-2xx response — the
 * fallback paths that can live without embeddings catch it themselves.
 */
export async function embedTexts(
  texts: string[],
  inputType: "query" | "document",
): Promise<number[][]> {
  const res = await fetch(VOYAGE_EMBEDDINGS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: texts,
      model: VOYAGE_MODEL,
      input_type: inputType,
    }),
  });

  if (!res.ok) {
    throw new Error(`Voyage API error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as { data: { embedding: number[] }[] };
  return data.data.map((d) => d.embedding);
}
