import { useRouter } from "next/router";
import Link from "next/link";
import { useState, useRef, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { brandSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { GetServerSideProps } from "next";
import type { Tone, Platform } from "@/lib/content-adapter";

interface PlatformOutputState {
  platformOutputId: string;
  content: string;
  editedContent: string;
  savedContent: string;
  isSaving: boolean;
  isRegenerating: boolean;
  copySuccess: boolean;
}

interface DashboardProps {
  userName: string;
  teamName: string | null;
  defaultTone: Tone;
  activePlatforms: Platform[];
}

const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "humorous", label: "Humorous" },
  { value: "inspirational", label: "Inspirational" },
];

const PLATFORM_LABELS: Record<Platform, string> = {
  twitter: "Twitter / X",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  threads: "Threads",
  pinterest: "Pinterest",
};

export default function DashboardPage({
  userName,
  teamName,
  defaultTone,
  activePlatforms,
}: DashboardProps) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<Tone>(defaultTone);
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputs, setOutputs] = useState<Record<string, PlatformOutputState>>({});
  const [loadingPlatforms, setLoadingPlatforms] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null);
  const [intendedPublishAt, setIntendedPublishAt] = useState<string>("");
  const [isSavingPublishDate, setIsSavingPublishDate] = useState(false);

  async function handleLogout() {
    await authClient.signOut();
    router.push("/login");
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    setOutputs({});
    setError(null);
    setCurrentGenerationId(null);
    setIntendedPublishAt("");
    setLoadingPlatforms(new Set(activePlatforms));

    try {
      const response = await fetch("/api/generations", {
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
                      copySuccess: false,
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
      const res = await fetch(`/api/platform-outputs/${output.platformOutputId}`, {
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
      setOutputs((prev) => ({
        ...prev,
        [platform]: { ...prev[platform], copySuccess: true },
      }));
      setTimeout(() => {
        setOutputs((prev) => ({
          ...prev,
          [platform]: { ...prev[platform], copySuccess: false },
        }));
      }, 2000);
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
        `/api/platform-outputs/${output.platformOutputId}/regenerate`,
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

  async function handlePublishDateChange(value: string) {
    setIntendedPublishAt(value);
    if (!currentGenerationId || !value) return;
    try {
      await fetch(`/api/generations/${currentGenerationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intendedPublishAt: value ? new Date(value).toISOString() : null }),
      });
    } finally {
      setIsSavingPublishDate(false);
    }
  }

  const hasResults = Object.keys(outputs).length > 0;
  const showResultsArea = isGenerating || hasResults;

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header / nav */}
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
            <span className="text-sm text-zinc-500">{userName}</span>
            <Link
              href="/dashboard/settings"
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
            >
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        {!teamName ? (
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
              <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Generate Content</h1>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label
                    htmlFor="topic"
                    className="mb-1.5 block text-sm font-medium text-zinc-700"
                  >
                    Topic
                  </label>
                  <textarea
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="What do you want to post about?"
                    rows={3}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="tone"
                    className="mb-1.5 block text-sm font-medium text-zinc-700"
                  >
                    Tone
                  </label>
                  <select
                    id="tone"
                    value={tone}
                    onChange={(e) => setTone(e.target.value as Tone)}
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                  >
                    {TONE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isGenerating || !topic.trim()}
                  className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating ? "Generating…" : "Generate"}
                </button>
              </form>
            </section>

            {/* Results area */}
            {showResultsArea && (
              <section>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-zinc-900">Platform Outputs</h2>

                  {/* Publish date picker — shown once we have a generationId */}
                  {currentGenerationId && (
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="publish-date"
                        className="text-sm font-medium text-zinc-700 whitespace-nowrap"
                      >
                        Intended publish date
                      </label>
                      <input
                        id="publish-date"
                        type="datetime-local"
                        value={intendedPublishAt}
                        onChange={(e) => handlePublishDateChange(e.target.value)}
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                      />
                      {isSavingPublishDate && (
                        <span className="text-xs text-zinc-400">Saving…</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {activePlatforms.map((platform) => {
                    const output = outputs[platform];
                    const isLoading = loadingPlatforms.has(platform);
                    const hasUnsavedChanges =
                      output && output.editedContent !== output.savedContent;

                    return (
                      <div
                        key={platform}
                        className={[
                          "rounded-xl border bg-white p-5 shadow-sm",
                          hasUnsavedChanges ? "border-amber-300" : "border-zinc-200",
                        ].join(" ")}
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-zinc-900">
                              {PLATFORM_LABELS[platform]}
                            </span>
                            {isLoading && (
                              <span className="text-xs text-zinc-400">Generating…</span>
                            )}
                            {hasUnsavedChanges && (
                              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                                Unsaved
                              </span>
                            )}
                          </div>

                          {output && !isLoading && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleRegenerate(platform)}
                                disabled={output.isRegenerating}
                                className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                                title="Regenerate content"
                              >
                                {output.isRegenerating ? "Regenerating…" : "Regenerate"}
                              </button>
                              <button
                                onClick={() => handleCopy(platform)}
                                className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
                                title="Copy to clipboard"
                              >
                                {output.copySuccess ? "Copied!" : "Copy"}
                              </button>
                              <button
                                onClick={() => handleSave(platform)}
                                disabled={output.isSaving || !hasUnsavedChanges}
                                className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {output.isSaving ? "Saving…" : "Save"}
                              </button>
                            </div>
                          )}
                        </div>

                        {isLoading || (output && output.isRegenerating) ? (
                          <div className="space-y-2">
                            <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
                            <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-100" />
                            <div className="h-3 w-3/5 animate-pulse rounded bg-zinc-100" />
                          </div>
                        ) : output ? (
                          <textarea
                            value={output.editedContent}
                            onChange={(e) => handleEditContent(platform, e.target.value)}
                            rows={6}
                            className="w-full resize-y rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5 text-sm leading-relaxed text-zinc-700 outline-none focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-zinc-100"
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<DashboardProps> = async ({ req }) => {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
  }

  const session = await auth.api.getSession({ headers });

  if (!session) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  // Fetch the active organization name if there is one
  let teamName: string | null = null;
  let activeOrgId = session.session.activeOrganizationId;

  if (activeOrgId) {
    const orgsResponse = await auth.api.getFullOrganization({
      headers,
      query: { organizationId: activeOrgId },
    });
    if (orgsResponse && orgsResponse.name) {
      teamName = orgsResponse.name;
    }
  }

  // If no active org, try to get first org the user belongs to
  if (!teamName) {
    const listResponse = await auth.api.listOrganizations({ headers });
    if (listResponse && listResponse.length > 0) {
      teamName = listResponse[0].name;
      activeOrgId = listResponse[0].id;
      await auth.api.setActiveOrganization({
        headers,
        body: { organizationId: listResponse[0].id },
      });
    }
  }

  // Read Brand Settings for default tone and active platforms
  let defaultTone: Tone = "professional";
  let activePlatforms: Platform[] = [
    "twitter",
    "linkedin",
    "instagram",
    "facebook",
    "tiktok",
    "youtube",
    "threads",
    "pinterest",
  ];

  if (activeOrgId) {
    const settingsRows = await db
      .select()
      .from(brandSettings)
      .where(eq(brandSettings.organizationId, activeOrgId))
      .limit(1);

    if (settingsRows.length > 0) {
      defaultTone = settingsRows[0].defaultTone as Tone;
      activePlatforms = settingsRows[0].activePlatforms as Platform[];
    }
  }

  return {
    props: {
      userName: session.user.name,
      teamName,
      defaultTone,
      activePlatforms,
    },
  };
};
