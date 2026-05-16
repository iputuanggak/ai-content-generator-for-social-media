import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useTeam } from "@/lib/team-context";
import type { Tone, Platform } from "@/lib/content-adapter";
import { PLATFORM_LABELS } from "@/lib/platform-metadata";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/date-time-picker";
import { PlatformOutputCard } from "@/components/platform-output-card";
import { ContentSkeleton } from "@/components/content-skeleton";
import { useRequireVerifiedEmail } from "@/lib/use-require-verified-email";

interface PlatformOutputState {
  platformOutputId: string;
  content: string;
  editedContent: string;
  savedContent: string;
  isSaving: boolean;
  isRegenerating: boolean;
}

interface BrandSettingsData {
  defaultTone: Tone;
  activePlatforms: Platform[];
}

const DEFAULT_TONE: Tone = "professional";
const DEFAULT_PLATFORMS: Platform[] = [
  "twitter",
  "linkedin",
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "threads",
  "pinterest",
];

const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "humorous", label: "Humorous" },
  { value: "inspirational", label: "Inspirational" },
];

export default function DashboardPage() {
  const { loading: verifyLoading } = useRequireVerifiedEmail();
  if (verifyLoading) return null;
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}

function DashboardContent() {
  const { userName, teamName, teamId, slug, loading: teamLoading } = useTeam();

  const [brandSettingsLoaded, setBrandSettingsLoaded] = useState(false);
  const [defaultTone, setDefaultTone] = useState<Tone>(DEFAULT_TONE);
  const [activePlatforms, setActivePlatforms] = useState<Platform[]>(DEFAULT_PLATFORMS);

  const [topic, setTopic] = useState("");
  const toneDetermined = useRef(false);
  const [tone, setTone] = useState<Tone>(DEFAULT_TONE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputs, setOutputs] = useState<Record<string, PlatformOutputState>>({});
  const [loadingPlatforms, setLoadingPlatforms] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null);
  const [intendedPublishAt, setIntendedPublishAt] = useState<Date | undefined>(undefined);
  const [isSavingPublishDate, setIsSavingPublishDate] = useState(false);

  const brandSettingsLoading = !brandSettingsLoaded && (teamLoading || !!teamId);

  useEffect(() => {
    if (defaultTone && !toneDetermined.current) {
      toneDetermined.current = true;
      setTone(defaultTone);
    }
  }, [defaultTone]);

  useEffect(() => {
    if (!slug || teamLoading) return;
    let cancelled = false;
    fetch(`/api/teams/${slug}/brand-settings`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data: BrandSettingsData) => {
        if (cancelled) return;
        setDefaultTone(data.defaultTone ?? DEFAULT_TONE);
        setActivePlatforms(data.activePlatforms ?? DEFAULT_PLATFORMS);
      })
      .catch(() => {
        if (cancelled) return;
      })
      .finally(() => {
        if (!cancelled) setBrandSettingsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, teamLoading]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    setOutputs({});
    setError(null);
    setCurrentGenerationId(null);
    setIntendedPublishAt(undefined);
    setLoadingPlatforms(new Set(activePlatforms));

    try {
      const response = await fetch(`/api/${slug}/generations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, tone }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Generation failed");
        setIsGenerating(false);
        setLoadingPlatforms(new Set());
        return;
      }

      if (!response.body) {
        setError("No response body");
        setIsGenerating(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") {
            setIsGenerating(false);
            setLoadingPlatforms(new Set());
            break;
          }
          try {
            const parsed = JSON.parse(raw) as {
              platform?: Platform;
              content?: string;
              generationId?: string;
              platformOutputId?: string;
              error?: string;
            };
            if (parsed.error) {
              setError(parsed.error);
            } else if (parsed.platform && parsed.content && parsed.platformOutputId) {
              if (parsed.generationId) {
                setCurrentGenerationId(parsed.generationId);
              }
              setOutputs((prev) => ({
                    ...prev,
                    [parsed.platform!]: {
                      platformOutputId: parsed.platformOutputId!,
                      content: parsed.content!,
                      editedContent: parsed.content!,
                      savedContent: parsed.content!,
                      isSaving: false,
                      isRegenerating: false,
                    },
                  }));
              setLoadingPlatforms((prev) => {
                const next = new Set(prev);
                next.delete(parsed.platform!);
                return next;
              });
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsGenerating(false);
      setLoadingPlatforms(new Set());
    }
  }

  function handleEditContent(platform: string, value: string) {
    setOutputs((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], editedContent: value },
    }));
  }

  async function handleSave(platform: string) {
    const output = outputs[platform];
    if (!output) return;

    setOutputs((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], isSaving: true },
    }));

    try {
      const res = await fetch(`/api/${slug}/platform-outputs/${output.platformOutputId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editedContent: output.editedContent }),
      });

      if (res.ok) {
        setOutputs((prev) => ({
          ...prev,
          [platform]: {
            ...prev[platform],
            savedContent: output.editedContent,
            isSaving: false,
          },
        }));
        toast("Changes saved");
      } else {
        setOutputs((prev) => ({
          ...prev,
          [platform]: { ...prev[platform], isSaving: false },
        }));
      }
    } catch {
      setOutputs((prev) => ({
        ...prev,
        [platform]: { ...prev[platform], isSaving: false },
      }));
    }
  }

  async function handleCopy(platform: string) {
    const output = outputs[platform];
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output.editedContent);
      toast("Copied to clipboard");
    } catch {
      // clipboard access denied — silently fail
    }
  }

  async function handleRegenerate(platform: string) {
    const output = outputs[platform];
    if (!output) return;

    setOutputs((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], isRegenerating: true },
    }));

    try {
      const res = await fetch(
        `/api/${slug}/platform-outputs/${output.platformOutputId}/regenerate`,
        { method: "POST" }
      );

      if (res.ok) {
        const data = await res.json() as { id: string; content: string };
        setOutputs((prev) => ({
          ...prev,
          [platform]: {
            ...prev[platform],
            content: data.content,
            editedContent: data.content,
            savedContent: data.content,
            isRegenerating: false,
          },
        }));
        toast("Content regenerated");
      } else {
        setOutputs((prev) => ({
          ...prev,
          [platform]: { ...prev[platform], isRegenerating: false },
        }));
      }
    } catch {
      setOutputs((prev) => ({
        ...prev,
        [platform]: { ...prev[platform], isRegenerating: false },
      }));
    }
  }

  async function handlePublishDateChange(date: Date | undefined) {
    setIntendedPublishAt(date);
    if (!currentGenerationId || !date) return;
    try {
      await fetch(`/api/${slug}/generations/${currentGenerationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intendedPublishAt: date.toISOString() }),
      });
    } finally {
      setIsSavingPublishDate(false);
    }
  }

  const hasResults = Object.keys(outputs).length > 0;
  const showResultsArea = isGenerating || hasResults;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      {teamLoading || brandSettingsLoading ? (
          <div className="space-y-6">
            <ContentSkeleton lines={2} />
            <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-6">
              <ContentSkeleton lines={4} />
            </div>
          </div>
        ) : !teamName ? (
          <div>
            <h1 className="mb-2 text-2xl font-semibold text-zinc-900">Welcome, {userName}!</h1>
            <p className="text-zinc-500">
              You have no team yet.{" "}
              <Link
                href="/onboarding"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                Create one
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Generation form */}
            <section>
              <h1 className="mb-2 text-3xl font-bold text-zinc-900">Generate Content</h1>
              <p className="mb-6 text-sm text-zinc-500">
                Describe your topic and choose a tone — we&apos;ll adapt it for each platform.
              </p>
              <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-6 shadow-sm">
                <form onSubmit={handleGenerate} className="space-y-5">
                  <div>
                    <label
                      htmlFor="topic"
                      className="mb-1.5 block text-sm font-semibold text-zinc-800"
                    >
                      Topic
                    </label>
                    <Textarea
                      id="topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="What do you want to post about?"
                      rows={4}
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="tone"
                      className="mb-1.5 block text-sm font-semibold text-zinc-800"
                    >
                      Tone
                    </label>
                    <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                      <SelectTrigger className="w-full rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm text-zinc-900">
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent>
                        {TONE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isGenerating || !topic.trim()}
                  >
                    {isGenerating ? "Generating…" : "Generate"}
                  </Button>
                </form>
              </div>
            </section>

            {/* Results area */}
            {showResultsArea && (
              <section>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-bold text-zinc-900">Platform Outputs</h2>

                  {/* Publish date picker — shown once we have a generationId */}
                  {currentGenerationId && (
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-medium text-zinc-700 whitespace-nowrap">
                         Intended publish date
                       </span>
                        <DateTimePicker
                          value={intendedPublishAt}
                          onChange={handlePublishDateChange}
                          placeholder="Pick date & time"
                          className="w-64"
                        />
                       {isSavingPublishDate && (
                         <span className="text-xs text-zinc-400">Saving…</span>
                       )}
                     </div>
                  )}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  {activePlatforms.map((platform) => {
                    const output = outputs[platform];
                    const isLoading = loadingPlatforms.has(platform) || (output ? output.isRegenerating : false);
                    const hasUnsavedChanges =
                      output && output.editedContent !== output.savedContent;

                    return (
                      <PlatformOutputCard
                        key={platform}
                        platformName={PLATFORM_LABELS[platform]}
                        content={output?.editedContent ?? ""}
                        onChange={(value) => handleEditContent(platform, value)}
                        onCopy={() => handleCopy(platform)}
                        onSave={() => handleSave(platform)}
                        onRegenerate={() => handleRegenerate(platform)}
                        loading={isLoading}
                        hasUnsavedChanges={hasUnsavedChanges}
                        isSaving={output?.isSaving}
                      />
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
  );
}
