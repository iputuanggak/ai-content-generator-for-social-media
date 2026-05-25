## Parent

#80

## What to build

Create a new standalone page at `/create-team` that allows authenticated, email-verified users to create additional Teams. The page mirrors the existing `/onboarding` page UI (centered card, gradient background, Lotus wordmark) but is accessible from within the app.

The page contains a single form with a Team name input. On submit, it auto-generates a slug from the name using `generateSlug` and `sanitizeSlug`, creates the organization via `authClient.organization.create({ name, slug })`, sets the new org as active via `authClient.organization.setActive({ organizationId })`, and redirects to `/{slug}` (the new Team's dashboard).

Server-side: `getServerSideProps` checks for a valid session. If no session exists, redirects to `/login`. If session exists, renders the page.

Client-side: uses `useRequireVerifiedEmail` to block unverified users. Shows loading/error states. Displays validation errors from the API (e.g., duplicate slug).

The page does NOT handle starter credits — that is managed by the `afterCreateOrganization` hook in auth config (covered by a separate issue).

## Acceptance criteria

- [ ] `/create-team` page renders with team name form for authenticated users
- [ ] Unauthenticated users are redirected to `/login`
- [ ] Unverified-email users are blocked by `useRequireVerifiedEmail`
- [ ] Submitting the form creates a new organization via `authClient.organization.create`
- [ ] Slug is auto-generated from the team name
- [ ] After creation, the new org is set as active
- [ ] After creation, user is redirected to `/{slug}` dashboard
- [ ] API errors (e.g., duplicate slug) are displayed to the user
- [ ] Visual design matches the onboarding page style

## Blocked by

- #81
