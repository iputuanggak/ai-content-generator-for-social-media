## Parent

#80

## What to build

Add a "Create new team" entry point in the sidebar team dropdown so users can create a new Team from anywhere inside the app.

Two changes to the sidebar:

1. **Show dropdown for single-team users**: Currently the team dropdown only renders when `teams.length > 1`. Single-team users see a plain text label with no way to create additional teams. Change the condition to show the dropdown when `teams.length >= 1` so single-team users get a dropdown containing their one team plus the create option.

2. **Add create option**: Add a `DropdownMenuSeparator` followed by a `DropdownMenuItem` with a "+" icon and "Create new team" label at the bottom of the team list in `DropdownMenuContent`. This item navigates to `/create-team`. It should be visually distinct from team names (different styling or icon).

For users with zero teams, the sidebar still shows "No team" — no change needed there.

## Acceptance criteria

- [ ] A "Create new team" option appears at the bottom of the sidebar team dropdown, separated by a divider
- [ ] Clicking the option navigates to `/create-team`
- [ ] The dropdown now appears when user has exactly 1 team (previously only appeared for 2+)
- [ ] The option is visually distinct from team name items
- [ ] Users with zero teams still see the "No team" label (no regression)

## Blocked by

- #83
