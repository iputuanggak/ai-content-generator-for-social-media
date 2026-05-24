import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { GetStaticProps } from "next";
import { format } from "date-fns";
import { LandingNav } from "@/components/landing-nav";
import { MinimalFooter } from "@/components/minimal-footer";
import { getArticles, getCategories, StrapiArticle, StrapiCategory } from "@/lib/strapi-client";

interface BlogPageProps {
  featuredArticle: StrapiArticle | null;
  articles: StrapiArticle[];
  categories: StrapiCategory[];
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
  if (!article.cover?.url) {
    return (
      <div
        className={`bg-gradient-to-br from-teal-900 to-teal-700 ${className}`}
      />
    );
  }

  const src = article.cover.url.startsWith("http")
    ? article.cover.url
    : `${process.env.NEXT_PUBLIC_STRAPI_URL ?? ""}${article.cover.url}`;

  return (
    <Image
      src={src}
      alt={article.cover.alternativeText ?? article.title}
      fill
      className={`object-cover ${className}`}
    />
  );
}

function CategoryBadge({ name }: { name: string }) {
  return (
    <span
      className="inline-block rounded-full px-3 py-0.5 text-xs font-semibold tracking-wide uppercase"
      style={{
        background: "oklch(0.90 0.08 170 / 0.15)",
        color: "oklch(0.55 0.14 170)",
        border: "1px solid oklch(0.55 0.14 170 / 0.25)",
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
        background: "oklch(0.16 0.04 170)",
        border: "1px solid oklch(0.26 0.06 170)",
      }}
    >
      <div className="relative h-[420px] sm:h-[480px] w-full overflow-hidden">
        <ArticleCoverImage article={article} />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, oklch(0.10 0.04 170 / 0.95) 0%, oklch(0.10 0.04 170 / 0.4) 50%, transparent 100%)",
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
                    background: "oklch(0.55 0.14 170)",
                    color: "oklch(0.98 0.01 170)",
                    border: "1px solid oklch(0.55 0.14 170)",
                  }
                : {
                    background: "oklch(0.16 0.04 170)",
                    color: "oklch(0.70 0.06 170)",
                    border: "1px solid oklch(0.26 0.06 170)",
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
        background: "oklch(0.16 0.04 170)",
        border: "1px solid oklch(0.26 0.06 170)",
      }}
    >
      <div className="relative h-48 w-full overflow-hidden">
        <ArticleCoverImage article={article} />
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: "oklch(0.55 0.14 170 / 0.08)" }}
        />
      </div>
      <div className="flex flex-col flex-1 p-5">
        {article.category && (
          <div className="mb-2">
            <CategoryBadge name={article.category.name} />
          </div>
        )}
        <h3
          className="font-heading text-lg text-white leading-snug group-hover:text-teal-200 transition-colors duration-200 mb-2 line-clamp-2"
        >
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-sm text-white/60 leading-relaxed line-clamp-3 flex-1 mb-4">
            {article.excerpt}
          </p>
        )}
        <p className="text-xs text-white/40 mt-auto">{formatDate(article.publishedAt)}</p>
      </div>
    </Link>
  );
}

export default function BlogPage({ featuredArticle, articles, categories }: BlogPageProps) {
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null);

  const filteredArticles =
    activeCategorySlug === null
      ? articles
      : articles.filter((a) => a.category?.slug === activeCategorySlug);

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
        style={{ background: "oklch(0.12 0.04 170)" }}
      >
        <LandingNav />

        <main className="mx-auto max-w-6xl px-6 py-16">
          {/* Page header */}
          <div className="mb-12 text-center">
            <h1 className="font-heading text-4xl sm:text-5xl text-white mb-4">
              Blog
            </h1>
            <p className="text-white/60 text-lg max-w-xl mx-auto">
              Insights, guides, and updates on AI-powered content creation.
            </p>
          </div>

          {/* Featured hero article */}
          {featuredArticle && (
            <section className="mb-12" aria-label="Featured article">
              <FeaturedHeroCard article={featuredArticle} />
            </section>
          )}

          {/* Category filter */}
          {categories.length > 0 && (
            <CategoryFilter
              categories={categories}
              activeSlug={activeCategorySlug}
              onChange={setActiveCategorySlug}
            />
          )}

          {/* Articles grid */}
          {filteredArticles.length > 0 && (
            <section aria-label="More articles">
              <h2 className="font-heading text-2xl text-white mb-6">
                More articles
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredArticles.map((article) => (
                  <ArticleCard key={article.documentId} article={article} />
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {!featuredArticle && filteredArticles.length === 0 && (
            <div className="text-center py-24">
              <p className="text-white/40 text-lg">No articles yet. Check back soon!</p>
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
    const [{ data }, { data: categoriesData }] = await Promise.all([
      getArticles({ page: 1, pageSize: 9 }),
      getCategories(),
    ]);

    const featuredArticle = data[0] ?? null;
    const articles = data.slice(1);

    return {
      props: {
        featuredArticle,
        articles,
        categories: categoriesData,
      },
      revalidate: 60,
    };
  } catch {
    // If Strapi is unavailable (e.g., env vars not set in build), return empty state
    return {
      props: {
        featuredArticle: null,
        articles: [],
        categories: [],
      },
      revalidate: 60,
    };
  }
};
