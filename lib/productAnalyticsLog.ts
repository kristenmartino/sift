import { createHash } from "node:crypto";
import pool from "./db";
import { reportError } from "./observability";
import type { ProductEvent } from "./productAnalytics";

export type EventSource = { environment: "production" | "preview" | "development";
  isInternal: boolean; trafficClass: "browser" | "bot" | "unknown" };

export async function logProductEvent(event: ProductEvent, source: EventSource): Promise<"accepted" | "duplicate" | "conflict" | "unavailable"> {
  // Fixed key order: equivalent object key ordering must not cause a conflict.
  const canonical = { eventId: event.eventId, schemaVersion: event.schemaVersion,
    occurredAt: event.occurredAt, browserId: event.browserId, sessionId: event.sessionId,
    eventName: event.eventName, entryPath: event.entryPath, internal: event.internal,
    properties: Object.fromEntries(Object.entries(event.properties).sort(([a], [b]) => a.localeCompare(b))) };
  const hash = createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
  try {
    const result = await pool.query<{ payload_hash: string; inserted: boolean }>(
      `INSERT INTO product_events
        (event_id, schema_version, occurred_at, browser_id, session_id, event_name,
         entry_path, environment, is_internal, traffic_class, properties, payload_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12)
       ON CONFLICT (event_id) DO UPDATE SET payload_hash = product_events.payload_hash
       RETURNING payload_hash, (xmax = 0) AS inserted`,
      [event.eventId, event.schemaVersion, event.occurredAt, event.browserId, event.sessionId,
        event.eventName, event.entryPath, source.environment, source.isInternal,
        source.trafficClass, JSON.stringify(event.properties), hash],
    );
    const row = result.rows[0];
    if (!row) return "unavailable";
    if (row.payload_hash !== hash) return "conflict";
    return row.inserted ? "accepted" : "duplicate";
  } catch (err) {
    // No request body, IDs, SQL parameters or queries are sent to monitoring.
    reportError("productAnalytics.insert", new Error(
      typeof (err as { code?: unknown })?.code === "string" ? String((err as { code: string }).code) : "insert_failed",
    ), { level: "warning" });
    return "unavailable";
  }
}
