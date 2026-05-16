import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { randomUUID } from "crypto";
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      organization: schema.organization,
      member: schema.member,
      invitation: schema.invitation,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  plugins: [
    organization({
      async sendInvitationEmail(data) {
        const { Resend } = await import("resend");
        const { InvitationEmail } = await import("@/emails/invitation-email");
        const resend = new Resend(process.env.RESEND_API_KEY);

        const baseUrl = process.env.BETTER_AUTH_URL!;
        const inviteLink = `${baseUrl}/accept-invitation?invitationId=${data.id}`;

        const { error } = await resend.emails.send({
          from: process.env.EMAIL_FROM ?? "ContentGen <noreply@contentgen.app>",
          to: data.email,
          subject: `${data.inviter.user.name} invited you to join ${data.organization.name}`,
          react: InvitationEmail({
            invitedByUsername: data.inviter.user.name,
            teamName: data.organization.name,
            inviteLink,
          }),
        });

        if (error) {
          throw new Error(`Failed to send invitation email: ${error.message}`);
        }
      },
      organizationHooks: {
        afterCreateOrganization: async ({ organization: org }) => {
          // Automatically create BrandSettings with defaults when a Team is created
          await db.insert(schema.brandSettings).values({
            id: randomUUID(),
            organizationId: org.id,
            brandVoice: "",
            defaultTone: "professional",
            activePlatforms: [
              "twitter",
              "linkedin",
              "instagram",
              "facebook",
              "tiktok",
              "youtube",
              "threads",
              "pinterest",
            ],
            modelId: "google/gemini-2.5-flash",
            updatedAt: new Date(),
          });
        },
      },
    }),
  ],
  emailAndPassword: {
    enabled: true,
  },
});
