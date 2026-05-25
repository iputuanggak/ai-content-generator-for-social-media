## Parent

#80

## What to build

Add a "Create new team" entry point on the `/teams` picker page so users can navigate to the create-team flow.

Add a card at the bottom of the existing team list. Use the same card styling as the existing Team cards (rounded border, hover effects) but with a "+" icon and "Create new team" label. The card links to `/create-team`.

The card should always be visible when the teams page renders (user is always authenticated on this page). Place it after the last team card in the list.

## Acceptance criteria

- [ ] A "Create new team" card appears at the bottom of the team list on `/teams`
- [ ] Card uses consistent styling with existing team cards
- [ ] Card links to `/create-team`
- [ ] Card is visible for all authenticated users on the teams page

## Blocked by

- #83
