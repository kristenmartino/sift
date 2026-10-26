import type { Article } from "./types";
import { truncateToSentence } from "./utils";

type ArticlePresentation = Pick<Article, "isOpinion" | "isRoundup" | "genre" | "sourceUrl">;

/** Only explicit metadata and publisher URL sections identify a format. */
export function articleContentLabel(article: ArticlePresentation): string | null {
  let sections: string[] = [];
  try {
    const url = new URL(article.sourceUrl);
    if (url.protocol === "https:" || url.protocol === "http:") {
      sections = url.pathname.toLowerCase().split("/").filter(Boolean);
    }
  } catch { /* An absent or invalid source carries no format evidence. */ }
  if (article.isOpinion || sections.some((s) => ["opinion", "opinions", "op-ed", "op-eds", "editorial", "editorials"].includes(s))) return "Opinion";
  if (article.isRoundup) return "Digest";
  if (sections.some((s) => s === "video" || s === "videos")) return "Video";
  if (article.genre === "feature") return "Feature";
  return null;
}

/** A publication-age cue, never a claim about the underlying event date. */
export function isEarlierPublication(publishedDate: string | null, now = Date.now()): boolean {
  const published = publishedDate ? Date.parse(publishedDate) : NaN;
  return Number.isFinite(published) && published <= now - 7 * 86_400_000;
}

const ABBREVIATION = /(?:^|\s)(?:U\.S|U\.K|U\.N|E\.U|D\.C|Mr|Mrs|Ms|Dr|Prof|Sen|Rep|Gov|Gen|Lt|Sgt|Col|St|Jr|Sr|vs|etc|Inc|Corp|Co|Ltd|No|Vol|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept?|Oct|Nov|Dec|a\.m|p\.m|Ph\.D|[A-Z])$/;

/** Prefer whole sentences, including a moderately long opening sentence. */
export function summaryPreview(text: string, targetChars = 220): string {
  const clean = (text ?? "").trim();
  const preview = truncateToSentence(clean, targetChars);
  if (!preview.endsWith("…")) return preview;
  const terminator = /[.!?]["')\]]?(?=\s|$)/g;
  let match: RegExpExecArray | null;
  while ((match = terminator.exec(clean)) !== null) {
    if (ABBREVIATION.test(clean.slice(0, match.index))) continue;
    const end = match.index + match[0].length;
    // Very long/unpunctuated text remains an explicitly labelled excerpt.
    return end <= 600 ? clean.slice(0, end) : preview;
  }
  return preview;
}
