import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  getBookmarks,
  addBookmark,
  removeBookmark,
  getBookmarkedArticles,
  getOutletProfilesMap,
  getArticleEntityLinks,
} from "@/lib/db";
import { mapArticleRows } from "@/lib/articleMapping";
import { enrichArticleEntityLinks } from "@/lib/civicContext";
import type { Article } from "@/lib/types";
import { checkCsrf } from "@/lib/security";
import { internalError, parseJsonBody, unauthorized } from "@/lib/apiResponses";

const bookmarkSchema = z.object({
  articleId: z.string().min(1).max(200),
});

// GET /api/bookmarks — returns bookmark IDs (default) or full articles (?full=1)
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const full = request.nextUrl.searchParams.get("full") === "1";

    if (full) {
      const [rows, outletMap] = await Promise.all([
        getBookmarkedArticles(userId),
        getOutletProfilesMap(),
      ]);
      const entityLinksMap = await getArticleEntityLinks(rows.map((r) => r.id));
      const articles: Article[] = mapArticleRows(rows, {
        outletMap,
        entityLinksMap,
        clean: false,
      });
      // Phase 3.G.3 — enrich politician chips with top-PAC-industry
      // tooltips. Mutates the EntityLink references in place so
      // articles[].entityLinks pick up civicContext without re-mapping.
      // Tolerant of failures (chips still navigate without tooltip).
      await enrichArticleEntityLinks(articles);
      return NextResponse.json({ articles });
    }

    const ids = await getBookmarks(userId);
    return NextResponse.json({ ids });
  } catch (err) {
    console.error("Bookmarks GET error:", err);
    return internalError();
  }
}

// POST /api/bookmarks — body { articleId }
export async function POST(request: NextRequest) {
  const csrfError = checkCsrf(request);
  if (csrfError) return csrfError;

  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const { data, response } = await parseJsonBody(
      request,
      bookmarkSchema,
      "articleId required"
    );
    if (response) return response;
    await addBookmark(userId, data.articleId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Bookmarks POST error:", err);
    return internalError();
  }
}

// DELETE /api/bookmarks — body { articleId }
export async function DELETE(request: NextRequest) {
  const csrfError = checkCsrf(request);
  if (csrfError) return csrfError;

  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const { data, response } = await parseJsonBody(
      request,
      bookmarkSchema,
      "articleId required"
    );
    if (response) return response;
    await removeBookmark(userId, data.articleId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Bookmarks DELETE error:", err);
    return internalError();
  }
}
