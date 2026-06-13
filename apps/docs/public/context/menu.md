# Menu

**Category:** overlay  
**Description:** Dropdown menu with keyboard navigation, built on usePopover

## When to use

- Presenting a list of actions or commands triggered from a button
- Action lists that need arrow-key navigation and Enter/Space activation
- Grouping related commands with separators behind a single trigger

## When NOT to use

- Selecting a persistent value from options — use Select or MultiSelect
- Right-click contextual actions on an element — use ContextMenu
- A single non-list action — use a Button

## Anti-patterns

### Menu items use role="menuitem" and close on activation — they are not selectable options and do not model a chosen value

**Bad:** `Using Menu items to pick a form value and showing the choice as selected`  
**Good:** `Use Select for value selection; Menu items are one-shot actions`  
**Why:** Menu items use role="menuitem" and close on activation — they are not selectable options and do not model a chosen value

## Related components

- **ContextMenu** (alternative): Use ContextMenu for right-click activation on a target element
- **Select** (alternative): Use Select when the user is choosing a value rather than firing an action
- **Button** (pairs-with): A button (MenuTrigger) opens the menu

## Accessibility rationale

The trigger exposes aria-haspopup="menu" and aria-expanded, the panel is role="menu" with role="menuitem" children, focus moves to the first enabled item on open, ArrowUp/ArrowDown rove focus between items, disabled items are aria-disabled and removed from the tab order, and separators use role="separator".

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
| token names | strict | Surface, border, radius, shadow, and motion must resolve to the listed --cascade-* tokens |
| item content | flexible | MenuItem accepts arbitrary children; onSelect defines the action |
| composition | flexible | MenuItem and MenuSeparator can be mixed freely under the trigger |
