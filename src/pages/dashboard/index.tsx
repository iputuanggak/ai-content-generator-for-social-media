import { useRouter } from "next/router";
import Link from "next/link";
import { useState, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import { auth } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { db } from "@/lib/db";
import { brandSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { GetServerSideProps } from "next";
import type { Tone, Platform } from "@/lib/content-adapter";
import { PLATFORM_LABELS } from "@/lib/platform-metadata";
import { requireAuthPage } from "@/lib/require-auth-page";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface PlatformOutputState {
  platformOutputId: string;
  content: string;
  editedContent: string;
  savedContent: string;
  isSaving: boolean;
  isRegenerating: boolean;
}

interface DashboardProps {
  userName: string;
  teamName: string | null;
  teamId: string | null;
  defaultTone: Tone;
  activePlatforms: Platform[];
  teams: { id: string; name: string }[];
}

const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "humorous", label: "Humorous" },
  { value: "inspirational", label: "Inspirational" },
];

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

export default function DashboardPage({
  userName,
  teamName,
  teamId,
  defaultTone,
  activePlatforms,
  teams,
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

  async function handleSwitchTeam(newTeamId: string) {
    if (newTeamId === teamId) return;
    await authClient.organization.setActive({ organizationId: newTeamId });
    router.push("/dashboard");
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
    <DashboardLayout
      userName={userName}
      teamName={teamName}
      teamId={teamId}
      teams={teams}
    >
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
                    <textarea
                      id="topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="What do you want to post about?"
                      rows={4}
                      className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
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
                    <select
                      id="tone"
                      value={tone}
                      onChange={(e) => setTone(e.target.value as Tone)}
                      className="rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 accent-teal-600"
                    >
                      {TONE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isGenerating || !topic.trim()}
                    className="rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isGenerating ? "Generating…" : "Generate"}
                  </button>
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
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
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
                    const isLoading = loadingPlatforms.has(platform);
                    const hasUnsavedChanges =
                      output && output.editedContent !== output.savedContent;
                    const charLimit = PLATFORM_CHAR_LIMITS[platform];
                    const charCount = output ? output.editedContent.length : 0;
                    const overLimit = charLimit ? charCount > charLimit : false;
                    const badgeStyle = PLATFORM_BADGE_STYLES[platform] ?? "bg-zinc-100 text-zinc-700";

                    return (
                      <div
                        key={platform}
                        className={[
                          "flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition",
                          hasUnsavedChanges
                            ? "border-amber-300 shadow-amber-100"
                            : "border-zinc-200",
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
                            {PLATFORM_LABELS[platform]}
                          </span>
                          {isLoading && (
                            <span className="text-xs text-zinc-400">Generating…</span>
                          )}
                          {hasUnsavedChanges && (
                            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700">
                              Unsaved
                            </span>
                          )}
                        </div>

                        {/* Content area */}
                        {isLoading || (output && output.isRegenerating) ? (
                          <div className="space-y-2">
                            <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
                            <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-100" />
                            <div className="h-3 w-3/5 animate-pulse rounded bg-zinc-100" />
                          </div>
                        ) : output ? (
                          <>
                            <textarea
                              value={output.editedContent}
                              onChange={(e) => handleEditContent(platform, e.target.value)}
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
                                      onSelect={() => handleRegenerate(platform)}
                                      disabled={output.isRegenerating}
                                    >
                                      {output.isRegenerating ? "Regenerating…" : "Regenerate"}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <button
                                onClick={() => handleRegenerate(platform)}
                                disabled={output.isRegenerating}
                                className="hidden sm:inline-flex rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {output.isRegenerating ? "Regenerating…" : "Regenerate"}
                              </button>
                              <button
                                onClick={() => handleCopy(platform)}
                                className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
                              >
                                Copy
                              </button>
                              <button
                                onClick={() => handleSave(platform)}
                                disabled={output.isSaving || !hasUnsavedChanges}
                                className="rounded-lg bg-teal-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {output.isSaving ? "Saving…" : "Save"}
                              </button>
                            </div>
                          </>
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
    </DashboardLayout>
  );
}

export const getServerSideProps: GetServerSideProps<DashboardProps> = requireAuthPage(
  async ({ authHeaders, session }) => {
    // Fetch the active organization name if there is one
    let teamName: string | null = null;
    let activeOrgId = session.session.activeOrganizationId;

    if (activeOrgId) {
      const orgsResponse = await auth.api.getFullOrganization({
        headers: authHeaders,
        query: { organizationId: activeOrgId },
      });
      if (orgsResponse && orgsResponse.name) {
        teamName = orgsResponse.name;
      }
    }

    // If no active org, try to get first org the user belongs to
    if (!teamName) {
      const listResponse = await auth.api.listOrganizations({ headers: authHeaders });
      if (listResponse && listResponse.length > 0) {
        teamName = listResponse[0].name;
        activeOrgId = listResponse[0].id;
        await auth.api.setActiveOrganization({
          headers: authHeaders,
          body: { organizationId: listResponse[0].id },
        });
      }
    }

    // List all orgs for the team switcher
    const allOrgs = await auth.api.listOrganizations({ headers: authHeaders });
    const teams = (allOrgs ?? []).map((o) => ({ id: o.id, name: o.name }));

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
        teamId: activeOrgId ?? null,
        defaultTone,
        activePlatforms,
        teams,
      },
    };
  }
);
