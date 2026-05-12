import { useState } from "react";
import { toast } from "sonner";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { brandSettings, member } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { GetServerSideProps } from "next";
import type { Tone, Platform } from "@/lib/content-adapter";
import { PLATFORM_OPTIONS } from "@/lib/platform-metadata";
import { requireAuthPage } from "@/lib/require-auth-page";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;

    setIsSaving(true);

    try {
      const res = await fetch(`/api/teams/${teamId}/brand-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandVoice, defaultTone, activePlatforms, modelId }),
      });

      if (res.ok) {
        toast.success("Brand settings saved.");
      } else {
        const data = await res.json() as { error?: string };
        toast.error(data.error ?? "Failed to save settings");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-2xl px-6 py-12">
        {/* Nav breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm text-stone-500">
          <span className="text-stone-900">Brand Settings</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-stone-900">Brand Settings</h1>
          <p className="mt-1 text-sm text-stone-500">
            {isAdmin
              ? "Configure how your team's content is generated."
              : "These settings control how your team's content is generated. Only admins can edit them."}
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
          {!isAdmin && (
            <p className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
              You are viewing these settings in read-only mode. Contact an admin to make changes.
            </p>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Brand Voice */}
            <div>
              <label
                htmlFor="brand-voice"
                className={["mb-1.5 block text-sm font-medium", isAdmin ? "text-stone-700" : "text-stone-500"].join(" ")}
              >
                Brand Voice
              </label>
              <Textarea
                id="brand-voice"
                value={brandVoice}
                onChange={(e) => setBrandVoice(e.target.value)}
                readOnly={!isAdmin}
                disabled={!isAdmin}
                placeholder="Describe your brand's personality and tone (e.g. bold, friendly, expert)…"
                rows={4}
              />
            </div>

            {/* Default Tone */}
            <div>
              <label
                htmlFor="default-tone"
                className={["mb-1.5 block text-sm font-medium", isAdmin ? "text-stone-700" : "text-stone-500"].join(" ")}
              >
                Default Tone
              </label>
              <Select
                value={defaultTone}
                onValueChange={(val) => setDefaultTone(val as Tone)}
                disabled={!isAdmin}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
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

            {/* Active Platforms */}
            <div>
              <p className={["mb-2 block text-sm font-medium", isAdmin ? "text-stone-700" : "text-stone-500"].join(" ")}>
                Active Platforms
              </p>
              <ToggleGroup
                type="multiple"
                value={activePlatforms}
                onValueChange={(vals) => {
                  if (!isAdmin) return;
                  setActivePlatforms(vals as Platform[]);
                }}
                className="flex flex-wrap gap-2"
              >
                {PLATFORM_OPTIONS.map(({ value, label }) => (
                  <ToggleGroupItem
                    key={value}
                    value={value}
                    disabled={!isAdmin}
                    variant="outline"
                  >
                    {label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            {/* OpenRouter Model */}
            <div>
              <label
                htmlFor="model-id"
                className={["mb-1.5 block text-sm font-medium", isAdmin ? "text-stone-700" : "text-stone-500"].join(" ")}
              >
                OpenRouter Model
              </label>
              <Input
                id="model-id"
                type="text"
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                readOnly={!isAdmin}
                disabled={!isAdmin}
                placeholder="e.g. google/gemini-2.5-flash"
              />
            </div>

            {/* Save button — only visible to admins */}
            {isAdmin && (
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving…" : "Save Settings"}
              </Button>
            )}
          </form>
        </div>
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
