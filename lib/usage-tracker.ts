// Token usage + cost logging for Anthropic API calls.
// Emits a single structured JSON log line per call so costs can be
// aggregated from server logs (Vercel log drains / console).

// Claude Haiku 4.5 pricing (USD per 1M tokens)
// Source: https://docs.anthropic.com/en/docs/about-claude/pricing
const PRICE_INPUT_PER_M = 1.0;
const PRICE_OUTPUT_PER_M = 5.0;
const PRICE_CACHE_WRITE_5M_PER_M = 1.25;
const PRICE_CACHE_READ_PER_M = 0.1;

// Web search tool: $10 per 1,000 searches
const PRICE_WEB_SEARCH_PER_CALL = 0.01;

type MaybeUsage = {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
} | null
  | undefined;

type MaybeMessage = {
  usage?: MaybeUsage;
  content?: Array<{ type: string; name?: string }>;
};

export interface UsageLog {
  event: "api_usage";
  operation: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
  web_searches: number;
  cost_usd: number;
}

/**
 * Log token usage + estimated cost for an Anthropic Messages response.
 * Swallows all errors so telemetry never breaks the request path.
 */
export function logUsage(
  operation: string,
  response: MaybeMessage,
  model: string = "claude-haiku-4-5",
  webSearches?: number,
): UsageLog | null {
  try {
    const usage = response?.usage ?? null;
    const inputTokens = usage?.input_tokens ?? 0;
    const outputTokens = usage?.output_tokens ?? 0;
    const cacheRead = usage?.cache_read_input_tokens ?? 0;
    const cacheCreation = usage?.cache_creation_input_tokens ?? 0;
    const searches = webSearches ?? countWebSearches(response);

    const costUsd =
      (inputTokens * PRICE_INPUT_PER_M) / 1_000_000 +
      (outputTokens * PRICE_OUTPUT_PER_M) / 1_000_000 +
      (cacheCreation * PRICE_CACHE_WRITE_5M_PER_M) / 1_000_000 +
      (cacheRead * PRICE_CACHE_READ_PER_M) / 1_000_000 +
      searches * PRICE_WEB_SEARCH_PER_CALL;

    const payload: UsageLog = {
      event: "api_usage",
      operation,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cache_read_input_tokens: cacheRead,
      cache_creation_input_tokens: cacheCreation,
      web_searches: searches,
      cost_usd: Math.round(costUsd * 1_000_000) / 1_000_000,
    };
    console.log(JSON.stringify(payload));
    return payload;
  } catch {
    return null;
  }
}

/** Count `server_tool_use` blocks with name="web_search" in a Messages response. */
export function countWebSearches(response: MaybeMessage): number {
  try {
    const content = response?.content ?? [];
    let count = 0;
    for (const block of content) {
      if (block?.type === "server_tool_use" && block?.name === "web_search") {
        count += 1;
      }
    }
    return count;
  } catch {
    return 0;
  }
}
