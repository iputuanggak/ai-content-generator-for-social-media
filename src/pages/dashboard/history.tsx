import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { auth } from "@/lib/auth";
import type { GetServerSideProps } from "next";
import { authClient } from "@/lib/auth-client";
import { requireAuthPage } from "@/lib/require-auth-page";

interface Generation {
  id: string;
  topic: string;
  tone: string;
  intendedPublishAt: string | null;
  createdAt: string;
}

interface HistoryPageProps {
  userName: string;
  teamName: string | null;
}

const PAGE_SIZE = 20;

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString();
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function HistoryPage({ userName, teamName }: HistoryPageProps) {
  const router = useRouter();
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

  async function handleLogout() {
    await authClient.signOut();
    router.push("/login");
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-zinc-900">AI Content Generator</span>
            {teamName && (
              <>
                <span className="text-zinc-300">/</span>
                <span className="text-sm font-medium text-zinc-600">{teamName}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              Generate
            </Link>
            <Link
              href="/dashboard/history"
              className="text-sm font-medium text-zinc-900 underline underline-offset-2"
            >
              History
            </Link>
            <span className="text-sm text-zinc-500">{userName}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Generation History</h1>

        {/* Search and filters */}
        <div className="mb-6 flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-48">
            <label className="mb-1 block text-sm font-medium text-zinc-700">Search topic</label>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="e.g. summer sale"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPage(1); }}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPage(1); }}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            />
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-100" />
            ))}
          </div>
        ) : generations.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center">
            <p className="text-zinc-500">No generations found.</p>
            <Link
              href="/dashboard"
              className="mt-3 inline-block text-sm font-medium text-zinc-900 underline underline-offset-2"
            >
              Create your first generation
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {generations.map((gen) => (
              <div
                key={gen.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-sm"
              >
                <Link href={`/dashboard/history/${gen.id}`} className="flex-1 min-w-0 group">
                  <p className="font-medium text-zinc-900 group-hover:underline truncate">
                    {gen.topic}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-500">
                    <span>Tone: {capitalize(gen.tone)}</span>
                    {gen.intendedPublishAt && (
                      <span>Publish: {formatDate(gen.intendedPublishAt)}</span>
                    )}
                    <span>Created: {formatDate(gen.createdAt)}</span>
                  </div>
                </Link>
                <button
                  onClick={() => setDeleteId(gen.id)}
                  className="ml-4 rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  Delete
                </button>
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
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Delete confirmation dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-2 text-lg font-semibold text-zinc-900">Delete Generation?</h2>
            <p className="mb-6 text-sm text-zinc-500">
              This will permanently delete the generation and all its platform outputs. This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={isDeleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<HistoryPageProps> = requireAuthPage(
  async ({ authHeaders, session }) => {
    let teamName: string | null = null;
    const activeOrgId = session.session.activeOrganizationId;

    if (activeOrgId) {
      const org = await auth.api.getFullOrganization({
        headers: authHeaders,
        query: { organizationId: activeOrgId },
      });
      if (org?.name) teamName = org.name;
    }

    if (!teamName) {
      const orgs = await auth.api.listOrganizations({ headers: authHeaders });
      if (orgs?.length) teamName = orgs[0].name;
    }

    return {
      props: {
        userName: session.user.name,
        teamName,
      },
    };
  }
);
