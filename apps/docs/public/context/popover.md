# Popover

**Category:** overlay  
**Description:** Anchored floating panel built on CSS Anchor Positioning + Popover API

## When to use

- Showing rich, interactive content anchored to a trigger that the user must explicitly open by clicking
- Lightweight transient panels (forms, pickers, detail cards) that do not need to block the rest of the page

## When NOT to use

- A short, non-interactive text hint on hover/focus — use Tooltip
- A task that must capture focus and block interaction with the page — use Modal
- Preview content revealed on hover without a click — use HoverCard

## Anti-patterns

### Tooltips are non-interactive and hover-driven; interactive content needs a click-opened dialog popover that users can move focus into

**Bad:** `<Tooltip content={<form>...</form>}>`  
**Good:** `<Popover><PopoverTrigger>…</PopoverTrigger><PopoverContent><form>…</form></PopoverContent></Popover>`  
**Why:** Tooltips are non-interactive and hover-driven; interactive content needs a click-opened dialog popover that users can move focus into

## Related components

- **Tooltip** (alternative): Use for brief non-interactive hints, not interactive content
- **HoverCard** (alternative): Use when the panel should open on hover rather than click
- **Modal** (alternative): Use when the overlay must be blocking and focus-trapping

## Accessibility rationale

The trigger is a real <button> with aria-haspopup="dialog" and aria-expanded reflecting open state, and the panel uses role="dialog" via the native Popover API so Escape-to-close and light-dismiss come from the platform rather than custom handlers.

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-md`
- `--cascivo-shadow-md`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`

## Boundaries

| Area        | Level    | Note                                                                      |
| ----------- | -------- | ------------------------------------------------------------------------- |
| token names | strict   | Panel styling must resolve to the listed --cascivo-\* tokens              |
| content     | flexible | Trigger and panel content are arbitrary children supplied by the consumer |
