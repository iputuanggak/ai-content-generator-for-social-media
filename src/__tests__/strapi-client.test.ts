import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getArticles,
  getArticleBySlug,
  getCategories,
  StrapiError,
} from "@/lib/strapi-client";

const MOCK_STRAPI_URL = "https://strapi.example.com";
const MOCK_TOKEN = "test-api-token";

function mockFetchOk(body: unknown): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "OK",
    json: () => Promise.resolve(body),
  }) as unknown as typeof fetch;
}

function mockFetchError(status: number, statusText: string): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText,
    json: () => Promise.resolve({ error: statusText }),
  }) as unknown as typeof fetch;
}

function mockFetchNetworkError(): typeof fetch {
  return vi.fn().mockRejectedValue(new Error("Network error")) as unknown as typeof fetch;
}

const sampleArticle = {
  documentId: "article-1",
  title: "Hello World",
  slug: "hello-world",
  excerpt: "A sample excerpt",
  publishedAt: "2024-01-01T00:00:00.000Z",
  cover: {
    url: "/uploads/cover.jpg",
    alternativeText: "Cover image",
  },
  category: {
    documentId: "cat-1",
    name: "Technology",
    slug: "technology",
  },
};

const samplePagination = {
  page: 1,
  pageSize: 9,
  pageCount: 1,
  total: 1,
};

