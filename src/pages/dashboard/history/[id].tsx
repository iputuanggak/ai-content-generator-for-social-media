import { useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generation, platformOutput } from "@/lib/db/schema";
import { PLATFORM_LABELS } from "@/lib/platform-metadata";
import { requireAuthPage } from "@/lib/require-auth-page";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface PlatformOutputData {
  id: string;
  platform: string;
  content: string;
  editedContent: string | null;
}

interface GenerationData {
  id: string;
  topic: string;
  tone: string;
  intendedPublishAt: string | null;
  createdAt: string;
}

interface HistoryDetailPageProps {
  userName: string;
  teamName: string | null;
  teamId: string | null;
  teams: { id: string; name: string }[];
  generation: GenerationData;
  platformOutputs: PlatformOutputData[];
}

interface OutputState {
  editedContent: string;
  savedContent: string;
  isSaving: boolean;
  isRegenerating: boolean;
}

const PLATFORM_CHAR_LIMITS: Record<string, number> = {
  twitter: 280,
  linkedin: 3000,
  instagram: 2200,
  facebook: 63206,
  tiktok: 2200,
  youtube: 5000,
  threads: 500,
  pinterest: 500,
};

const PLATFORM_BADGE_STYLES: Record<string, string> = {
  twitter: "bg-sky-100 text-sky-700",
  linkedin: "bg-blue-100 text-blue-700",
  instagram: "bg-pink-100 text-pink-700",
  facebook: "bg-indigo-100 text-indigo-700",
  tiktok: "bg-zinc-100 text-zinc-700",
  youtube: "bg-red-100 text-red-700",
  threads: "bg-neutral-100 text-neutral-700",
  pinterest: "bg-rose-100 text-rose-700",
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function HistoryDetailPage({
  userName,
  teamName,
  teamId,
  teams,
  generation: gen,
  platformOutputs,
}: HistoryDetailPageProps) {
  const [intendedPublishAt, setIntendedPublishAt] = useState(
    gen.intendedPublishAt
      ? new Date(gen.intendedPublishAt).toISOString().slice(0, 16)
      : ""
  );
  const [isSavingPublishDate, setIsSavingPublishDate] = useState(false);

  const [outputs, setOutputs] = useState<Record<string, OutputState>>(() => {
    const init: Record<string, OutputState> = {};
    for (const po of platformOutputs) {
      const current = po.editedContent ?? po.content;
      init[po.id] = {
        editedContent: current,
        savedContent: current,
        isSaving: false,
        isRegenerating: false,
      };
    }
    return init;
  });

  async function handlePublishDateChange(value: string) {
    setIntendedPublishAt(value);
    setIsSavingPublishDate(true);
    try {
      await fetch(`/api/generations/${gen.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intendedPublishAt: value ? new Date(value).toISOString() : null }),
      });
    } finally {
      setIsSavingPublishDate(false);
    }
  }

  function handleEditContent(outputId: string, value: string) {
    setOutputs((prev) => ({
      ...prev,
      [outputId]: { ...prev[outputId], editedContent: value },
    }));
  }

  async function handleSave(outputId: string) {
    const output = outputs[outputId];
    if (!output) return;

    setOutputs((prev) => ({
      ...prev,
      [outputId]: { ...prev[outputId], isSaving: true },
    }));

    try {
      const res = await fetch(`/api/platform-outputs/${outputId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editedContent: output.editedContent }),
      });

      if (res.ok) {
        setOutputs((prev) => ({
          ...prev,
          [outputId]: {
            ...prev[outputId],
            savedContent: output.editedContent,
            isSaving: false,
          },
        }));
        toast("Changes saved");
      } else {
        setOutputs((prev) => ({
          ...prev,
          [outputId]: { ...prev[outputId], isSaving: false },
        }));
        toast.error("Failed to save changes");
      }
    } catch {
      setOutputs((prev) => ({
        ...prev,
        [outputId]: { ...prev[outputId], isSaving: false },
      }));
      toast.error("Failed to save changes");
    }
  }

  async function handleRegenerate(outputId: string) {
    setOutputs((prev) => ({
      ...prev,
      [outputId]: { ...prev[outputId], isRegenerating: true },
    }));

    try {
      const res = await fetch(`/api/platform-outputs/${outputId}/regenerate`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json() as { id: string; content: string };
        setOutputs((prev) => ({
          ...prev,
          [outputId]: {
            ...prev[outputId],
            editedContent: data.content,
            savedContent: data.content,
            isRegenerating: false,
          },
        }));
        toast("Content regenerated");
      } else {
        setOutputs((prev) => ({
          ...prev,
          [outputId]: { ...prev[outputId], isRegenerating: false },
        }));
        toast.error("Regeneration failed");
      }
    } catch {
      setOutputs((prev) => ({
        ...prev,
        [outputId]: { ...prev[outputId], isRegenerating: false },
      }));
      toast.error("Regeneration failed");
    }
  }

  async function handleCopy(outputId: string) {
    const output = outputs[outputId];
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output.editedContent);
      toast("Copied to clipboard");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  return (
    <DashboardLayout
      userName={userName}
      teamName={teamName}
      teamId={teamId}
      teams={teams}
    >
      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Back link */}
        <Link
          href="/dashboard/history"
          className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Back to History
        </Link>

        {/* Generation metadata */}
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50/40 p-6 shadow-sm">
          <h1 className="mb-3 text-xl font-semibold text-zinc-900">{gen.topic}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
              {capitalize(gen.tone)}
            </span>
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
              Created {new Date(gen.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <label htmlFor="publish-date" className="text-sm font-medium text-zinc-700 whitespace-nowrap">
              Intended publish date
            </label>
            <input
              id="publish-date"
              type="datetime-local"
              value={intendedPublishAt}
              onChange={(e) => handlePublishDateChange(e.target.value)}
              className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
            />
            {isSavingPublishDate && <span className="text-xs text-zinc-400">Saving…</span>}
          </div>
        </div>

        {/* Platform Outputs */}
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Platform Outputs</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {platformOutputs.map((po) => {
            const state = outputs[po.id];
            if (!state) return null;
            const hasUnsavedChanges = state.editedContent !== state.savedContent;
            const charLimit = PLATFORM_CHAR_LIMITS[po.platform];
            const charCount = state.editedContent.length;
            const overLimit = charLimit ? charCount > charLimit : false;
            const badgeStyle = PLATFORM_BADGE_STYLES[po.platform] ?? "bg-zinc-100 text-zinc-700";

            return (
              <div
                key={po.id}
                className={[
                  "flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition",
                  hasUnsavedChanges ? "border-amber-300 shadow-amber-100" : "border-zinc-200",
                ].join(" ")}
              >
                {/* Card header */}
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className={[
                      "rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide",
                      badgeStyle,
                    ].join(" ")}
                  >
                    {PLATFORM_LABELS[po.platform as keyof typeof PLATFORM_LABELS] ?? po.platform}
                  </span>
                  {hasUnsavedChanges && (
                    <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700">
                      Unsaved
                    </span>
                  )}
                </div>

                {/* Content area */}
                {state.isRegenerating ? (
                  <div className="space-y-2">
                    <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
                    <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-100" />
                    <div className="h-3 w-3/5 animate-pulse rounded bg-zinc-100" />
                  </div>
                ) : (
                  <>
                    <textarea
                      value={state.editedContent}
                      onChange={(e) => handleEditContent(po.id, e.target.value)}
                      rows={6}
                      className="w-full resize-y rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5 text-sm leading-relaxed text-zinc-700 outline-none transition focus:border-teal-300 focus:bg-white focus:ring-2 focus:ring-teal-100"
                    />
                    {/* Character count */}
                    {charLimit && (
                      <p
                        className={[
                          "mt-1 text-right text-xs",
                          overLimit ? "text-red-500 font-semibold" : "text-zinc-400",
                        ].join(" ")}
                      >
                        {charCount} / {charLimit}
                      </p>
                    )}

                    {/* Action buttons — below textarea */}
                    <div className="mt-3 flex items-center justify-end gap-2">
                      {/* Mobile: Regenerate in dropdown; desktop: visible button */}
                      <div className="sm:hidden">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
                              title="More actions"
                            >
                              ···
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => handleRegenerate(po.id)}
                              disabled={state.isRegenerating}
                            >
                              {state.isRegenerating ? "Regenerating…" : "Regenerate"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <button
                        onClick={() => handleRegenerate(po.id)}
                        disabled={state.isRegenerating}
                        className="hidden sm:inline-flex rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {state.isRegenerating ? "Regenerating…" : "Regenerate"}
                      </button>
                      <button
                        onClick={() => handleCopy(po.id)}
                        className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => handleSave(po.id)}
                        disabled={state.isSaving || !hasUnsavedChanges}
                        className="rounded-lg bg-teal-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {state.isSaving ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </DashboardLayout>
  );
}

export const getServerSideProps = requireAuthPage(
  async ({ authHeaders, session, params }) => {
    const id = params?.id;
    if (!id || typeof id !== "string") {
      return { notFound: true };
    }

    const activeOrgId = session.session.activeOrganizationId;
    if (!activeOrgId) {
      return { redirect: { destination: "/dashboard", permanent: false } };
    }

    // Fetch generation
    const genRows = await db.select().from(generation).where(eq(generation.id, id)).limit(1);
    if (genRows.length === 0 || genRows[0].organizationId !== activeOrgId) {
      return { notFound: true };
    }

    const gen = genRows[0];
    const outputs = await db
      .select()
      .from(platformOutput)
      .where(eq(platformOutput.generationId, id));

    // Get team name
    let teamName: string | null = null;
    const org = await auth.api.getFullOrganization({
      headers: authHeaders,
      query: { organizationId: activeOrgId },
    });
    if (org?.name) teamName = org.name;

    const allOrgs = await auth.api.listOrganizations({ headers: authHeaders });
    const teams = (allOrgs ?? []).map((o) => ({ id: o.id, name: o.name }));

    return {
      props: {
        userName: session.user.name,
        teamName,
        teamId: activeOrgId,
        teams,
        generation: {
          id: gen.id,
          topic: gen.topic,
          tone: gen.tone,
          intendedPublishAt: gen.intendedPublishAt?.toISOString() ?? null,
          createdAt: gen.createdAt.toISOString(),
        },
        platformOutputs: outputs.map((po) => ({
          id: po.id,
          platform: po.platform,
          content: po.content,
          editedContent: po.editedContent ?? null,
        })),
      },
    };
  }
);
