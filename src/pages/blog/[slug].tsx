import Head from "next/head";
import Image from "next/image";
import { GetStaticPaths, GetStaticProps } from "next";
import { format } from "date-fns";
import { LandingNav } from "@/components/landing-nav";
import { MinimalFooter } from "@/components/minimal-footer";
import { BlocksRenderer } from "@/components/blocks-renderer";
import { BlogCta } from "@/components/blog-cta";
import {
  getArticleBySlug,
  getArticles,
  StrapiArticle,
} from "@/lib/strapi-client";

interface BlogDetailPageProps {
  article: StrapiArticle;
}

function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), "MMMM d, yyyy");
  } catch {
    return dateString;
  }
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

export default function BlogDetailPage({ article }: BlogDetailPageProps) {
  const coverSrc = article.cover?.url
    ? article.cover.url.startsWith("http")
      ? article.cover.url
      : `${process.env.NEXT_PUBLIC_STRAPI_URL ?? ""}${article.cover.url}`
    : null;

  const metaTitle = `${article.title} — Lotus`;
  const metaDescription =
    article.excerpt ?? "Read this article on the Lotus blog.";

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        {coverSrc && <meta property="og:image" content={coverSrc} />}
      </Head>

      <div
        className="min-h-screen"
        style={{ background: "oklch(0.12 0.04 170)" }}
      >
        <LandingNav />

        {/* Full-width cover image */}
        {coverSrc ? (
          <div className="relative w-full h-[420px] sm:h-[560px] overflow-hidden">
            <Image
              src={coverSrc}
              alt={article.cover?.alternativeText ?? article.title}
              fill
              className="object-cover"
              priority
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, transparent 40%, oklch(0.12 0.04 170) 100%)",
              }}
            />
          </div>
        ) : (
          <div
            className="w-full h-64 sm:h-80"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.18 0.06 170) 0%, oklch(0.15 0.08 175) 100%)",
            }}
          />
        )}

        <main className="mx-auto max-w-[720px] px-6 py-12">
          {/* Category + date */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {article.category && (
              <CategoryBadge name={article.category.name} />
            )}
            <time
              dateTime={article.publishedAt}
              className="text-sm"
              style={{ color: "oklch(0.55 0.06 170)" }}
            >
              {formatDate(article.publishedAt)}
            </time>
          </div>

          {/* Title */}
          <h1 className="font-heading text-4xl sm:text-5xl text-white leading-tight mb-10">
            {article.title}
          </h1>

          {/* Body */}
          {article.blocks && article.blocks.length > 0 && (
            <BlocksRenderer blocks={article.blocks} />
          )}

          {/* CTA */}
          <div className="mt-16">
            <BlogCta />
          </div>
        </main>

        <MinimalFooter />
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const { data } = await getArticles({ page: 1, pageSize: 100 });
    const paths = data.map((article) => ({
      params: { slug: article.slug },
    }));
    return { paths, fallback: "blocking" };
  } catch {
    return { paths: [], fallback: "blocking" };
  }
};

export const getStaticProps: GetStaticProps<BlogDetailPageProps> = async ({
  params,
}) => {
  const slug = params?.slug as string;

  try {
    const article = await getArticleBySlug({ slug });
    return {
      props: { article },
      revalidate: 60,
    };
  } catch (err: unknown) {
    const statusCode =
      err instanceof Error && "statusCode" in err
        ? (err as { statusCode?: number }).statusCode
        : undefined;

    if (statusCode === 404) {
      return { notFound: true };
    }

    // Strapi unavailable — return not found rather than crashing
    return { notFound: true };
  }
};
