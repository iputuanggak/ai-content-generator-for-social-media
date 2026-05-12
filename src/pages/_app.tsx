import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

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
  shouldDehydrateQuery: (query: { queryKey: unknown[] }) => {
    return query.queryKey[0] === "session";
  },
};

function usePersistQueryClient() {
  const [persister] = useState(() =>
    createSyncStoragePersister({
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      key: "session-cache",
    })
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
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}
