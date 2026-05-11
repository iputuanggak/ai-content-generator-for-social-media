import { useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { member, user } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { GetServerSideProps } from "next";
import { requireAuthPage } from "@/lib/require-auth-page";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

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
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setIsInviting(true);
    setInviteError(null);
    setInviteSuccess(null);

    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });

      const data = await res.json() as { error?: string };

      if (res.ok) {
        setInviteSuccess(`Invitation sent to ${inviteEmail}`);
        setInviteEmail("");
      } else {
        setInviteError(data.error ?? "Failed to send invitation");
      }
    } catch {
      setInviteError("Network error. Please try again.");
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRemove(memberId: string) {
    setRemovingId(memberId);
    setConfirmRemoveId(null);

    try {
      const res = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      }
    } catch {
      // silently fail
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
        <div className="mb-8 flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/dashboard" className="hover:text-zinc-900">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-zinc-900">Members</span>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900">Team Members</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/settings"
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Settings
            </Link>
          </div>
        </div>

        {/* Invite form — admin only */}
        {isAdmin && (
          <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-zinc-900">Invite a Member</h2>
            <form onSubmit={handleInvite} className="flex gap-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Enter email address…"
                required
                className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
              />
              <button
                type="submit"
                disabled={isInviting || !inviteEmail.trim()}
                className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isInviting ? "Sending…" : "Send Invite"}
              </button>
            </form>
            {inviteError && (
              <p className="mt-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {inviteError}
              </p>
            )}
            {inviteSuccess && (
              <p className="mt-3 rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">
                {inviteSuccess}
              </p>
            )}
          </section>
        )}

        {/* Members list */}
        <section className="rounded-xl border border-zinc-200 bg-white">
          <div className="divide-y divide-zinc-100">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{m.user.name}</p>
                  <p className="text-xs text-zinc-500">{m.user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={[
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      m.role === "owner"
                        ? "bg-zinc-900 text-white"
                        : m.role === "admin"
                        ? "bg-zinc-200 text-zinc-800"
                        : "bg-zinc-100 text-zinc-600",
                    ].join(" ")}
                  >
                    {ROLE_LABELS[m.role] ?? m.role}
                  </span>

                  {/* Remove button — admin only, can't remove self or owners */}
                  {isAdmin && m.userId !== currentUserId && m.role !== "owner" && (
                    <>
                      {confirmRemoveId === m.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-500">Remove?</span>
                          <button
                            onClick={() => handleRemove(m.id)}
                            disabled={removingId === m.id}
                            className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {removingId === m.id ? "Removing…" : "Confirm"}
                          </button>
                          <button
                            onClick={() => setConfirmRemoveId(null)}
                            className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmRemoveId(m.id)}
                          className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
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
