# Drawer

**Category:** overlay  
**Description:** Edge-anchored dialog panel that slides in from a screen edge with CSS-only enter/exit motion

## When to use

- A side or edge panel for navigation, filters, or detail views that needs full-height space
- A modal surface that slides in and locks the page behind it while open
- A controllable open/close panel where the parent owns the state via open/onOpenChange

## When NOT to use

- A short yes/no confirmation — use AlertDialog
- Small content anchored to a trigger element — use Popover
- A gesture-driven, swipe-to-dismiss sheet — use Sheet

## Anti-patterns

### A full edge panel with focus trap and scroll lock is overkill for a yes/no decision

**Bad:** `<Drawer title="Delete item?">Are you sure?</Drawer>`  
**Good:** `<AlertDialog title="Delete item?" />`  
**Why:** A full edge panel with focus trap and scroll lock is overkill for a yes/no decision

## Related components

- **Sheet** (alternative): Use Sheet when swipe/gesture dismissal is wanted; Drawer is a plain dialog panel
- **Modal** (alternative): Use a centered modal rather than an edge panel for focused decisions

## Accessibility rationale

Renders role="dialog" with aria-modal; the title labels it via aria-labelledby and the description via aria-describedby. FocusScope traps Tab focus and restores it on close; DismissableLayer handles Escape and outside-pointer dismissal.

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-overlay`
- `--cascivo-shadow-overlay`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`

## Boundaries

| Area | Level | Note |
|------|-------|------|
| side | strict | Limited to start | end | top | bottom — drives the slide direction and animation |
| open state | flexible | Controlled (open/onOpenChange) or uncontrolled (defaultOpen) |
| body content | flexible | Any children; the consumer owns the panel contents |
