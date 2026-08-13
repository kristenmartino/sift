import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import type { TopicGenerateResponse } from "@/lib/types";
import { rateLimit } from "@/lib/rate-limit";
import { checkCsrf } from "@/lib/security";
import { logUsage } from "@/lib/usage-tracker";
import {
  internalError,
  parseJsonBody,
  tooManyRequests,
  unauthorized,
} from "@/lib/apiResponses";
import { parseJsonFromModel } from "@/lib/modelJson";

const generateSchema = z.object({
  rawTopic: z.string().min(2).max(200),
  existingTopics: z.array(z.string().max(200)).max(20).optional().default([]),
});

export async function POST(request: NextRequest) {
  const csrfError = checkCsrf(request);
  if (csrfError) return csrfError;

  const { userId } = await auth();
  if (!userId) return unauthorized();

  // Rate limit: 10 requests per minute per user
  const rl = rateLimit(`generate:${userId}`, { maxRequests: 10, windowMs: 60_000 });
  if (!rl.allowed) return tooManyRequests(rl.retryAfterMs);

  const { data: body, response } = await parseJsonBody(
    request,
    generateSchema,
    "Invalid input: rawTopic (2-200 chars) is required"
  );
  if (response) return response;

  const rawTopic = body.rawTopic.trim();
  const existingTopics = body.existingTopics;

  try {
    const anthropic = new Anthropic();

    const existingClause =
      existingTopics.length > 0
        ? `\nThe user already tracks these topics (avoid duplicates): ${existingTopics.join(", ")}`
        : "";

    const aiResponse = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `You are helping a user create a personalized news topic for a news aggregator.
They described their interest as:
<user_input>${rawTopic}</user_input>
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
    logUsage("topics.generate", aiResponse, "claude-haiku-4-5");

    const textBlock = aiResponse.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 502 }
      );
    }

    const parsed = parseJsonFromModel<TopicGenerateResponse>(textBlock.text);
    if (!parsed) {
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
    return internalError("Failed to generate topic");
  }
}
