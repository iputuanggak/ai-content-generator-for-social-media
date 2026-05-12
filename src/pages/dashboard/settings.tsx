import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { useTeam } from "@/lib/team-context";
import type { Tone, Platform } from "@/lib/content-adapter";
import { PLATFORM_OPTIONS } from "@/lib/platform-metadata";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ContentSkeleton } from "@/components/content-skeleton";
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

export default function SettingsPage() {
  const router = useRouter();
  const { teamId, loading: teamLoading } = useTeam();

  const [brandVoice, setBrandVoice] = useState("");
  const [defaultTone, setDefaultTone] = useState<Tone>("professional");
  const [activePlatforms, setActivePlatforms] = useState<Platform[]>([]);
  const [modelId, setModelId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!teamId || teamLoading) return;
    let cancelled = false;

    fetch(`/api/teams/${teamId}/brand-settings`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data: Record<string, unknown>) => {
        if (cancelled) return;
        setBrandVoice((data.brandVoice as string) ?? "");
        setDefaultTone((data.defaultTone as Tone) ?? "professional");
        setActivePlatforms((data.activePlatforms as Platform[]) ?? []);
        setModelId((data.modelId as string) ?? "");
        setIsAdmin((data.isAdmin as boolean) ?? false);
      })
      .catch(() => {
        if (cancelled) return;
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [teamId, teamLoading]);

  useEffect(() => {
    if (!teamLoading && !teamId) {
      router.push("/onboarding");
    }
  }, [teamLoading, teamId, router]);

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

  const showSkeleton = teamLoading || isLoading;

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-2xl px-6 py-12">
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

        {showSkeleton ? (
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
            <ContentSkeleton lines={6} />
          </div>
        ) : (
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
            {!isAdmin && (
              <p className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
                You are viewing these settings in read-only mode. Contact an admin to make changes.
              </p>
            )}

            <form onSubmit={handleSave} className="space-y-6">
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

              {isAdmin && (
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving…" : "Save Settings"}
                </Button>
              )}
            </form>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
