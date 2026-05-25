import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { GetStaticProps } from "next";
import { format } from "date-fns";
import { LandingNav } from "@/components/landing-nav";
import { MinimalFooter } from "@/components/minimal-footer";
import { getArticles, getCategories, StrapiArticle, StrapiCategory, StrapiPagination } from "@/lib/strapi-client";

interface BlogPageProps {
  featuredArticle: StrapiArticle | null;
  articles: StrapiArticle[];
  categories: StrapiCategory[];
  pagination: StrapiPagination;
}

function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), "MMMM d, yyyy");
  } catch {
    return dateString;
  }
}

function ArticleCoverImage({
  article,
  className,
}: {
  article: StrapiArticle;
  className?: string;
}) {
  if (!article.coverImage?.url) {
    return (
      <div
        className={`bg-gradient-to-br from-teal-100 to-teal-50 ${className}`}
      />
    );
  }

  const src = article.coverImage.url.startsWith("http")
    ? article.coverImage.url
    : `${process.env.NEXT_PUBLIC_STRAPI_URL ?? ""}${article.coverImage.url}`;

  return (
    <img
      src={src}
      alt={article.coverImage.alternativeText ?? article.title}
      className={`object-cover w-full h-full ${className}`}
    />
  );
}

function CategoryBadge({ name }: { name: string }) {
  return (
    <span
      className="inline-block rounded-full px-3 py-0.5 text-xs font-semibold tracking-wide uppercase"
      style={{
        background: "oklch(0.94 0.06 170 / 0.5)",
        color: "oklch(0.40 0.12 170)",
        border: "1px solid oklch(0.55 0.14 170 / 0.2)",
      }}
    >
      {name}
    </span>
  );
}

function FeaturedHeroCard({ article }: { article: StrapiArticle }) {
  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group relative block overflow-hidden rounded-2xl"
      style={{
        background: "oklch(0.97 0.02 170)",
        border: "1px solid oklch(0.88 0.04 170)",
        boxShadow: "0 8px 40px oklch(0.40 0.10 170 / 0.08)",
      }}
    >
      <div className="relative h-[420px] sm:h-[480px] w-full overflow-hidden">
        <ArticleCoverImage article={article} />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, oklch(0.12 0.04 170 / 0.92) 0%, oklch(0.12 0.04 170 / 0.3) 50%, transparent 100%)",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          {article.category && (
            <div className="mb-3">
              <CategoryBadge name={article.category.name} />
            </div>
          )}
          <h2
            className="font-heading text-2xl sm:text-3xl lg:text-4xl text-white leading-tight group-hover:text-teal-200 transition-colors duration-200 mb-3"
          >
            {article.title}
          </h2>
          {article.excerpt && (
            <p className="text-sm sm:text-base text-white/70 leading-relaxed line-clamp-2 mb-4">
              {article.excerpt}
            </p>
          )}
          <p className="text-xs text-white/50">{formatDate(article.publishedAt)}</p>
        </div>
      </div>
    </Link>
  );
}

function CategoryFilter({
  categories,
  activeSlug,
  onChange,
}: {
  categories: StrapiCategory[];
  activeSlug: string | null;
  onChange: (slug: string | null) => void;
}) {
  const tabs = [{ documentId: "__all__", name: "All", slug: null as string | null }, ...categories.map((c) => ({ ...c, slug: c.slug as string | null }))];

  return (
    <div
      className="flex flex-wrap gap-2 mb-8"
      role="tablist"
      aria-label="Filter by category"
    >
      {tabs.map((tab) => {
        const isActive = tab.slug === activeSlug;
        return (
          <button
            key={tab.documentId}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.slug)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2"
            style={
              isActive
                ? {
                    background: "oklch(0.40 0.12 170)",
                    color: "oklch(0.98 0.01 170)",
                    border: "1px solid oklch(0.40 0.12 170)",
                  }
                : {
                    background: "oklch(0.97 0.02 170)",
                    color: "oklch(0.35 0.06 170)",
                    border: "1px solid oklch(0.88 0.04 170)",
                  }
            }
          >
            {tab.name}
          </button>
        );
      })}
    </div>
  );
}

