import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { toast } from "sonner";
import { useTeam } from "@/lib/team-context";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ContentSkeleton } from "@/components/content-skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MemberData {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function MembersPage() {
  const router = useRouter();
  const { teamId, userId, loading: teamLoading } = useTeam();

  const [members, setMembers] = useState<MemberData[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState<MemberData | null>(null);

  useEffect(() => {
    if (!teamId || teamLoading) return;
    let cancelled = false;

    fetch(`/api/teams/${teamId}/members`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data: { members: MemberData[]; isAdmin: boolean }) => {
        if (cancelled) return;
        setMembers(data.members);
        setIsAdmin(data.isAdmin);
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

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setIsInviting(true);

    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });

      const data = await res.json() as { error?: string };

      if (res.ok) {
        toast.success(`Invitation sent to ${inviteEmail}`);
        setInviteEmail("");
      } else {
        toast.error(data.error ?? "Failed to send invitation");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRemove(memberId: string) {
    setRemovingId(memberId);
    setConfirmRemoveMember(null);

    try {
      const res = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        toast.success("Member removed.");
      } else {
        toast.error("Failed to remove member.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setRemovingId(null);
    }
  }

  const ROLE_LABELS: Record<string, string> = {
    owner: "Owner",
    admin: "Admin",
    member: "Member",
  };

  const showSkeleton = teamLoading || isLoading;

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8 flex items-center gap-2 text-sm text-stone-500">
          <Link href="/dashboard" className="hover:text-stone-900">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-stone-900">Members</span>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-stone-900">Team Members</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/settings"
              className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
            >
              Settings
            </Link>
          </div>
        </div>

        {showSkeleton ? (
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
            <ContentSkeleton lines={6} />
          </div>
        ) : (
          <>
            {isAdmin && (
              <section className="mb-8 rounded-xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-stone-900">Invite a Member</h2>
                <form onSubmit={handleInvite} className="flex gap-3">
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address…"
                    required
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={isInviting || !inviteEmail.trim()}
                  >
                    {isInviting ? "Sending…" : "Send Invite"}
                  </Button>
                </form>
              </section>
            )}

            <section className="rounded-xl border border-stone-200 bg-stone-50 shadow-sm">
              <div className="divide-y divide-stone-100">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-stone-900">{m.user.name}</p>
                      <p className="text-xs text-stone-500">{m.user.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={[
                          "rounded-full px-2.5 py-0.5 text-xs font-medium",
                          m.role === "owner"
                            ? "bg-teal-600 text-white"
                            : m.role === "admin"
                            ? "border border-teal-500 text-teal-700 bg-teal-50"
                            : "bg-stone-200 text-stone-600",
                        ].join(" ")}
                      >
                        {ROLE_LABELS[m.role] ?? m.role}
                      </span>

                      {isAdmin && m.userId !== userId && m.role !== "owner" && (
                        <Button
                          variant="destructive"
                          size="xs"
                          onClick={() => setConfirmRemoveMember(m)}
                          disabled={removingId === m.id}
                        >
                          {removingId === m.id ? "Removing…" : "Remove"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <ConfirmDialog
        open={!!confirmRemoveMember}
        onOpenChange={(open) => { if (!open) setConfirmRemoveMember(null); }}
        title="Remove Member"
        description={
          <>
            Are you sure you want to remove{" "}
            <span className="font-medium text-stone-900">{confirmRemoveMember?.user.name}</span>{" "}
            from the team? This action cannot be undone.
          </>
        }
        confirmLabel={removingId ? "Removing…" : "Remove"}
        onConfirm={() => confirmRemoveMember && handleRemove(confirmRemoveMember.id)}
        variant="destructive"
        confirmDisabled={!!removingId}
      />
    </DashboardLayout>
  );
}
