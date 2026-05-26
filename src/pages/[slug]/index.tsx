import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useTeam } from "@/lib/team-context";
import type { Tone, Platform } from "@/lib/content-adapter";
import { PLATFORM_LABELS } from "@/lib/content-adapter";
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
import { usePlatformOutputActions } from "@/lib/use-platform-output-actions";

interface BrandSettingsData {
  defaultTone: Tone;
  defaultPlatforms: Platform[];
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

import { TONE_OPTIONS } from "@/lib/content-adapter";

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
  const queryClient = useQueryClient();

  const [brandSettingsLoaded, setBrandSettingsLoaded] = useState(false);
  const [defaultTone, setDefaultTone] = useState<Tone>(DEFAULT_TONE);
  const [defaultPlatforms, setDefaultPlatforms] = useState<Platform[]>(DEFAULT_PLATFORMS);

  const [topic, setTopic] = useState("");
  const toneDetermined = useRef(false);
  const [tone, setTone] = useState<Tone>(DEFAULT_TONE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [platformToOutputId, setPlatformToOutputId] = useState<Record<string, string>>({});
  const [loadingPlatforms, setLoadingPlatforms] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [insufficientCredits, setInsufficientCredits] = useState<{ required: number; available: number } | null>(null);
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null);
  const [intendedPublishAt, setIntendedPublishAt] = useState<Date | undefined>(undefined);
  const [isSavingPublishDate, setIsSavingPublishDate] = useState(false);

  const {
    outputStates,
    initOutputState,
    setEditedContent,
    handleSave: hookHandleSave,
    handleRegenerate: hookHandleRegenerate,
    handleCopy: hookHandleCopy,
    handlePublishDateChange: hookHandlePublishDateChange,
  } = usePlatformOutputActions(slug ?? "", currentGenerationId ?? "");

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
        setDefaultPlatforms(data.defaultPlatforms ?? DEFAULT_PLATFORMS);
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
    setPlatformToOutputId({});
    setError(null);
    setInsufficientCredits(null);
    setCurrentGenerationId(null);
    setIntendedPublishAt(undefined);
    setLoadingPlatforms(new Set(defaultPlatforms));

    try {
      const response = await fetch(`/api/${slug}/generations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, tone }),
      });

      if (!response.ok) {
        const data = await response.json() as { error?: string; required?: number; available?: number };
        if (response.status === 402 && data.required != null && data.available != null) {
          setInsufficientCredits({ required: data.required, available: data.available });
        } else {
          setError(data.error ?? "Generation failed");
        }
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
              const oid = parsed.platformOutputId;
              initOutputState(oid, parsed.content);
              setPlatformToOutputId((prev) => ({ ...prev, [parsed.platform!]: oid }));
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

      queryClient.invalidateQueries({ queryKey: ["credits", slug] });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsGenerating(false);
      setLoadingPlatforms(new Set());
    }
  }

  async function handlePublishDateChange(date: Date | undefined) {
    setIntendedPublishAt(date);
    if (!currentGenerationId || !date) return;
    setIsSavingPublishDate(true);
    try {
      await hookHandlePublishDateChange(date);
    } finally {
      setIsSavingPublishDate(false);
    }
  }

  const hasResults = Object.keys(platformToOutputId).length > 0;
  const showResultsArea = isGenerating || hasResults;



  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      {teamLoading || brandSettingsLoading ? (
          <div className="space-y-6">
            <ContentSkeleton lines={2} />
            <div className="rounded-2xl border  p-6">
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
              <div className="rounded-2xl border   p-6 shadow-sm">
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
                      <SelectTrigger className="w-full">
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

                  {insufficientCredits && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      You need {insufficientCredits.required} credit{insufficientCredits.required !== 1 ? "s" : ""} but only have {insufficientCredits.available}.{" "}
                      <Link href={`/${slug}/credits`} className="font-medium underline hover:text-red-900">
                        Top up now
                      </Link>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4">
                    <Button
                      type="submit"
                      disabled={isGenerating || !topic.trim()}
                    >
                      {isGenerating ? "Generating…" : "Generate"}
                    </Button>
                    <span className="text-sm text-zinc-500">
                      This will cost {defaultPlatforms.length} credit{defaultPlatforms.length !== 1 ? "s" : ""}
                    </span>
                  </div>
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
                  {defaultPlatforms.map((platform) => {
                    const oid = platformToOutputId[platform];
                    const output = oid ? outputStates[oid] : undefined;
                    const isLoading = loadingPlatforms.has(platform) || (output ? output.isRegenerating : false);
                    const hasUnsavedChanges =
                      output && output.editedContent !== output.savedContent;

                    return (
                      <PlatformOutputCard
                        key={platform}
                        platformName={PLATFORM_LABELS[platform]}
                        content={output?.editedContent ?? ""}
                        onChange={(value) => oid && setEditedContent(oid, value)}
                        onCopy={() => oid && hookHandleCopy(oid)}
                        onSave={() => oid && hookHandleSave(oid)}
                        onRegenerate={() => oid && hookHandleRegenerate(oid)}
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
