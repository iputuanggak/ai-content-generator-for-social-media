import { describe, it, expect } from "vitest";

// Pure handler logic for member management API

interface MockSession {
  user: { id: string; email: string };
  session: { activeOrganizationId: string | null };
}

interface MockMember {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: Date;
}

interface MockUser {
  id: string;
  name: string;
  email: string;
}

interface MockMemberWithUser extends MockMember {
  user: MockUser;
}

interface MockInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: string | null;
  status: string;
  expiresAt: Date;
  inviterId: string;
}

// ─── GET /api/teams/[id]/members ─────────────────────────────────────────────

async function handleListMembers({
  teamId,
  session,
  getMember,
  listMembers,
}: {
  teamId: string;
  session: MockSession | null;
  getMember: (orgId: string, userId: string) => Promise<MockMember | null>;
  listMembers: (orgId: string) => Promise<MockMemberWithUser[]>;
}): Promise<{ status: number; body: unknown }> {
  if (!session) return { status: 401, body: { error: "Unauthorized" } };

  const currentMember = await getMember(teamId, session.user.id);
  if (!currentMember) return { status: 403, body: { error: "Forbidden" } };

  const members = await listMembers(teamId);
  const isAdmin = currentMember.role === "owner" || currentMember.role === "admin";
  return { status: 200, body: { members, isAdmin } };
}

// ─── POST /api/teams/[id]/members (invite by email) ──────────────────────────

async function handleInviteMember({
  teamId,
  session,
  body,
  getMember,
  createInvitation,
}: {
  teamId: string;
  session: MockSession | null;
  body: unknown;
  getMember: (orgId: string, userId: string) => Promise<MockMember | null>;
  createInvitation: (orgId: string, email: string, inviterId: string) => Promise<MockInvitation>;
}): Promise<{ status: number; body: unknown }> {
  if (!session) return { status: 401, body: { error: "Unauthorized" } };

  const currentMember = await getMember(teamId, session.user.id);
  if (!currentMember) return { status: 403, body: { error: "Forbidden" } };

  if (currentMember.role !== "owner" && currentMember.role !== "admin") {
    return { status: 403, body: { error: "Only team admins can invite members" } };
  }

  const { email } = body as { email?: string };
  if (!email || !email.includes("@")) {
    return { status: 400, body: { error: "Valid email is required" } };
  }

  const invitation = await createInvitation(teamId, email, session.user.id);
  return { status: 201, body: { invitation } };
}

// ─── DELETE /api/teams/[id]/members/[memberId] ────────────────────────────────

