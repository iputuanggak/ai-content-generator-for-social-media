/**
 * Strapi v5 REST API Client
 *
 * Encapsulates all Strapi CMS communication.
 * Follows the same pattern as openrouter-client.ts:
 * typed options interfaces, injectable fetchFn, custom StrapiError class,
 * server-side-only env vars (STRAPI_URL, STRAPI_API_TOKEN).
 */

// ─── Response Types ───────────────────────────────────────────────────────────

export interface StrapiCategory {
  documentId: string;
  name: string;
  slug: string;
}

// ─── Blocks Types (Strapi v5 Blocks field) ────────────────────────────────────

export interface StrapiTextNode {
  type: "text";
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
}

export interface StrapiLinkNode {
  type: "link";
  url: string;
  children: StrapiTextNode[];
}

export type StrapiInlineNode = StrapiTextNode | StrapiLinkNode;

export interface StrapiParagraphBlock {
  type: "paragraph";
  children: StrapiInlineNode[];
}

export interface StrapiHeadingBlock {
  type: "heading";
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: StrapiInlineNode[];
}

export interface StrapiListItemBlock {
  type: "list-item";
  children: StrapiInlineNode[];
}

export interface StrapiListBlock {
  type: "list";
  format: "ordered" | "unordered";
  children: StrapiListItemBlock[];
}

export interface StrapiQuoteBlock {
  type: "quote";
  children: StrapiInlineNode[];
}

export interface StrapiCodeBlock {
  type: "code";
  children: StrapiTextNode[];
}

export interface StrapiImageBlock {
  type: "image";
  image: {
    url: string;
    alternativeText: string | null;
    width?: number;
    height?: number;
  };
  children: StrapiInlineNode[];
}

export type StrapiBlock =
  | StrapiParagraphBlock
  | StrapiHeadingBlock
  | StrapiListBlock
  | StrapiQuoteBlock
  | StrapiCodeBlock
  | StrapiImageBlock;

export interface StrapiArticle {
  documentId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: string;
  coverImage: {
    url: string;
    alternativeText: string | null;
  } | null;
  category: StrapiCategory | null;
  content?: StrapiBlock[];
}

export interface StrapiPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface GetArticlesResponse {
  data: StrapiArticle[];
  meta: {
    pagination: StrapiPagination;
  };
}

export interface GetArticleResponse {
  data: StrapiArticle;
}

export interface GetCategoriesResponse {
  data: StrapiCategory[];
}

// ─── Error ────────────────────────────────────────────────────────────────────

export class StrapiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "StrapiError";
  }
}

// ─── Params ───────────────────────────────────────────────────────────────────

export interface GetArticlesParams {
  page?: number;
  pageSize?: number;
  categorySlug?: string;
  /** Override fetch implementation (useful for testing) */
  fetchFn?: typeof fetch;
}

export interface GetArticleBySlugParams {
  slug: string;
  /** Override fetch implementation (useful for testing) */
  fetchFn?: typeof fetch;
}

export interface GetCategoriesParams {
  /** Override fetch implementation (useful for testing) */
  fetchFn?: typeof fetch;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBaseUrl(): string {
  const url = process.env.STRAPI_URL;
  if (!url) {
    throw new StrapiError("STRAPI_URL environment variable is not set");
  }
  return url.replace(/\/$/, "");
}

function getToken(): string {
  const token = process.env.STRAPI_API_TOKEN;
  if (!token) {
    throw new StrapiError("STRAPI_API_TOKEN environment variable is not set");
  }
  return token;
}

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Fetch a paginated list of articles, optionally filtered by category slug.
 */
export async function getArticles({
  page = 1,
  pageSize = 9,
  categorySlug,
  fetchFn = fetch,
}: GetArticlesParams = {}): Promise<GetArticlesResponse> {
  const baseUrl = getBaseUrl();
  const token = getToken();

  const params = new URLSearchParams();
  params.set("pagination[page]", String(page));
  params.set("pagination[pageSize]", String(pageSize));
  params.set("sort", "publishedAt:desc");
  params.set("populate[coverImage][fields][0]", "url");
  params.set("populate[coverImage][fields][1]", "alternativeText");
  params.set("populate[category][fields][0]", "name");
  params.set("populate[category][fields][1]", "slug");

  if (categorySlug) {
    params.set("filters[category][slug][$eq]", categorySlug);
  }

  const url = `${baseUrl}/api/articles?${params.toString()}`;

  const response = await fetchFn(url, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new StrapiError(
      `Strapi API error: ${response.status} ${response.statusText}`,
      response.status
    );
  }

  return response.json() as Promise<GetArticlesResponse>;
}

/**
 * Fetch a single article by its slug.
 * Throws StrapiError with statusCode 404 if not found.
 */
export async function getArticleBySlug({
  slug,
  fetchFn = fetch,
}: GetArticleBySlugParams): Promise<StrapiArticle> {
  const baseUrl = getBaseUrl();
  const token = getToken();

  const params = new URLSearchParams();
  params.set("filters[slug][$eq]", slug);
  params.set("populate[coverImage][fields][0]", "url");
  params.set("populate[coverImage][fields][1]", "alternativeText");
  params.set("populate[category][fields][0]", "name");
  params.set("populate[category][fields][1]", "slug");

  const url = `${baseUrl}/api/articles?${params.toString()}`;

  const response = await fetchFn(url, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new StrapiError(
      `Strapi API error: ${response.status} ${response.statusText}`,
      response.status
    );
  }

  const data = (await response.json()) as GetArticlesResponse;

  if (!data.data || data.data.length === 0) {
    throw new StrapiError(`Article not found: ${slug}`, 404);
  }

  return data.data[0];
}

/**
 * Fetch all categories.
 */
export async function getCategories({
  fetchFn = fetch,
}: GetCategoriesParams = {}): Promise<GetCategoriesResponse> {
  const baseUrl = getBaseUrl();
  const token = getToken();

  const url = `${baseUrl}/api/categories`;

  const response = await fetchFn(url, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new StrapiError(
      `Strapi API error: ${response.status} ${response.statusText}`,
      response.status
    );
  }

  return response.json() as Promise<GetCategoriesResponse>;
}