function ArticleCard({ article }: { article: StrapiArticle }) {
  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl transition-all duration-200 hover:-translate-y-1"
      style={{
        background: "oklch(0.97 0.02 170)",
        border: "1px solid oklch(0.88 0.04 170)",
        boxShadow: "0 2px 12px oklch(0.40 0.10 170 / 0.05)",
      }}
    >
      <div className="relative h-48 w-full overflow-hidden">
        <ArticleCoverImage article={article} />
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: "oklch(0.40 0.12 170 / 0.06)" }}
        />
      </div>
      <div className="flex flex-col flex-1 p-5">
        {article.category && (
          <div className="mb-2">
            <CategoryBadge name={article.category.name} />
          </div>
        )}
        <h3
          className="font-heading text-lg text-gray-900 leading-snug group-hover:text-teal-700 transition-colors duration-200 mb-2 line-clamp-2"
        >
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 flex-1 mb-4">
            {article.excerpt}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-auto">{formatDate(article.publishedAt)}</p>
      </div>
    </Link>
  );
}

const PAGE_SIZE = 6;

export default function BlogPage({ featuredArticle, articles, categories, pagination }: BlogPageProps) {
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null);
  const [extraArticles, setExtraArticles] = useState<StrapiArticle[]>([]);
  const [currentPage, setCurrentPage] = useState(pagination.page);
  const [pageCount, setPageCount] = useState(pagination.pageCount);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  function handleCategoryChange(slug: string | null) {
    setActiveCategorySlug(slug);
    setExtraArticles([]);
    setCurrentPage(1);
    setPageCount(pagination.pageCount);
  }

  const baseArticles = activeCategorySlug === null
    ? articles
    : articles.filter((a) => a.category?.slug === activeCategorySlug);

  const filteredArticles = [...baseArticles, ...extraArticles];

  const hasMore = currentPage < pageCount;

  async function handleLoadMore() {
    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("pageSize", String(PAGE_SIZE));
      if (activeCategorySlug) params.set("categorySlug", activeCategorySlug);

      const res = await fetch(`/api/blog/articles?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setExtraArticles((prev) => [...prev, ...data.data]);
      setCurrentPage(data.meta.pagination.page);
      setPageCount(data.meta.pagination.pageCount);
    } catch {
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <>
      <Head>
        <title>Blog — Lotus</title>
        <meta
          name="description"
          content="Insights, guides, and updates from the Lotus team on AI-powered social media content creation."
        />
        <meta property="og:title" content="Blog — Lotus" />
        <meta
          property="og:description"
          content="Insights, guides, and updates from the Lotus team on AI-powered social media content creation."
        />
      </Head>

      <div
        className="min-h-screen"
        style={{ background: "oklch(0.99 0.005 170)" }}
      >
        <LandingNav />

        <main className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-12 text-center">
            <h1 className="font-heading text-4xl sm:text-5xl text-gray-900 mb-4">
              Blog
            </h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Insights, guides, and updates on AI-powered content creation.
            </p>
          </div>

          {featuredArticle && (
            <section className="mb-12" aria-label="Featured article">
              <FeaturedHeroCard article={featuredArticle} />
            </section>
          )}

          {categories.length > 0 && (
            <CategoryFilter
              categories={categories}
              activeSlug={activeCategorySlug}
              onChange={handleCategoryChange}
            />
          )}

          {filteredArticles.length > 0 && (
            <section aria-label="More articles">
              <h2 className="font-heading text-2xl text-gray-900 mb-6">
                More articles
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredArticles.map((article) => (
                  <ArticleCard key={article.documentId} article={article} />
                ))}
              </div>

              {hasMore && (
                <div className="mt-10 flex justify-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="px-8 py-3 rounded-full text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background: "oklch(0.97 0.02 170)",
                      color: "oklch(0.35 0.06 170)",
                      border: "1px solid oklch(0.88 0.04 170)",
                    }}
                  >
                    {isLoadingMore ? "Loading…" : "Load more"}
                  </button>
                </div>
              )}
            </section>
          )}

          {!featuredArticle && filteredArticles.length === 0 && (
            <div className="text-center py-24">
              <p className="text-gray-400 text-lg">No articles yet. Check back soon!</p>
            </div>
          )}
        </main>

        <MinimalFooter />
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps<BlogPageProps> = async () => {
  try {
    const [{ data, meta }, { data: categoriesData }] = await Promise.all([
      getArticles({ page: 1, pageSize: 6 }),
      getCategories(),
    ]);

    const { pagination } = meta;
    const featuredArticle = data[0] ?? null;
    const articles = data.slice(1);

    return {
      props: {
        featuredArticle,
        articles,
        categories: categoriesData,
        pagination,
      },
      revalidate: 60,
    };
  } catch (err) {
    console.error("[blog] getStaticProps failed:", err);
    return {
      props: {
        featuredArticle: null,
        articles: [],
        categories: [],
        pagination: { page: 1, pageSize: 6, pageCount: 1, total: 0 },
      },
      revalidate: 60,
    };
  }
};
