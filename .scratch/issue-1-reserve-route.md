## Parent

#80

## What to build

Reserve the URL path `/create-team` so it cannot collide with a Team slug. This is a prerequisite for the create-team page.

Add `"create-team"` to the `SLUG_DENYLIST` set so the slug generator rejects it. Add `"/create-team"` to the `EXCLUDED_PREFIXES` array in the proxy so the middleware does not attempt to resolve it as a team slug. Add `create-team` to the middleware matcher source exclusion regex pattern so Next.js does not run the proxy middleware on this route.

Also update the slug denylist test to verify the new entry exists and that the denylist size assertion is updated accordingly.

## Acceptance criteria

- [ ] `create-team` is in the `SLUG_DENYLIST` set
- [ ] `/create-team` is in the `EXCLUDED_PREFIXES` array in the proxy
- [ ] `create-team` is excluded in the middleware matcher source pattern
- [ ] Slug denylist test passes with updated denylist size
- [ ] Proxy tests pass (if any reference the exclusion list)

## Blocked by

None - can start immediately
