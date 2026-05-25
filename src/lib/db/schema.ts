import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const toneEnum = pgEnum("tone", [
  "professional",
  "casual",
  "humorous",
  "inspirational",
]);

export const platformEnum = pgEnum("platform", [
  "twitter",
  "linkedin",
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "threads",
  "pinterest",
]);

// ─── Better Auth tables (managed by Better Auth) ─────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  activeOrganizationId: text("active_organization_id"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// ─── Better Auth organization plugin tables ───────────────────────────────────

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  logo: text("logo"),
  createdAt: timestamp("created_at").notNull(),
  metadata: text("metadata"),
});

export const member = pgTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

export const invitation = pgTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role"),
  status: text("status").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Application-owned tables ─────────────────────────────────────────────────

export const brandSettings = pgTable("brand_settings", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .unique()
    .references(() => organization.id, { onDelete: "cascade" }),
  brandVoice: text("brand_voice").notNull().default(""),
  defaultTone: toneEnum("default_tone").notNull().default("professional"),
  activePlatforms: text("active_platforms")
    .array()
    .notNull()
    .default([
      "twitter",
      "linkedin",
      "instagram",
      "facebook",
      "tiktok",
      "youtube",
      "threads",
      "pinterest",
    ]),
  modelId: text("model_id").notNull().default("google/gemini-2.5-flash"),
  updatedAt: timestamp("updated_at").notNull(),
});

export const generation = pgTable("generation", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  memberId: text("member_id")
    .notNull()
    .references(() => member.id, { onDelete: "cascade" }),
  topic: text("topic").notNull(),
  tone: toneEnum("tone").notNull(),
  intendedPublishAt: timestamp("intended_publish_at"),
  createdAt: timestamp("created_at").notNull(),
});

export const platformOutput = pgTable("platform_output", {
  id: text("id").primaryKey(),
  generationId: text("generation_id")
    .notNull()
    .references(() => generation.id, { onDelete: "cascade" }),
  platform: platformEnum("platform").notNull(),
  content: text("content").notNull(),
  editedContent: text("edited_content"),
  updatedAt: timestamp("updated_at").notNull(),
});

// ─── OTP tables ───────────────────────────────────────────────────────────────

export const otpPurposeEnum = pgEnum("otp_purpose", [
  "email_verification",
  "password_reset",
]);

export const emailOtp = pgTable("email_otp", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  purpose: otpPurposeEnum("purpose").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

// ─── Credit system tables ────────────────────────────────────────────────────

export const creditBatchType = pgEnum("credit_batch_type", [
  "starter",
  "top_up",
]);

export const creditTransactionType = pgEnum("credit_transaction_type", [
  "starter_grant",
  "top_up",
  "generation",
  "regeneration",
  "batch_expiry",
]);

export const creditBatch = pgTable("credit_batch", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  initialAmount: integer("initial_amount").notNull(),
  remaining: integer("remaining").notNull(),
  type: creditBatchType("type").notNull(),
  stripeSessionId: text("stripe_session_id"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

export const creditTransaction = pgTable("credit_transaction", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  type: creditTransactionType("type").notNull(),
  referenceId: text("reference_id"),
  memberId: text("member_id").references(() => member.id, { onDelete: "cascade" }),
  balanceBefore: integer("balance_before").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  createdAt: timestamp("created_at").notNull(),
});
