// ─── Domain Types ───────────────────────────────────────

export type CategoryId =
  | "top"
  | "technology"
  | "business"
  | "science"
  | "energy"
  | "world"
  | "health"
  | "politics"
  | "sports"
  | "entertainment";

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  publishedDate: string | null;
  imageUrl: string | null;
  category: CategoryId;
  readTime: number;
}

// ─── API Types ──────────────────────────────────────────

/** Shape of /api/news response */
export interface NewsApiResponse {
  articles: Article[];
  cached: boolean;
  fetchedAt: string;
}

export interface NewsApiError {
  error: string;
  details?: string;
}

/** Shape of /api/news/topic response */
export interface TopicSearchResponse {
  articles: Article[];
  matchQuality: "strong" | "weak";
  fallbackUsed: boolean;
  query: string;
}

/** Shape of /api/compare response */
export interface CompareClaim {
  claim: string;
  agreement: "unanimous" | "majority" | "disputed" | "unique";
  sources?: string[];
  sources_for?: string[];
  sources_against?: string[];
}

export interface CompareResponse {
  topic: string;
  comparison: string;
  sources_checked: string[];
  claims: CompareClaim[];
  duration_ms: number;
}

// ─── SSE Event Types (topic search streaming) ──────────

export interface SSEResultsEvent {
  articles: Article[];
  source: "vector" | "web-search";
}

export interface SSEDoneEvent {
  matchQuality: "strong" | "weak";
  fallbackUsed: boolean;
  query: string;
}

export interface SSEErrorEvent {
  message: string;
}

// ─── Component Props ────────────────────────────────────

export interface ArticleCardProps {
  article: Article;
  featured?: boolean;
  onBookmark: (id: string) => void;
  isBookmarked: boolean;
  index: number;
  onCompare?: (topic: string) => void;
}

export interface CardImageProps {
  src: string | null;
  alt: string;
  featured?: boolean;
  category: CategoryId;
}

export interface SkeletonCardProps {
  featured?: boolean;
}

export interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

// ─── State Types ────────────────────────────────────────

export interface ArticleCache {
  [key: string]: Article[];
}
