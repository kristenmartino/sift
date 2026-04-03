import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { getCustomTopics, saveCustomTopic, deleteCustomTopic } from "@/lib/db";
import type { CustomTopic } from "@/lib/types";
import { MAX_CUSTOM_TOPICS } from "@/lib/constants";
import { checkCsrf } from "@/lib/security";

const topicSchema = z.object({
  topic: z.object({
    id: z.string().min(1).max(200),
    shortLabel: z.string().min(1).max(12),
    icon: z.string().max(10).optional(),
    searchQueries: z.array(z.string().max(500)).min(1).max(5),
    description: z.string().max(500).optional(),
    rawInput: z.string().max(200).optional(),
    createdAt: z.string().optional(),
    colorIndex: z.number().int().min(0).max(100).optional(),
  }),
});

const deleteTopicSchema = z.object({
  id: z.string().min(1).max(200),
});

function unauthorized() {
  return NextResponse.json({ error: "Sign in to manage custom topics" }, { status: 401 });
}

// GET /api/topics — returns user's custom topics
export async function GET() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const rows = await getCustomTopics(userId);
    const topics: CustomTopic[] = rows.map((row) => {
      try {
        return JSON.parse(row.query) as CustomTopic;
      } catch {
        return {
          id: row.id,
          rawInput: row.name,
          shortLabel: row.name.slice(0, 12),
          icon: "\u2b50",
          searchQueries: [row.name],
          description: row.name,
          createdAt: row.created_at.toISOString(),
          colorIndex: 0,
        };
      }
    });
    return NextResponse.json({ topics });
  } catch (err) {
    console.error("Topics GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/topics — body { topic: CustomTopic }
export async function POST(request: NextRequest) {
  const csrfError = checkCsrf(request);
  if (csrfError) return csrfError;

  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    let parsed: z.infer<typeof topicSchema>;
    try {
      parsed = topicSchema.parse(await request.json());
    } catch {
      return NextResponse.json({ error: "Invalid topic" }, { status: 400 });
    }
    const topic = parsed.topic as CustomTopic;

    // Check limit
    const existing = await getCustomTopics(userId);
    if (existing.length >= MAX_CUSTOM_TOPICS) {
      return NextResponse.json(
        { error: "Maximum custom topics reached" },
        { status: 400 }
      );
    }

    await saveCustomTopic(topic.id, userId, topic.shortLabel, JSON.stringify(topic));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Topics POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/topics — body { id }
export async function DELETE(request: NextRequest) {
  const csrfError = checkCsrf(request);
  if (csrfError) return csrfError;

  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    let body: z.infer<typeof deleteTopicSchema>;
    try {
      body = deleteTopicSchema.parse(await request.json());
    } catch {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const { id } = body;
    await deleteCustomTopic(id, userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Topics DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
