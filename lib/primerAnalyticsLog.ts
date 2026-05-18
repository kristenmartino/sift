/**
 * DB-touching half of primer-expand instrumentation. Kept separate from
 * the route + client wiring so server-only Node APIs (crypto/HMAC, pg)
 * never leak into the client bundle.
 *
 * `logPrimerExpand` is fire-and-forget — failure is logged here and
 * never propagates. The user's expand experience always completes.
 *
 * See lib/searchAnalytics.ts for the matching helpers (hashIp,
 * classifyUserAgent, isLoggingEnabled). We reuse them as-is so the
 * privacy posture stays consistent across both analytics tables.
 */
import pool from "./db";
import { isLoggingEnabled } from "./searchAnalytics";

export interface PrimerExpandRow {
  articleId: string | null;
  surface: string | null;          // 'feed' | 'bookmarks' | future
  sessionId: string | null;
  ipHash: string | null;
  userAgentClass: string | null;
}

/**
 * Insert one row into `primer_expand_events`. Returns the row's id on
 * success; null on disabled-by-flag, missing-table, or any other failure.
 *
 * Tolerates "table does not exist" gracefully — sift can deploy before
 * the sift-api migration lands without breaking primer behavior.
 */
export async function logPrimerExpand(
  row: PrimerExpandRow,
): Promise<string | null> {
  if (!isLoggingEnabled()) return null;
  try {
    const result = await pool.query<{ id: string }>(
      `INSERT INTO primer_expand_events
        (article_id, surface, session_id, ip_hash, user_agent_class)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id`,
      [
        row.articleId,
        row.surface,
        row.sessionId,
        row.ipHash,
        row.userAgentClass,
      ],
    );
    return result.rows[0]?.id ?? null;
  } catch (err) {
    const msg = String(err);
    if (
      msg.includes("primer_expand_events") &&
      msg.includes("does not exist")
    ) {
      console.warn(
        "primer_expand_events table not yet provisioned; skipping insert",
      );
      return null;
    }
    console.warn("logPrimerExpand failed:", err);
    return null;
  }
}
