import Head from "next/head";
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
        background: "oklch(0.94 0.06 170 / 0.5)",
        color: "oklch(0.40 0.12 170)",
        border: "1px solid oklch(0.55 0.14 170 / 0.2)",
      }}
    >
      {name}
    </span>
  );
}

export default function BlogDetailPage({ article }: BlogDetailPageProps) {
  const coverSrc = article.coverImage?.url
    ? article.coverImage.url.startsWith("http")
      ? article.coverImage.url
      : `${process.env.NEXT_PUBLIC_STRAPI_URL ?? ""}${article.coverImage.url}`
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
        style={{ background: "oklch(0.99 0.005 170)" }}
      >
        <LandingNav />

        {coverSrc ? (
          <div className="relative w-full h-[420px] sm:h-[560px] overflow-hidden">
            <img
              src={coverSrc}
              alt={article.coverImage?.alternativeText ?? article.title}
              className="object-cover w-full h-full"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, transparent 40%, oklch(0.99 0.005 170) 100%)",
              }}
            />
          </div>
        ) : (
          <div
            className="w-full h-64 sm:h-80"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.95 0.03 170) 0%, oklch(0.92 0.04 175) 100%)",
            }}
          />
        )}

        <main className="mx-auto max-w-[720px] px-6 py-12">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {article.category && (
              <CategoryBadge name={article.category.name} />
            )}
            <time
              dateTime={article.publishedAt}
              className="text-sm"
              style={{ color: "oklch(0.45 0.06 170)" }}
            >
              {formatDate(article.publishedAt)}
            </time>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl text-gray-900 leading-tight mb-10">
            {article.title}
          </h1>

          {article.content && article.content.length > 0 && (
            <BlocksRenderer blocks={article.content} />
          )}

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

    return { notFound: true };
  }
};
