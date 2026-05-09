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