async function handleRemoveMember({
  teamId,
  memberId,
  session,
  getMemberByUserId,
  getMemberById,
  removeMember,
}: {
  teamId: string;
  memberId: string;
  session: MockSession | null;
  getMemberByUserId: (orgId: string, userId: string) => Promise<MockMember | null>;
  getMemberById: (memberId: string) => Promise<MockMember | null>;
  removeMember: (memberId: string) => Promise<void>;
}): Promise<{ status: number; body: unknown }> {
  if (!session) return { status: 401, body: { error: "Unauthorized" } };

  const currentMember = await getMemberByUserId(teamId, session.user.id);
  if (!currentMember) return { status: 403, body: { error: "Forbidden" } };

  if (currentMember.role !== "owner" && currentMember.role !== "admin") {
    return { status: 403, body: { error: "Only team admins can remove members" } };
  }

  const targetMember = await getMemberById(memberId);
  if (!targetMember || targetMember.organizationId !== teamId) {
    return { status: 404, body: { error: "Member not found" } };
  }

  // Cannot remove owners
  if (targetMember.role === "owner") {
    return { status: 403, body: { error: "Cannot remove an owner" } };
  }

  await removeMember(memberId);
  return { status: 200, body: { success: true } };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const adminSession: MockSession = {
  user: { id: "user-1", email: "admin@example.com" },
  session: { activeOrganizationId: "org-1" },
};

const memberSession: MockSession = {
  user: { id: "user-2", email: "member@example.com" },
  session: { activeOrganizationId: "org-1" },
};

const adminMember: MockMember = {
  id: "member-1",
  organizationId: "org-1",
  userId: "user-1",
  role: "owner",
  createdAt: new Date(),
};

const nonAdminMember: MockMember = {
  id: "member-2",
  organizationId: "org-1",
  userId: "user-2",
  role: "member",
  createdAt: new Date(),
};

const membersWithUsers: MockMemberWithUser[] = [
  {
    ...adminMember,
    user: { id: "user-1", name: "Admin User", email: "admin@example.com" },
  },
  {
    ...nonAdminMember,
    user: { id: "user-2", name: "Regular Member", email: "member@example.com" },
  },
];

const sampleInvitation: MockInvitation = {
  id: "inv-1",
  organizationId: "org-1",
  email: "new@example.com",
  role: "member",
  status: "pending",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  inviterId: "user-1",
};

// ─── Tests: List Members ───────────────────────────────────────────────────────

describe("GET /api/teams/[id]/members", () => {
  it("returns 401 when unauthenticated", async () => {
    const result = await handleListMembers({
      teamId: "org-1",
      session: null,
      getMember: async () => adminMember,
      listMembers: async () => membersWithUsers,
    });
    expect(result.status).toBe(401);
  });

  it("returns 403 when user is not a team member", async () => {
    const result = await handleListMembers({
      teamId: "org-1",
      session: adminSession,
      getMember: async () => null,
      listMembers: async () => membersWithUsers,
    });
    expect(result.status).toBe(403);
  });

  it("returns 200 with members list for any team member", async () => {
    const result = await handleListMembers({
      teamId: "org-1",
      session: memberSession,
      getMember: async () => nonAdminMember,
      listMembers: async () => membersWithUsers,
    });
    expect(result.status).toBe(200);
    expect((result.body as { members: MockMemberWithUser[] }).members).toHaveLength(2);
    expect((result.body as { isAdmin: boolean }).isAdmin).toBe(false);
  });

  it("returns 200 with isAdmin true for admin", async () => {
    const result = await handleListMembers({
      teamId: "org-1",
      session: adminSession,
      getMember: async () => adminMember,
      listMembers: async () => membersWithUsers,
    });
    expect(result.status).toBe(200);
    expect((result.body as { isAdmin: boolean }).isAdmin).toBe(true);
  });

  it("returns members list for admin too", async () => {
    const result = await handleListMembers({
      teamId: "org-1",
      session: adminSession,
      getMember: async () => adminMember,
      listMembers: async () => membersWithUsers,
    });
    expect(result.status).toBe(200);
    const members = (result.body as { members: MockMemberWithUser[] }).members;
    expect(members[0].user.name).toBe("Admin User");
  });
});

// ─── Tests: Invite Member ─────────────────────────────────────────────────────

describe("POST /api/teams/[id]/members", () => {
  it("returns 401 when unauthenticated", async () => {
    const result = await handleInviteMember({
      teamId: "org-1",
      session: null,
      body: { email: "new@example.com" },
      getMember: async () => adminMember,
      createInvitation: async () => sampleInvitation,
    });
    expect(result.status).toBe(401);
  });

  it("returns 403 when user is not a team member", async () => {
    const result = await handleInviteMember({
      teamId: "org-1",
      session: adminSession,
      body: { email: "new@example.com" },
      getMember: async () => null,
      createInvitation: async () => sampleInvitation,
    });
    expect(result.status).toBe(403);
  });

  it("returns 403 when non-admin tries to invite", async () => {
    const result = await handleInviteMember({
      teamId: "org-1",
      session: memberSession,
      body: { email: "new@example.com" },
      getMember: async () => nonAdminMember,
      createInvitation: async () => sampleInvitation,
    });
    expect(result.status).toBe(403);
  });

  it("returns 400 when email is missing", async () => {
    const result = await handleInviteMember({
      teamId: "org-1",
      session: adminSession,
      body: {},
      getMember: async () => adminMember,
      createInvitation: async () => sampleInvitation,
    });
    expect(result.status).toBe(400);
  });

  it("returns 400 when email is invalid", async () => {
    const result = await handleInviteMember({
      teamId: "org-1",
      session: adminSession,
      body: { email: "not-an-email" },
      getMember: async () => adminMember,
      createInvitation: async () => sampleInvitation,
    });
    expect(result.status).toBe(400);
  });

  it("returns 201 and creates invitation when admin invites by email", async () => {
    const calls: { orgId: string; email: string; inviterId: string }[] = [];
    const result = await handleInviteMember({
      teamId: "org-1",
      session: adminSession,
      body: { email: "new@example.com" },
      getMember: async () => adminMember,
      createInvitation: async (orgId, email, inviterId) => {
        calls.push({ orgId, email, inviterId });
        return sampleInvitation;
      },
    });
    expect(result.status).toBe(201);
    expect(calls[0]).toEqual({ orgId: "org-1", email: "new@example.com", inviterId: "user-1" });
  });
});

// ─── Tests: Remove Member ─────────────────────────────────────────────────────

describe("DELETE /api/teams/[id]/members/[memberId]", () => {
  it("returns 401 when unauthenticated", async () => {
    const result = await handleRemoveMember({
      teamId: "org-1",
      memberId: "member-2",
      session: null,
      getMemberByUserId: async () => adminMember,
      getMemberById: async () => nonAdminMember,
      removeMember: async () => {},
    });
    expect(result.status).toBe(401);
  });

  it("returns 403 when user is not a team member", async () => {
    const result = await handleRemoveMember({
      teamId: "org-1",
      memberId: "member-2",
      session: adminSession,
      getMemberByUserId: async () => null,
      getMemberById: async () => nonAdminMember,
      removeMember: async () => {},
    });
    expect(result.status).toBe(403);
  });

  it("returns 403 when non-admin tries to remove", async () => {
    const result = await handleRemoveMember({
      teamId: "org-1",
      memberId: "member-1",
      session: memberSession,
      getMemberByUserId: async () => nonAdminMember,
      getMemberById: async () => adminMember,
      removeMember: async () => {},
    });
    expect(result.status).toBe(403);
  });

  it("returns 404 when target member not found", async () => {
    const result = await handleRemoveMember({
      teamId: "org-1",
      memberId: "nonexistent",
      session: adminSession,
      getMemberByUserId: async () => adminMember,
      getMemberById: async () => null,
      removeMember: async () => {},
    });
    expect(result.status).toBe(404);
  });

  it("returns 403 when trying to remove an owner", async () => {
    const result = await handleRemoveMember({
      teamId: "org-1",
      memberId: "member-1",
      session: adminSession,
      getMemberByUserId: async () => adminMember,
      getMemberById: async () => adminMember,
      removeMember: async () => {},
    });
    expect(result.status).toBe(403);
  });

  it("returns 200 and removes member when admin removes a non-owner", async () => {
    const removedIds: string[] = [];
    const result = await handleRemoveMember({
      teamId: "org-1",
      memberId: "member-2",
      session: adminSession,
      getMemberByUserId: async () => adminMember,
      getMemberById: async () => nonAdminMember,
      removeMember: async (id) => { removedIds.push(id); },
    });
    expect(result.status).toBe(200);
    expect(removedIds).toContain("member-2");
  });

  it("returns 404 when target member belongs to a different org", async () => {
    const otherOrgMember: MockMember = { ...nonAdminMember, organizationId: "org-2" };
    const result = await handleRemoveMember({
      teamId: "org-1",
      memberId: "member-2",
      session: adminSession,
      getMemberByUserId: async () => adminMember,
      getMemberById: async () => otherOrgMember,
      removeMember: async () => {},
    });
    expect(result.status).toBe(404);
  });
});
