import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { member, user } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { GetServerSideProps } from "next";
import { requireAuthPage } from "@/lib/require-auth-page";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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

interface MembersPageProps {
  userName: string;
  teamName: string;
  teamId: string;
  isAdmin: boolean;
  currentUserId: string;
  members: MemberData[];
  teams: { id: string; name: string }[];
}

export default function MembersPage({
  userName,
  teamName,
  teamId,
  isAdmin,
  currentUserId,
  members: initialMembers,
  teams,
}: MembersPageProps) {
  const [members, setMembers] = useState<MemberData[]>(initialMembers);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState<MemberData | null>(null);

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

  return (
    <DashboardLayout
      userName={userName}
      teamName={teamName}
      teamId={teamId}
      teams={teams}
    >
      <main className="mx-auto max-w-3xl px-6 py-12">
        {/* Breadcrumb */}
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

        {/* Invite form — admin only */}
        {isAdmin && (
          <section className="mb-8 rounded-xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-stone-900">Invite a Member</h2>
            <form onSubmit={handleInvite} className="flex gap-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Enter email address…"
                required
                className="flex-1 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 outline-none transition-colors focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
              <button
                type="submit"
                disabled={isInviting || !inviteEmail.trim()}
                className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isInviting ? "Sending…" : "Send Invite"}
              </button>
            </form>
          </section>
        )}

        {/* Members list */}
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

                  {/* Remove button — admin only, can't remove self or owners */}
                  {isAdmin && m.userId !== currentUserId && m.role !== "owner" && (
                    <button
                      onClick={() => setConfirmRemoveMember(m)}
                      disabled={removingId === m.id}
                      className="rounded-md border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-600 transition-colors hover:bg-red-50 hover:border-red-200 hover:text-red-700 disabled:opacity-50"
                    >
                      {removingId === m.id ? "Removing…" : "Remove"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Remove confirmation dialog */}
      <Dialog
        open={!!confirmRemoveMember}
        onOpenChange={(open) => { if (!open) setConfirmRemoveMember(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-medium text-stone-900">{confirmRemoveMember?.user.name}</span>{" "}
              from the team? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setConfirmRemoveMember(null)}
              className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              onClick={() => confirmRemoveMember && handleRemove(confirmRemoveMember.id)}
              disabled={!!removingId}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {removingId ? "Removing…" : "Remove"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

export const getServerSideProps = requireAuthPage(
  async ({ authHeaders, session }) => {
    let activeOrgId = session.session.activeOrganizationId;

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

    // List all members with user info
    const membersWithUsers = await db
      .select({
        id: member.id,
        userId: member.userId,
        role: member.role,
        createdAt: member.createdAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(eq(member.organizationId, activeOrgId));

    // List all teams the user belongs to for team switcher
    const allOrgs = await auth.api.listOrganizations({ headers: authHeaders });
    const teams = (allOrgs ?? []).map((o) => ({ id: o.id, name: o.name }));

    return {
      props: {
        userName: session.user.name,
        teamName: orgResponse.name,
        teamId: activeOrgId,
        isAdmin,
        currentUserId: session.user.id,
        members: membersWithUsers.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
        })),
        teams,
      },
    };
  }
);
