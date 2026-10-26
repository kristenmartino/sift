import type { FeedItem } from "./types";
import { articleContentLabel } from "./articlePresentation";

export type FeedOrder = "recommended" | "latest";
export type FeedWindow = "all" | "day";
export type FeedFormat = "all" | "groups" | "opinion" | "digests" | "video";

/** Controls apply only to the loaded pool; default order stays untouched. */
export function selectLoadedFeed(items: FeedItem[], order: FeedOrder, window: FeedWindow, checkedAt: number, format: FeedFormat = "all"): FeedItem[] {
  const timestamp = (item: FeedItem): number => {
    const value = item.data.publishedDate ? Date.parse(item.data.publishedDate) : NaN;
    return Number.isFinite(value) && value <= checkedAt ? value : 0;
  };
  const selected = window === "day"
    ? items.filter((item) => timestamp(item) > 0 && timestamp(item) >= checkedAt - 86_400_000)
    : [...items];
  const formatted = selected.filter((item) => {
    if (format === "all") return true;
    if (format === "groups") return item.type === "story";
    if (format === "opinion") return item.type === "story"
      ? Boolean(item.data.isOpinion || item.data.articles.some((article) => articleContentLabel(article) === "Opinion"))
      : articleContentLabel(item.data) === "Opinion";
    return item.type === "article" && articleContentLabel(item.data) === (format === "digests" ? "Digest" : "Video");
  });
  return order === "latest" ? formatted.sort((a, b) => timestamp(b) - timestamp(a)) : formatted;
}
