## Parent

#80

## What to build

Prevent Starter Credits abuse by only granting the 25 free credits to a user's first Team. Additional Teams created by the same user receive zero credits.

Extract a pure function (starter credit guard) that checks whether a user already belongs to other organizations. Given a `userId`, it counts memberships in the `member` table. If the count is exactly 1 (the membership just created by Better Auth for this new org), return `true` (grant credits). If greater than 1, return `false` (skip credits).

Modify the `afterCreateOrganization` hook in the auth configuration to call this guard. The hook receives `{ organization, member, user }` from Better Auth — use `user.id` to check existing memberships. The brand settings insertion always happens regardless. Only the `grantStarterCredits` call is made conditional on the guard's result.

The guard function should follow the existing `CreditServiceDeps` dependency injection pattern for testability (injectable database client).

## Acceptance criteria

- [ ] Pure guard function exists that takes a `userId` and optional `CreditServiceDeps`, returns a boolean
- [ ] Returns `true` when user has exactly 1 membership (first Team — grant credits)
- [ ] Returns `false` when user has more than 1 membership (additional Team — skip credits)
- [ ] Handles 0 memberships gracefully without crashing
- [ ] `afterCreateOrganization` hook conditionally calls `grantStarterCredits` based on the guard
- [ ] Brand settings are always inserted regardless of credit decision
- [ ] Existing onboarding flow (first Team) still grants Starter Credits
- [ ] Unit tests follow the `credit-service.test.ts` mock db pattern

## Blocked by

None - can start immediately
