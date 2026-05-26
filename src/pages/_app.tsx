import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect, useState } from "react";
import { RouteProgress } from "@/components/route-progress";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { DM_Serif_Display, Plus_Jakarta_Sans } from "next/font/google";
import { GoogleTagManager } from "@next/third-parties/google";

const APP_TITLE = "Lotus — AI Content Generator for Social Media";
const APP_DESCRIPTION =
  "Generate platform-adapted social media content from a single prompt. AI-powered posts for Instagram, TikTok, LinkedIn, Twitter, and more.";
const OG_IMAGE = `${process.env.NEXT_PUBLIC_APP_URL}/opengraph-image.png`;

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-heading",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
    },
  },
});

const dehydrateOptions = {
  shouldDehydrateQuery: (query: { queryKey: readonly unknown[] }) => {
    return query.queryKey[0] === "session";
  },
};

function usePersistQueryClient() {
  const [persister] = useState(() =>
    createSyncStoragePersister({
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      key: "session-cache",
    }),
  );

  useEffect(() => {
    const [unsubscribe] = persistQueryClient({
      queryClient,
      persister,
      maxAge: 30 * 60 * 1000,
      dehydrateOptions,
    });
    return unsubscribe;
  }, [persister]);
}

export default function App({ Component, pageProps }: AppProps) {
  usePersistQueryClient();

  return (
    <div className={`${dmSerifDisplay.variable} ${plusJakartaSans.variable}`}>
      <RouteProgress />
      <Head>
        <title>{APP_TITLE}</title>
        <meta name="description" content={APP_DESCRIPTION} />
        <meta property="og:title" content={APP_TITLE} />
        <meta property="og:description" content={APP_DESCRIPTION} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={APP_TITLE} />
        <meta name="twitter:description" content={APP_DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />
      </Head>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
        <GoogleTagManager gtmId="GTM-5N6WSWTZ" />
      </QueryClientProvider>
    </div>
  );
}
