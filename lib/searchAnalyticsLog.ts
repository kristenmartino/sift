/**
 * DB-touching half of search-analytics instrumentation. Kept in its own
 * module so unit tests of the pure helpers (`./searchAnalytics`) can run
 * in jsdom without importing `pg`.
 *
 * `logSearchQuery` is fire-and-forget by contract — the caller awaits but
 * the return value is just for telemetry. INSERT failures are logged here
 * and never propagate; the SSE response completes either way.
 */
import pool from "./db";
import {
  isLoggingEnabled,
  type SearchAnalyticsRow,
} from "./searchAnalytics";

/**
 * Insert one row into `search_queries`. Returns the row's id on success;
 * null on disabled-by-flag, missing-table, or any other failure.
 *
 * Tolerates "table does not exist" gracefully (sift can deploy before the
 * sift-api migration lands without breaking search).
 */
export async function logSearchQuery(
  row: SearchAnalyticsRow,
): Promise<string | null> {
  if (!isLoggingEnabled()) return null;
  try {
    const result = await pool.query<{ id: string }>(
      `INSERT INTO search_queries
        (query, query_norm, query_token_count,
         result_count_vector, result_count_total, fallback_used,
         latency_ms_total, latency_ms_embed, latency_ms_vector, latency_ms_fallback,
         session_id, ip_hash, user_agent_class,
         matched_entity_type, matched_entity_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING id`,
      [
        row.query,
        row.queryNorm,
        row.queryTokenCount,
        row.resultCountVector,
        row.resultCountTotal,
        row.fallbackUsed,
        row.latencyMsTotal,
        row.latencyMsEmbed ?? null,
        row.latencyMsVector ?? null,
        row.latencyMsFallback ?? null,
        row.sessionId ?? null,
        row.ipHash ?? null,
        row.userAgentClass ?? null,
        row.matchedEntityType ?? null,
        row.matchedEntityId ?? null,
      ],
    );
    return result.rows[0]?.id ?? null;
  } catch (err) {
    const msg = String(err);
    if (msg.includes("search_queries") && msg.includes("does not exist")) {
      console.warn(
        "search_queries table not yet provisioned; skipping analytics insert",
      );
      return null;
    }
    console.warn("logSearchQuery failed:", err);
    return null;
  }
}
