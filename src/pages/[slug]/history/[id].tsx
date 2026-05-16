import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useTeam } from "@/lib/team-context";
import { PLATFORM_LABELS } from "@/lib/platform-metadata";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ContentSkeleton } from "@/components/content-skeleton";
import { toast } from "sonner";
import { DateTimePicker } from "@/components/date-time-picker";
import { PlatformOutputCard } from "@/components/platform-output-card";
import { useRequireVerifiedEmail } from "@/lib/use-require-verified-email";

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

interface OutputState {
  editedContent: string;
  savedContent: string;
  isSaving: boolean;
  isRegenerating: boolean;
}

export default function HistoryDetailPage() {
  const { loading: verifyLoading } = useRequireVerifiedEmail();
  if (verifyLoading) return null;
  return (
    <DashboardLayout>
      <HistoryDetailContent />
    </DashboardLayout>
  );
}

function HistoryDetailContent() {
  const { slug } = useTeam();
  const router = useRouter();
  const id = router.query.id as string | undefined;

  const [gen, setGen] = useState<GenerationData | null>(null);
  const [platformOutputs, setPlatformOutputs] = useState<PlatformOutputData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [intendedPublishAt, setIntendedPublishAt] = useState<Date | undefined>(undefined);
  const [isSavingPublishDate, setIsSavingPublishDate] = useState(false);

  const [outputs, setOutputs] = useState<Record<string, OutputState>>({});

  useEffect(() => {
    if (!id || !slug) return;
    let cancelled = false;

    fetch(`/api/${slug}/generations/${id}`)
      .then((res) => {
        if (res.status === 404 || res.status === 403) {
          if (!cancelled) setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled || !data) return;
        const g = data.generation;
        const pos = data.platformOutputs ?? [];
        setGen({
          id: g.id,
          topic: g.topic,
          tone: g.tone,
          intendedPublishAt: g.intendedPublishAt ?? null,
          createdAt: g.createdAt,
        });
        setIntendedPublishAt(g.intendedPublishAt ? new Date(g.intendedPublishAt) : undefined);
        setPlatformOutputs(pos);

        const init: Record<string, OutputState> = {};
        for (const po of pos) {
          const current = po.editedContent ?? po.content;
          init[po.id] = {
            editedContent: current,
            savedContent: current,
            isSaving: false,
            isRegenerating: false,
          };
        }
        setOutputs(init);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, slug]);

  if (notFound) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-xl font-semibold text-zinc-900">Generation not found</h1>
        <Link
          href={`/${slug}/history`}
          className="mt-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Back to History
        </Link>
      </main>
    );
  }

  async function handlePublishDateChange(date: Date | undefined) {
    setIntendedPublishAt(date);
    if (!gen) return;
    setIsSavingPublishDate(true);
    try {
      await fetch(`/api/${slug}/generations/${gen.id}`, {
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
      const res = await fetch(`/api/${slug}/platform-outputs/${outputId}`, {
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
      const res = await fetch(`/api/${slug}/platform-outputs/${outputId}/regenerate`, {
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
    <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Back link */}
        <Link
          href={`/${slug}/history`}
          className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Back to History
        </Link>

        {isLoading ? (
          <ContentSkeleton lines={6} />
        ) : gen ? (
          <>
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
          </>
        ) : null}
      </main>
  );
}
