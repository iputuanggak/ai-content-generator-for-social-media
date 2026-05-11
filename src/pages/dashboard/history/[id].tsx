import { useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generation, platformOutput } from "@/lib/db/schema";
import type { GetServerSideProps } from "next";
import { PLATFORM_LABELS } from "@/lib/platform-metadata";
import { requireAuthPage } from "@/lib/require-auth-page";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

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
  copySuccess: boolean;
}

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
        copySuccess: false,
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
      } else {
        setOutputs((prev) => ({
          ...prev,
          [outputId]: { ...prev[outputId], isSaving: false },
        }));
      }
    } catch {
      setOutputs((prev) => ({
        ...prev,
        [outputId]: { ...prev[outputId], isSaving: false },
      }));
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
      } else {
        setOutputs((prev) => ({
          ...prev,
          [outputId]: { ...prev[outputId], isRegenerating: false },
        }));
      }
    } catch {
      setOutputs((prev) => ({
        ...prev,
        [outputId]: { ...prev[outputId], isRegenerating: false },
      }));
    }
  }

  async function handleCopy(outputId: string) {
    const output = outputs[outputId];
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output.editedContent);
      setOutputs((prev) => ({
        ...prev,
        [outputId]: { ...prev[outputId], copySuccess: true },
      }));
      setTimeout(() => {
        setOutputs((prev) => ({
          ...prev,
          [outputId]: { ...prev[outputId], copySuccess: false },
        }));
      }, 2000);
    } catch {
      // clipboard access denied — silently fail
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
        <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="mb-1 text-xl font-semibold text-zinc-900">{gen.topic}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
            <span>Tone: {capitalize(gen.tone)}</span>
            <span>Created: {new Date(gen.createdAt).toLocaleString()}</span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <label htmlFor="publish-date" className="text-sm font-medium text-zinc-700 whitespace-nowrap">
              Intended publish date
            </label>
            <input
              id="publish-date"
              type="datetime-local"
              value={intendedPublishAt}
              onChange={(e) => handlePublishDateChange(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
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

            return (
              <div
                key={po.id}
                className={[
                  "rounded-xl border bg-white p-5 shadow-sm",
                  hasUnsavedChanges ? "border-amber-300" : "border-zinc-200",
                ].join(" ")}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-900">
                      {PLATFORM_LABELS[po.platform as keyof typeof PLATFORM_LABELS] ?? po.platform}
                    </span>
                    {hasUnsavedChanges && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                        Unsaved
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRegenerate(po.id)}
                      disabled={state.isRegenerating}
                      className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                      title="Regenerate content"
                    >
                      {state.isRegenerating ? "Regenerating…" : "Regenerate"}
                    </button>
                    <button
                      onClick={() => handleCopy(po.id)}
                      className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
                    >
                      {state.copySuccess ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={() => handleSave(po.id)}
                      disabled={state.isSaving || !hasUnsavedChanges}
                      className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {state.isSaving ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
                {state.isRegenerating ? (
                  <div className="space-y-2">
                    <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
                    <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-100" />
                    <div className="h-3 w-3/5 animate-pulse rounded bg-zinc-100" />
                  </div>
                ) : (
                <textarea
                  value={state.editedContent}
                  onChange={(e) => handleEditContent(po.id, e.target.value)}
                  rows={6}
                  className="w-full resize-y rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5 text-sm leading-relaxed text-zinc-700 outline-none focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-zinc-100"
                />
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
