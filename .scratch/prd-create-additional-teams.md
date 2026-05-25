## Problem Statement

Users who already belong to a Team cannot create additional Teams from within the app. The only way to create a Team is during initial onboarding (when the user has zero Teams). Users who want separate Teams for different brands, clients, or projects must register entirely new accounts — a poor experience that discourages legitimate multi-team use cases.

## Solution

Allow any verified user to create additional Teams from two entry points: the `/teams` picker page and the sidebar team dropdown. Each new Team gets default Brand Settings and the creator becomes its Owner. Starter Credits (25 free credits) are only granted to the user's **first** Team to prevent abuse. Additional Teams start with zero credits and require a Credit Top-Up.

## User Stories

1. As a verified user, I want to see a "Create new team" button on the `/teams` picker page, so that I can create a new Team without leaving the app.
2. As a verified user, I want to see a "Create new team" option at the bottom of the sidebar team dropdown, so that I can create a new Team from anywhere inside the app.
3. As a verified user, I want to fill in a Team name on a dedicated `/create-team` page, so that my new Team is created with a properly generated slug.
4. As a verified user, after creating a new Team I want to be redirected to that Team's dashboard, so that I can immediately start using it.
5. As a verified user, after creating a new Team I want it to become my active Team, so that the sidebar and session reflect the new Team context.
6. As a verified user creating my first Team, I want to receive 25 Starter Credits, so that I can try the product for free.
7. As a verified user creating an additional Team (not my first), I do **not** want to receive Starter Credits, so that the system cannot be abused for unlimited free credits.
8. As a verified user creating an additional Team, I want to see the Team appear in my sidebar dropdown immediately, so that I can switch to it later.
9. As a verified user creating an additional Team, I want to see the Team appear on the `/teams` picker page immediately, so that I can navigate back to it.
10. As a user browsing the app, I want the `/create-team` URL to be reserved (not usable as a Team slug), so that there is no collision between the creation page and Team routes.
11. As an unauthenticated user, I want to be redirected to `/login` if I try to visit `/create-team`, so that only authenticated users can create Teams.
12. As a user with an unverified email, I want to be blocked from creating a Team, so that only verified users can create Teams.
13. As a Team Owner, when I create an additional Team I want to be set as the Owner of that new Team, so that I have full administrative control over it.
14. As a user creating a new Team, I want my new Team to have default Brand Settings (empty brand voice, professional tone, all platforms active, default AI model), so that it works out of the box.

## Implementation Decisions

### New page: `/create-team`

A dedicated page at `src/pages/create-team.tsx` that mirrors the existing onboarding page UI. It contains:
- A single form field for Team name
- Auto-generates a slug from the name using `generateSlug` and `sanitizeSlug`
- Calls `authClient.organization.create({ name, slug })` on submit
- Calls `authClient.organization.setActive({ organizationId })` after creation
- Redirects to `/{slug}` (the new Team's dashboard)
- Requires email verification via `useRequireVerifiedEmail`
- Requires authentication — `getServerSideProps` redirects to `/login` if no session

### Starter credit guard

A pure function extracted into the auth hook layer. Given a `userId`, it queries the `member` table to check whether the user already belongs to any organizations. Returns a boolean indicating whether starter credits should be granted.

The function is called inside the `afterCreateOrganization` hook in the auth configuration. The hook already receives `{ organization, member, user }` from Better Auth, so `user.id` is available to check existing memberships.

Logic: count memberships for `user.id` in the `member` table. If the count is exactly 1 (the membership just created by Better Auth), grant starter credits. If greater than 1, skip starter credits. The brand settings insertion always happens regardless — only the credit grant is conditional.

### Modify: `/teams` picker page

Add a "Create new team" card at the bottom of the Team list. Uses the same card styling as existing Team cards but with a "+" icon and distinct visual treatment. Links to `/create-team`.

### Modify: Sidebar team dropdown

Add a `DropdownMenuItem` at the bottom of the team list in the `DropdownMenuContent`, separated by a visual divider. Links to `/create-team`. Only shown when the user has at least one Team (the dropdown only renders when `teams.length > 1`; for single-team users the dropdown doesn't appear, but the sidebar entry point should still be accessible — this needs a small UX adjustment to show the dropdown when `teams.length >= 1` and include the create option).

### Modify: Slug denylist

Add `"create-team"` to `SLUG_DENYLIST` in `src/lib/slug.ts` so the slug cannot be claimed by a Team.

### Modify: Proxy

Add `"/create-team"` to `EXCLUDED_PREFIXES` in `src/proxy.ts` so the middleware does not attempt to resolve it as a Team slug. Also add `create-team` to the middleware matcher exclusion pattern.

### No schema changes

No database schema changes are required. The `organization`, `member`, `brandSettings`, `creditBatch`, and `creditTransaction` tables already support everything needed.

## Testing Decisions

### What makes a good test

Tests should verify external behavior, not implementation details. Pure functions with injected dependencies (database client) are tested by providing mock implementations and asserting on the outputs and the calls made to the mock.

### Modules to test

**Starter credit guard** — new pure function. Test cases:
- Returns `true` (grant credits) when the user has exactly 1 membership (their first Team)
- Returns `false` (skip credits) when the user has more than 1 membership (additional Team)
- Handles edge case of 0 memberships gracefully (should not happen in practice, but should not crash)

### Prior art

The testing pattern follows `src/lib/__tests__/credit-service.test.ts` — injectable database client dependency, mock the `select`/`insert` chain, assert on values written. The starter credit guard will follow the same `CreditServiceDeps` pattern for its database access.

## Out of Scope

- Team deletion or archival
- Limiting the total number of Teams per user (can be added later if needed)
- Customizable slug input during creation (auto-generated from Team name)
- Brand Settings configuration during creation (configured after on the Settings page)
- Inviting Members during Team creation (done after on the Members page)
- Payment method requirement for additional Teams
- UI for managing/switching between many Teams beyond the current dropdown

## Further Notes

- The sidebar currently only shows the team dropdown when `teams.length > 1`. When a user has exactly 1 Team, the sidebar shows a plain text label. Adding a "Create new team" option to the sidebar for single-team users requires either: (a) always showing the dropdown when the user has at least 1 Team, with the create option appended, or (b) adding a separate small "+" button next to the plain text label. Option (a) is recommended for consistency.
- The `afterCreateOrganization` hook runs for **all** org creations — both onboarding and the new create-team flow. The conditional credit logic must not break the existing onboarding path.
- The `/create-team` page should use the same visual design language as the `/onboarding` page (centered card, gradient background, Lotus wordmark) for consistency.
