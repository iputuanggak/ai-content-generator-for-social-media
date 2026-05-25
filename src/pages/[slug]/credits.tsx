import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { useRouter } from "next/router";
import type { NextRouter } from "next/router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useTeam } from "@/lib/team-context";
import { useCredits } from "@/lib/use-credits";
import { ContentSkeleton } from "@/components/content-skeleton";
import { PACKAGES } from "@/lib/packages";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { useRequireVerifiedEmail } from "@/lib/use-require-verified-email";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  referenceId: string | null;
  balanceBefore: number | null;
  balanceAfter: number | null;
  createdAt: string;
}

const PAGE_SIZE = 20;

const TYPE_LABELS: Record<string, string> = {
  starter_grant: "Starter Grant",
  top_up: "Top-Up",
  generation: "Generation",
  regeneration: "Regeneration",
  batch_expiry: "Batch Expiry",
};

function formatTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

function formatAmount(amount: number): { text: string; className: string } {
  if (amount > 0) {
    return { text: `+${amount}`, className: "text-emerald-600 font-semibold" };
  }
  if (amount < 0) {
    return { text: `${amount}`, className: "text-red-600 font-semibold" };
  }
  return { text: "0", className: "text-zinc-500" };
}

export default function CreditsPage() {
  const { loading: verifyLoading } = useRequireVerifiedEmail();
  if (verifyLoading) return null;
  return (
    <DashboardLayout>
      <CreditsContent />
    </DashboardLayout>
  );
}

function TopUpCards({ slug, router }: { slug: string | null; router: NextRouter }) {
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);

  async function handleBuy(packageSlug: string) {
    setLoadingSlug(packageSlug);
    try {
      const res = await fetch(`/api/${slug}/credits/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageSlug }),
      });
      if (!res.ok) {
        toast.error("Failed to start checkout");
        return;
      }
      const { url } = (await res.json()) as { url: string };
      router.push(url);
    } catch {
      toast.error("Failed to start checkout");
    } finally {
      setLoadingSlug(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {PACKAGES.map((pkg) => (
        <div
          key={pkg.slug}
          className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold capitalize text-zinc-900">{pkg.slug}</h3>
          <p className="mt-1 text-3xl font-bold text-zinc-900">{pkg.credits} credits</p>
          <p className="mt-1 text-sm text-zinc-500">{pkg.perCreditLabel}</p>
          <div className="mt-auto pt-6">
            <p className="text-2xl font-semibold text-zinc-900">{pkg.priceLabel}</p>
            <Button
              className="mt-3 w-full"
              onClick={() => handleBuy(pkg.slug)}
              disabled={loadingSlug !== null}
            >
              {loadingSlug === pkg.slug ? "Redirecting..." : "Buy"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function CreditsContent() {
  const { slug } = useTeam();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: creditsData } = useCredits();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (router.query.topup === "success") {
      toast.success("Credits added!");
      queryClient.invalidateQueries({ queryKey: ["credits", slug] });
      router.replace(`/${slug}/credits`, undefined, { shallow: true });
    } else if (router.query.topup === "cancelled") {
      toast.info("Top-up cancelled.");
      router.replace(`/${slug}/credits`, undefined, { shallow: true });
    }
  }, [router.query.topup, slug, queryClient, router]);

  const fetchTransactions = useCallback(async (pg: number) => {
    const res = await fetch(`/api/${slug}/credits/transactions?page=${pg}`);
    if (res.ok) {
      return (await res.json()) as { items: Transaction[]; total: number; page: number; pageSize: number };
    }
    return null;
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    fetchTransactions(page).then((data) => {
      if (!cancelled && data) {
        setTransactions(data.items);
        setTotal(data.total);
      }
    }).finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [fetchTransactions, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const expiringBatches = creditsData?.expiringSoon ?? [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Credits</h1>

      <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-zinc-500">Available Credits</p>
        <p className="mt-1 text-4xl font-bold text-zinc-900">
          {creditsData?.available ?? "—"}
        </p>
      </div>

      {expiringBatches.length > 0 && (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
          <h2 className="mb-3 text-lg font-semibold text-amber-800">Expiring Soon</h2>
          <div className="space-y-2">
            {expiringBatches.map((batch) => (
              <div
                key={batch.id}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-white px-4 py-3"
              >
                <span className="text-sm text-amber-700">
                  {batch.remaining} credit{batch.remaining !== 1 ? "s" : ""}
                </span>
                <span className="text-sm font-medium text-amber-900">
                  Expires {format(new Date(batch.expiresAt), "MMM d, yyyy")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Top Up Credits</h2>
        <TopUpCards slug={slug} router={router} />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Transaction History</h2>

        {isLoading ? (
          <ContentSkeleton lines={5} />
        ) : transactions.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center">
            <p className="text-sm text-zinc-500">No transactions yet.</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/50">
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">Type</th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-500">Balance Before</th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-500">Amount</th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-500">Balance After</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => {
                    const amount = formatAmount(txn.amount);
                    return (
                      <tr key={txn.id} className="border-b border-zinc-50 last:border-b-0">
                        <td className="px-4 py-3 text-zinc-700">
                          {formatTypeLabel(txn.type)}
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-500">
                          {txn.balanceBefore !== null && txn.balanceBefore !== undefined ? txn.balanceBefore : "—"}
                        </td>
                        <td className={`px-4 py-3 text-right ${amount.className}`}>
                          {amount.text}
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-500">
                          {txn.balanceAfter !== null && txn.balanceAfter !== undefined ? txn.balanceAfter : "—"}
                        </td>
                        <td className="px-4 py-3 text-zinc-500">
                          {format(new Date(txn.createdAt), "MMM d, yyyy h:mm a")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <span className="text-sm text-zinc-500">
                  {total} total &middot; Page {page} of {totalPages}
                </span>
                <Pagination className="mx-0 w-auto">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        aria-disabled={page <= 1}
                        className={page <= 1 ? "pointer-events-none opacity-40" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                      if (pageNum < 1 || pageNum > totalPages) return null;
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            isActive={pageNum === page}
                            onClick={() => setPage(pageNum)}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        aria-disabled={page >= totalPages}
                        className={page >= totalPages ? "pointer-events-none opacity-40" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
