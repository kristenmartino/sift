import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  getBookmarks,
  addBookmark,
  removeBookmark,
  getBookmarkedArticles,
} from "@/lib/db";
import { parseContextPrimer } from "@/lib/primer";
import type { Article, CategoryId } from "@/lib/types";
import { checkCsrf } from "@/lib/security";

const bookmarkSchema = z.object({
  articleId: z.string().min(1).max(200),
});

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// GET /api/bookmarks — returns bookmark IDs (default) or full articles (?full=1)
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const full = request.nextUrl.searchParams.get("full") === "1";

    if (full) {
      const rows = await getBookmarkedArticles(userId);
      const articles: Article[] = rows.map((row) => {
        const primer = parseContextPrimer(row.context_primer);
        return {
          id: row.id,
          title: row.title,
          summary: row.summary || "",
          sourceUrl: row.source_url,
          sourceName: row.source_name,
          publishedDate: row.published_date ? row.published_date.toISOString() : null,
          imageUrl: row.image_url,
          category: row.category as CategoryId,
          readTime: row.read_time || 1,
          ...(row.why_it_matters ? { whyItMatters: row.why_it_matters } : {}),
          ...(row.importance_score ? { importanceScore: row.importance_score } : {}),
          ...(primer ? { contextPrimer: primer } : {}),
        };
      });
      return NextResponse.json({ articles });
    }

    const ids = await getBookmarks(userId);
    return NextResponse.json({ ids });
  } catch (err) {
    console.error("Bookmarks GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/bookmarks — body { articleId }
export async function POST(request: NextRequest) {
  const csrfError = checkCsrf(request);
  if (csrfError) return csrfError;

  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    let body: z.infer<typeof bookmarkSchema>;
    try {
      body = bookmarkSchema.parse(await request.json());
    } catch {
      return NextResponse.json({ error: "articleId required" }, { status: 400 });
    }
    await addBookmark(userId, body.articleId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Bookmarks POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/bookmarks — body { articleId }
export async function DELETE(request: NextRequest) {
  const csrfError = checkCsrf(request);
  if (csrfError) return csrfError;

  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    let body: z.infer<typeof bookmarkSchema>;
    try {
      body = bookmarkSchema.parse(await request.json());
    } catch {
      return NextResponse.json({ error: "articleId required" }, { status: 400 });
    }
    await removeBookmark(userId, body.articleId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Bookmarks DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
