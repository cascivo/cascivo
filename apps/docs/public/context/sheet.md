# Sheet

**Category:** overlay  
**Description:** Slide-in panel from any edge, using popover=manual and @starting-style animations

## When to use

- Showing secondary content or a form in a panel that slides in from a screen edge
- Navigation, filters, or detail views that benefit from full-height side space without leaving the page
- Mobile-friendly drawers where a centered modal would feel cramped

## When NOT to use

- A short confirmation or focused decision — use Modal or AlertDialog
- Small contextual content anchored to a trigger — use Popover

## Anti-patterns

### A full edge-to-edge panel is overkill for a yes/no decision; AlertDialog is the right scale and semantics

**Bad:** `<Sheet title="Delete item?">Are you sure?</Sheet>`  
**Good:** `<AlertDialog title="Delete item?" />`  
**Why:** A full edge-to-edge panel is overkill for a yes/no decision; AlertDialog is the right scale and semantics

## Related components

- **Modal** (alternative): Use for centered, focused dialogs rather than edge panels
- **Popover** (alternative): Use for small content anchored to a trigger element

## Accessibility rationale

Uses popover="manual" with role="dialog" and aria-modal so it is announced as a modal surface; the title labels it via aria-label and Escape/Tab handling comes from the popover platform behavior.

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-lg`
- `--cascivo-shadow-xl`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`

## Boundaries

| Area | Level | Note |
|------|-------|------|
| side | strict | Limited to start | end | top | bottom — drives the slide direction and animation |
| body content | flexible | Any children; consumer owns the panel contents |