describe("strapi-client", () => {
  beforeEach(() => {
    process.env.STRAPI_URL = MOCK_STRAPI_URL;
    process.env.STRAPI_API_TOKEN = MOCK_TOKEN;
  });

  afterEach(() => {
    delete process.env.STRAPI_URL;
    delete process.env.STRAPI_API_TOKEN;
  });

  describe("getArticles", () => {
    it("calls the correct URL with default pagination", async () => {
      const fetchFn = mockFetchOk({ data: [sampleArticle], meta: { pagination: samplePagination } });
      await getArticles({ fetchFn });

      const calledUrl = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(calledUrl).toContain(`${MOCK_STRAPI_URL}/api/articles`);
      expect(calledUrl).toContain("pagination%5Bpage%5D=1");
      expect(calledUrl).toContain("pagination%5BpageSize%5D=9");
    });

    it("sends Authorization Bearer header", async () => {
      const fetchFn = mockFetchOk({ data: [], meta: { pagination: samplePagination } });
      await getArticles({ fetchFn });

      const calledHeaders = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
      expect(calledHeaders.Authorization).toBe(`Bearer ${MOCK_TOKEN}`);
    });

    it("passes page and pageSize params", async () => {
      const fetchFn = mockFetchOk({ data: [], meta: { pagination: samplePagination } });
      await getArticles({ page: 2, pageSize: 5, fetchFn });

      const calledUrl = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(calledUrl).toContain("pagination%5Bpage%5D=2");
      expect(calledUrl).toContain("pagination%5BpageSize%5D=5");
    });

    it("applies categorySlug filter when provided", async () => {
      const fetchFn = mockFetchOk({ data: [], meta: { pagination: samplePagination } });
      await getArticles({ categorySlug: "technology", fetchFn });

      const calledUrl = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(calledUrl).toContain("technology");
    });

    it("does not include category filter when categorySlug is omitted", async () => {
      const fetchFn = mockFetchOk({ data: [], meta: { pagination: samplePagination } });
      await getArticles({ fetchFn });

      const calledUrl = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(calledUrl).not.toContain("filters%5Bcategory%5D");
    });

    it("returns typed article data and pagination", async () => {
      const fetchFn = mockFetchOk({ data: [sampleArticle], meta: { pagination: samplePagination } });
      const result = await getArticles({ fetchFn });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].documentId).toBe("article-1");
      expect(result.meta.pagination.total).toBe(1);
    });

    it("throws StrapiError on 500 response", async () => {
      const fetchFn = mockFetchError(500, "Internal Server Error");
      await expect(getArticles({ fetchFn })).rejects.toThrow(StrapiError);
    });

    it("throws StrapiError on 401 response", async () => {
      const fetchFn = mockFetchError(401, "Unauthorized");
      await expect(getArticles({ fetchFn })).rejects.toThrow(StrapiError);
    });

    it("propagates network errors", async () => {
      const fetchFn = mockFetchNetworkError();
      await expect(getArticles({ fetchFn })).rejects.toThrow("Network error");
    });

    it("throws StrapiError when STRAPI_URL is missing", async () => {
      delete process.env.STRAPI_URL;
      const fetchFn = mockFetchOk({});
      await expect(getArticles({ fetchFn })).rejects.toThrow(StrapiError);
      await expect(getArticles({ fetchFn })).rejects.toThrow("STRAPI_URL");
    });

    it("throws StrapiError when STRAPI_API_TOKEN is missing", async () => {
      delete process.env.STRAPI_API_TOKEN;
      const fetchFn = mockFetchOk({});
      await expect(getArticles({ fetchFn })).rejects.toThrow(StrapiError);
      await expect(getArticles({ fetchFn })).rejects.toThrow("STRAPI_API_TOKEN");
    });
  });

  describe("getArticleBySlug", () => {
    it("calls the correct URL with slug filter", async () => {
      const fetchFn = mockFetchOk({ data: [sampleArticle], meta: { pagination: samplePagination } });
      await getArticleBySlug({ slug: "hello-world", fetchFn });

      const calledUrl = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(calledUrl).toContain(`${MOCK_STRAPI_URL}/api/articles`);
      expect(calledUrl).toContain("hello-world");
    });

    it("returns the first article from the response", async () => {
      const fetchFn = mockFetchOk({ data: [sampleArticle], meta: { pagination: samplePagination } });
      const result = await getArticleBySlug({ slug: "hello-world", fetchFn });

      expect(result.slug).toBe("hello-world");
      expect(result.title).toBe("Hello World");
    });

    it("throws StrapiError with statusCode 404 when article not found", async () => {
      const fetchFn = mockFetchOk({ data: [], meta: { pagination: { ...samplePagination, total: 0 } } });
      await expect(getArticleBySlug({ slug: "not-found", fetchFn })).rejects.toThrow(StrapiError);

      try {
        await getArticleBySlug({ slug: "not-found", fetchFn });
      } catch (e) {
        expect((e as StrapiError).statusCode).toBe(404);
      }
    });

    it("throws StrapiError on HTTP error", async () => {
      const fetchFn = mockFetchError(403, "Forbidden");
      await expect(getArticleBySlug({ slug: "test", fetchFn })).rejects.toThrow(StrapiError);
    });
  });

  describe("getCategories", () => {
    it("calls the correct URL", async () => {
      const fetchFn = mockFetchOk({ data: [] });
      await getCategories({ fetchFn });

      const calledUrl = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(calledUrl).toBe(`${MOCK_STRAPI_URL}/api/categories`);
    });

    it("sends Authorization Bearer header", async () => {
      const fetchFn = mockFetchOk({ data: [] });
      await getCategories({ fetchFn });

      const calledHeaders = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
      expect(calledHeaders.Authorization).toBe(`Bearer ${MOCK_TOKEN}`);
    });

    it("returns typed category data", async () => {
      const categories = [{ documentId: "cat-1", name: "Tech", slug: "tech" }];
      const fetchFn = mockFetchOk({ data: categories });
      const result = await getCategories({ fetchFn });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].slug).toBe("tech");
    });

    it("throws StrapiError on HTTP error", async () => {
      const fetchFn = mockFetchError(500, "Server Error");
      await expect(getCategories({ fetchFn })).rejects.toThrow(StrapiError);
    });
  });

  describe("StrapiError", () => {
    it("has name StrapiError", () => {
      const err = new StrapiError("test");
      expect(err.name).toBe("StrapiError");
    });

    it("carries statusCode", () => {
      const err = new StrapiError("Not found", 404);
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe("Not found");
    });
  });
});
