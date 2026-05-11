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
import { DateTimePicker } from "@/components/date-time-picker";
import { PlatformOutputCard } from "@/components/platform-output-card";

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

export default function HistoryDetailPage({
  userName,
  teamName,
  teamId,
  teams,
  generation: gen,
  platformOutputs,
}: HistoryDetailPageProps) {
  const [intendedPublishAt, setIntendedPublishAt] = useState<Date | undefined>(
    gen.intendedPublishAt ? new Date(gen.intendedPublishAt) : undefined
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

  async function handlePublishDateChange(date: Date | undefined) {
    setIntendedPublishAt(date);
    setIsSavingPublishDate(true);
    try {
      await fetch(`/api/generations/${gen.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intendedPublishAt: date ? date.toISOString() : null }),
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
              {gen.tone.charAt(0).toUpperCase() + gen.tone.slice(1)}
            </span>
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
              Created {new Date(gen.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-zinc-700 whitespace-nowrap">
              Intended publish date
            </span>
            <DateTimePicker
              value={intendedPublishAt}
              onChange={handlePublishDateChange}
              className="w-64"
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

            return (
              <PlatformOutputCard
                key={po.id}
                platformName={PLATFORM_LABELS[po.platform as keyof typeof PLATFORM_LABELS] ?? po.platform}
                content={state.editedContent}
                onChange={(value) => handleEditContent(po.id, value)}
                onCopy={() => handleCopy(po.id)}
                onSave={() => handleSave(po.id)}
                onRegenerate={() => handleRegenerate(po.id)}
                loading={state.isRegenerating}
                hasUnsavedChanges={state.editedContent !== state.savedContent}
                isSaving={state.isSaving}
              />
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
