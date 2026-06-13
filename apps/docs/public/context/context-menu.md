# ContextMenu

**Category:** overlay  
**Description:** Right-click context menu anchored at pointer coordinates via CSS custom properties

## When to use

- Offering actions contextual to an element via right-click (rename, delete, copy on a row or canvas item)
- Power-user surfaces where the desktop right-click affordance is expected

## When NOT to use

- Primary actions that must be discoverable by all users — right-click is hidden; use a visible Button or Dropdown
- Selecting a value or filtering a list — use Combobox/Select

## Anti-patterns

### Right-click is undiscoverable and unavailable on touch, so critical actions become unreachable for many users

**Bad:** `Putting the only path to an action behind a right-click ContextMenu`  
**Good:** `Also expose it via a visible Dropdown or Button; treat the context menu as a shortcut`  
**Why:** Right-click is undiscoverable and unavailable on touch, so critical actions become unreachable for many users

## Related components

- **Dropdown** (alternative): Use a button-triggered menu when actions must be visible and touch-accessible
- **Menu** (alternative): Use a general menu when the trigger is not a right-click gesture

## Accessibility rationale

The menu container is role="menu" and items are role="menuitem" with tabIndex management and aria-disabled, and it uses popover="auto" so it light-dismisses on Escape or outside click; the toggle event syncs that dismissal back into state so focus and open state stay consistent

## Tokens

- `--cascade-color-surface`
- `--cascade-color-border`
- `--cascade-radius-md`
- `--cascade-shadow-md`
- `--cascade-motion-enter`
- `--cascade-motion-exit`
- `--cascade-color-bg-subtle`

## Boundaries

| Area | Level | Note |
|------|-------|------|
| menu contents | flexible | Accepts arbitrary ContextMenuItem children after the trigger child |
| anchor position | strict | Anchored at pointer coordinates via --cascade-context-x/y custom properties set on right-click |
