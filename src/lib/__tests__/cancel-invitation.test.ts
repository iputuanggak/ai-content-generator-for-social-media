import { describe, it, expect } from "vitest";

interface MockSession {
  user: { id: string; email: string };
  session: { activeOrganizationId: string | null };
}

interface MockInvitationRow {
  id: string;
  organizationId: string;
  email: string;
  role: string | null;
  status: string;
  expiresAt: Date;
  inviterId: string;
}

async function handleCancelInvitation({
  teamId,
  invitationId,
  session,
  getMember,
  getInvitation,
  cancelInvitation,
}: {
  teamId: string;
  invitationId: string;
  session: MockSession | null;
  getMember: (orgId: string, userId: string) => Promise<{ role: string } | null>;
  getInvitation: (invitationId: string) => Promise<MockInvitationRow | null>;
  cancelInvitation: (invitationId: string) => Promise<void>;
}): Promise<{ status: number; body: unknown }> {
  if (!session) return { status: 401, body: { error: "Unauthorized" } };

  const currentMember = await getMember(teamId, session.user.id);
  if (!currentMember) return { status: 403, body: { error: "Forbidden" } };

  if (currentMember.role !== "owner" && currentMember.role !== "admin") {
    return { status: 403, body: { error: "Only team admins can cancel invitations" } };
  }

  const invitation = await getInvitation(invitationId);
  if (!invitation || invitation.organizationId !== teamId) {
    return { status: 404, body: { error: "Invitation not found" } };
  }

  await cancelInvitation(invitationId);
  return { status: 200, body: { success: true } };
}

const adminSession: MockSession = {
  user: { id: "user-1", email: "admin@example.com" },
  session: { activeOrganizationId: "org-1" },
};

const memberSession: MockSession = {
  user: { id: "user-2", email: "member@example.com" },
  session: { activeOrganizationId: "org-1" },
};

const adminMember = { role: "owner" };
const nonAdminMember = { role: "member" };

const sampleInvitation: MockInvitationRow = {
  id: "inv-1",
  organizationId: "org-1",
  email: "pending@example.com",
  role: "member",
  status: "pending",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  inviterId: "user-1",
};

describe("DELETE /api/teams/[slug]/invitations/[invitationId]", () => {
  it("returns 401 when unauthenticated", async () => {
    const result = await handleCancelInvitation({
      teamId: "org-1",
      invitationId: "inv-1",
      session: null,
      getMember: async () => adminMember,
      getInvitation: async () => sampleInvitation,
      cancelInvitation: async () => {},
    });
    expect(result.status).toBe(401);
  });

  it("returns 403 when user is not a team member", async () => {
    const result = await handleCancelInvitation({
      teamId: "org-1",
      invitationId: "inv-1",
      session: adminSession,
      getMember: async () => null,
      getInvitation: async () => sampleInvitation,
      cancelInvitation: async () => {},
    });
    expect(result.status).toBe(403);
  });

  it("returns 403 when non-admin tries to cancel", async () => {
    const result = await handleCancelInvitation({
      teamId: "org-1",
      invitationId: "inv-1",
      session: memberSession,
      getMember: async () => nonAdminMember,
      getInvitation: async () => sampleInvitation,
      cancelInvitation: async () => {},
    });
    expect(result.status).toBe(403);
  });

  it("returns 404 when invitation not found", async () => {
    const result = await handleCancelInvitation({
      teamId: "org-1",
      invitationId: "nonexistent",
      session: adminSession,
      getMember: async () => adminMember,
      getInvitation: async () => null,
      cancelInvitation: async () => {},
    });
    expect(result.status).toBe(404);
  });

  it("returns 404 when invitation belongs to different org", async () => {
    const otherOrgInvitation: MockInvitationRow = { ...sampleInvitation, organizationId: "org-2" };
    const result = await handleCancelInvitation({
      teamId: "org-1",
      invitationId: "inv-1",
      session: adminSession,
      getMember: async () => adminMember,
      getInvitation: async () => otherOrgInvitation,
      cancelInvitation: async () => {},
    });
    expect(result.status).toBe(404);
  });

  it("returns 200 and cancels invitation when admin cancels own org invitation", async () => {
    const cancelledIds: string[] = [];
    const result = await handleCancelInvitation({
      teamId: "org-1",
      invitationId: "inv-1",
      session: adminSession,
      getMember: async () => adminMember,
      getInvitation: async () => sampleInvitation,
      cancelInvitation: async (id) => { cancelledIds.push(id); },
    });
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ success: true });
    expect(cancelledIds).toContain("inv-1");
  });
});
