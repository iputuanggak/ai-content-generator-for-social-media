import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { useTeam } from "@/lib/team-context";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ContentSkeleton } from "@/components/content-skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/date-picker";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

interface Generation {
  id: string;
  topic: string;
  tone: string;
  intendedPublishAt: string | null;
  createdAt: string;
}

const PAGE_SIZE = 20;

function formatRelativeDate(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} month${diffMonth === 1 ? "" : "s"} ago`;
  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear} year${diffYear === 1 ? "" : "s"} ago`;
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function HistoryPage() {
  return (
    <DashboardLayout>
      <HistoryContent />
    </DashboardLayout>
  );
}

function HistoryContent() {
  const { slug } = useTeam();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGenerations = useCallback(async (pg: number, srch: string, f: string, t: string) => {
    const params = new URLSearchParams({ page: String(pg) });
    if (srch) params.set("search", srch);
    if (f) params.set("from", f);
    if (t) params.set("to", t);
    const res = await fetch(`/api/generations?${params}`);
    if (res.ok) {
      const data = await res.json() as { items: Generation[]; total: number };
      return data;
    }
    return null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    fetchGenerations(page, search, from, to).then((data) => {
      if (!cancelled && data) {
        setGenerations(data.items);
        setTotal(data.total);
      }
    }).finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [fetchGenerations, page, search, from, to]);

  async function handleDelete(id: string) {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/generations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteId(null);
        const data = await fetchGenerations(page, search, from, to);
        if (data) {
          setGenerations(data.items);
          setTotal(data.total);
        }
      }
    } finally {
      setIsDeleting(false);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Generation History</h1>

        {/* Search and filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
          <div className="flex-1 min-w-48">
            <label className="mb-1 block text-sm font-medium text-zinc-700">Search topic</label>
            <Input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="e.g. summer sale"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">From</label>
            <DatePicker
              value={from ? parseISO(from) : undefined}
              onChange={(date) => { setFrom(date ? format(date, "yyyy-MM-dd") : ""); setPage(1); }}
              placeholder="From date"
              className="sm:w-auto"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">To</label>
            <DatePicker
              value={to ? parseISO(to) : undefined}
              onChange={(date) => { setTo(date ? format(date, "yyyy-MM-dd") : ""); setPage(1); }}
              placeholder="To date"
              className="sm:w-auto"
            />
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <ContentSkeleton lines={5} />
        ) : generations.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-6 py-12 text-center">
            <p className="text-lg font-medium text-amber-800">No generations found</p>
            <p className="mt-1 text-sm text-amber-700">
              {search || from || to
                ? "Try adjusting your search or date filters."
                : "You haven't generated any content yet."}
            </p>
            {!search && !from && !to && (
              <Link
                href={`/${slug}`}
                className="mt-4 inline-block rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                Create your first generation
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {generations.map((gen) => (
              <div
                key={gen.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-sm transition hover:border-amber-200 hover:shadow-md"
              >
                <Link href={`/${slug}/history/${gen.id}`} className="flex-1 min-w-0 group">
                  <p className="font-semibold text-zinc-900 group-hover:underline truncate text-base">
                    {gen.topic}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                      {capitalize(gen.tone)}
                    </span>
                    {gen.intendedPublishAt && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        <span>📅</span>
                        <span title={formatFullDate(gen.intendedPublishAt)}>
                          {formatFullDate(gen.intendedPublishAt)}
                        </span>
                      </span>
                    )}
                    <span
                      className="text-xs text-zinc-400"
                      title={formatFullDate(gen.createdAt)}
                    >
                      {formatRelativeDate(gen.createdAt)}
                    </span>
                  </div>
                </Link>
                <Button
                  variant="destructive"
                  size="xs"
                  onClick={() => setDeleteId(gen.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
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
      </main>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        title="Delete Generation?"
        description="This will permanently delete the generation and all its platform outputs. This action cannot be undone."
        confirmLabel={isDeleting ? "Deleting…" : "Delete"}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        variant="destructive"
        confirmDisabled={isDeleting}
      />
    </>
  );
}

