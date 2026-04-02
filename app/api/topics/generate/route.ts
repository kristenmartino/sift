import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";
import type { TopicGenerateResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { rawTopic?: string; existingTopics?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawTopic = body.rawTopic?.trim();
  if (!rawTopic || rawTopic.length < 2 || rawTopic.length > 200) {
    return NextResponse.json(
      { error: "Topic must be 2-200 characters" },
      { status: 400 }
    );
  }

  const existingTopics = body.existingTopics || [];

  try {
    const anthropic = new Anthropic();

    const existingClause =
      existingTopics.length > 0
        ? `\nThe user already tracks these topics (avoid duplicates): ${existingTopics.join(", ")}`
        : "";

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `You are helping a user create a personalized news topic for a news aggregator.
They described their interest as: "${rawTopic}"
${existingClause}

Generate a topic configuration:
1. shortLabel: A concise label (12 characters max) for a navigation pill. Be creative but clear.
2. icon: A single emoji that represents this topic.
3. searchQueries: 3-5 specific search queries that would find relevant current news. Be specific — include company names, policy names, geographic areas, and industry terms. Think like a research analyst.
4. description: One sentence explaining what this topic covers.

Respond with ONLY valid JSON, no explanation:
{"shortLabel": "...", "icon": "...", "searchQueries": ["...", "..."], "description": "..."}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 502 }
      );
    }

    const jsonStr = textBlock.text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    let parsed: TopicGenerateResponse;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 502 }
      );
    }

    // Validate and sanitize
    if (!parsed.shortLabel || !parsed.searchQueries || !Array.isArray(parsed.searchQueries)) {
      return NextResponse.json(
        { error: "Invalid AI response structure" },
        { status: 502 }
      );
    }

    // Enforce constraints
    parsed.shortLabel = parsed.shortLabel.slice(0, 12);
    parsed.searchQueries = parsed.searchQueries.slice(0, 5);
    if (parsed.searchQueries.length < 1) {
      parsed.searchQueries = [rawTopic];
    }
    if (!parsed.icon) parsed.icon = "\u2b50";
    if (!parsed.description) parsed.description = rawTopic;

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Topic generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate topic" },
      { status: 500 }
    );
  }
}
