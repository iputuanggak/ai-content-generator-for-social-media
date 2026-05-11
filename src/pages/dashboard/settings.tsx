import { useState } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { brandSettings, member } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { GetServerSideProps } from "next";
import type { Tone, Platform } from "@/lib/content-adapter";
import { PLATFORM_OPTIONS } from "@/lib/platform-metadata";
import { requireAuthPage } from "@/lib/require-auth-page";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "humorous", label: "Humorous" },
  { value: "inspirational", label: "Inspirational" },
];


interface SettingsPageProps {
  userName: string;
  teamName: string;
  teamId: string;
  isAdmin: boolean;
  brandVoice: string;
  defaultTone: Tone;
  activePlatforms: Platform[];
  modelId: string;
  teams: { id: string; name: string }[];
}

export default function SettingsPage({
  userName,
  teamName,
  teamId,
  isAdmin,
  brandVoice: initialBrandVoice,
  defaultTone: initialDefaultTone,
  activePlatforms: initialActivePlatforms,
  modelId: initialModelId,
  teams,
}: SettingsPageProps) {
  const [brandVoice, setBrandVoice] = useState(initialBrandVoice);
  const [defaultTone, setDefaultTone] = useState<Tone>(initialDefaultTone);
  const [activePlatforms, setActivePlatforms] = useState<Platform[]>(initialActivePlatforms);
  const [modelId, setModelId] = useState(initialModelId);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  function togglePlatform(platform: Platform) {
    if (!isAdmin) return;
    setActivePlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/teams/${teamId}/brand-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandVoice, defaultTone, activePlatforms, modelId }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const data = await res.json() as { error?: string };
        setSaveError(data.error ?? "Failed to save settings");
      }
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <DashboardLayout
      userName={userName}
      teamName={teamName}
      teamId={teamId}
      teams={teams}
    >
      <main className="mx-auto max-w-2xl px-6 py-12">
        {/* Nav breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm text-zinc-500">
          <span className="text-zinc-900">Brand Settings</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900">Brand Settings</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {isAdmin
              ? "Configure how your team's content is generated."
              : "These settings control how your team's content is generated. Only admins can edit them."}
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Brand Voice */}
          <div>
            <label
              htmlFor="brand-voice"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              Brand Voice
            </label>
            <textarea
              id="brand-voice"
              value={brandVoice}
              onChange={(e) => setBrandVoice(e.target.value)}
              readOnly={!isAdmin}
              placeholder="Describe your brand's personality and tone (e.g. bold, friendly, expert)…"
              rows={4}
              className={[
                "w-full rounded-lg border px-4 py-3 text-sm text-zinc-900 outline-none",
                isAdmin
                  ? "border-zinc-200 bg-white placeholder-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                  : "border-zinc-100 bg-zinc-50 text-zinc-600 cursor-default",
              ].join(" ")}
            />
          </div>

          {/* Default Tone */}
          <div>
            <label
              htmlFor="default-tone"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              Default Tone
            </label>
            <select
              id="default-tone"
              value={defaultTone}
              onChange={(e) => setDefaultTone(e.target.value as Tone)}
              disabled={!isAdmin}
              className={[
                "rounded-lg border px-4 py-2.5 text-sm text-zinc-900 outline-none",
                isAdmin
                  ? "border-zinc-200 bg-white focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                  : "border-zinc-100 bg-zinc-50 text-zinc-600 cursor-default",
              ].join(" ")}
            >
              {TONE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Active Platforms */}
          <div>
            <p className="mb-2 block text-sm font-medium text-zinc-700">Active Platforms</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_OPTIONS.map(({ value, label }) => {
                const isActive = activePlatforms.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => togglePlatform(value)}
                    disabled={!isAdmin}
                    aria-pressed={isActive}
                    className={[
                      "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                      isActive
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-white text-zinc-600",
                      !isAdmin ? "cursor-default opacity-70" : "hover:border-zinc-700",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* OpenRouter Model */}
          <div>
            <label
              htmlFor="model-id"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              OpenRouter Model
            </label>
            <input
              id="model-id"
              type="text"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              readOnly={!isAdmin}
              placeholder="e.g. google/gemini-2.5-flash"
              className={[
                "w-full rounded-lg border px-4 py-2.5 text-sm text-zinc-900 outline-none",
                isAdmin
                  ? "border-zinc-200 bg-white placeholder-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                  : "border-zinc-100 bg-zinc-50 text-zinc-600 cursor-default",
              ].join(" ")}
            />
          </div>

          {/* Feedback messages */}
          {saveError && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{saveError}</p>
          )}
          {saveSuccess && (
            <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              Brand settings saved.
            </p>
          )}

          {/* Save button — only visible to admins */}
          {isAdmin && (
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save Settings"}
            </button>
          )}
        </form>
      </main>
    </DashboardLayout>
  );
}

export const getServerSideProps = requireAuthPage(
  async ({ authHeaders, session }) => {
    let activeOrgId = session.session.activeOrganizationId;

    // Fall back to first org if no active org
    if (!activeOrgId) {
      const listResponse = await auth.api.listOrganizations({ headers: authHeaders });
      if (listResponse && listResponse.length > 0) {
        activeOrgId = listResponse[0].id;
        await auth.api.setActiveOrganization({
          headers: authHeaders,
          body: { organizationId: listResponse[0].id },
        });
      }
    }

    if (!activeOrgId) {
      return { redirect: { destination: "/onboarding", permanent: false } };
    }

    // Get org info
    const orgResponse = await auth.api.getFullOrganization({
      headers: authHeaders,
      query: { organizationId: activeOrgId },
    });

    if (!orgResponse) {
      return { redirect: { destination: "/onboarding", permanent: false } };
    }

    // Check member role
    const memberRows = await db
      .select()
      .from(member)
      .where(and(eq(member.organizationId, activeOrgId), eq(member.userId, session.user.id)))
      .limit(1);

    const isAdmin =
      memberRows.length > 0 &&
      (memberRows[0].role === "owner" || memberRows[0].role === "admin");

    // Read brand settings
    const settingsRows = await db
      .select()
      .from(brandSettings)
      .where(eq(brandSettings.organizationId, activeOrgId))
      .limit(1);

    if (settingsRows.length === 0) {
      return { redirect: { destination: "/dashboard", permanent: false } };
    }

    const settings = settingsRows[0];

    const allOrgs = await auth.api.listOrganizations({ headers: authHeaders });
    const teams = (allOrgs ?? []).map((o) => ({ id: o.id, name: o.name }));

    return {
      props: {
        userName: session.user.name,
        teamName: orgResponse.name,
        teamId: activeOrgId,
        isAdmin,
        brandVoice: settings.brandVoice,
        defaultTone: settings.defaultTone as Tone,
        activePlatforms: settings.activePlatforms as Platform[],
        modelId: settings.modelId,
        teams,
      },
    };
  }
);
