import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCustomTopics, saveCustomTopic, deleteCustomTopic } from "@/lib/db";
import type { CustomTopic } from "@/lib/types";
import { MAX_CUSTOM_TOPICS } from "@/lib/constants";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const { topic } = (await request.json()) as { topic: CustomTopic };
    if (!topic || !topic.id || !topic.shortLabel) {
      return NextResponse.json({ error: "Invalid topic" }, { status: 400 });
    }

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
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const { id } = (await request.json()) as { id: string };
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    await deleteCustomTopic(id, userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Topics DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
