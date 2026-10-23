import { z } from "zod";
import { ENTRY_PATHS, PRODUCT_EVENTS } from "./productAnalytics";

export const productEventSchema = z.object({
  eventId: z.uuid(), schemaVersion: z.literal(1),
  occurredAt: z.iso.datetime(), browserId: z.uuid(), sessionId: z.uuid(),
  eventName: z.enum(PRODUCT_EVENTS), entryPath: z.enum(ENTRY_PATHS),
  internal: z.boolean(),
  properties: z.object({
    contentId: z.string().regex(/^[a-zA-Z0-9_:.-]{1,80}$/).optional(),
    requestId: z.uuid().optional(),
    surface: z.enum(["feed", "bookmarks", "search", "custom_topic", "live_compare", "daily_compare", "landing"]).optional(),
    resultCount: z.number().int().min(0).max(10000).optional(),
    latencyMs: z.number().int().min(0).max(600000).optional(),
    status: z.enum(["success", "error", "cancelled", "timeout", "incomplete"]).optional(),
  }).strict(),
}).strict();
