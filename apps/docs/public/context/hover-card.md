# HoverCard

**Category:** overlay  
**Description:** Hover-triggered popover with configurable open/close delay

## When to use

- Showing a rich preview (avatar, summary, links) when a user hovers or focuses a trigger
- Supplementary, non-essential context the user can ignore without losing functionality
- Cases needing an open/close delay so brief mouse passes do not flicker the card

## When NOT to use

- Short plain-text hints — use Tooltip
- Content the user must interact with or that should trap focus — use Popover or Modal
- Touch-primary flows where there is no hover — prefer a tap-triggered Popover

## Anti-patterns

### Hover surfaces are transient and unreachable by touch and many keyboard paths, so essential controls get lost

**Bad:** `Putting required actions (buttons users must click) inside HoverCardContent`  
**Good:** `Use a Popover triggered by click so the surface is reliably reachable`  
**Why:** Hover surfaces are transient and unreachable by touch and many keyboard paths, so essential controls get lost

## Related components

- **Tooltip** (alternative): Use Tooltip for brief text labels rather than rich preview content
- **Popover** (alternative): Use Popover for click-triggered, interactive, focus-managed content

## Accessibility rationale

The trigger opens on both mouseenter and focus (and closes on mouseleave/blur) so keyboard users get the same preview, and the content is marked role="complementary" to signal it is supplementary rather than a required dialog; the open/close delays prevent accidental flicker.

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-md`
- `--cascivo-shadow-md`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`

## Boundaries

| Area             | Level    | Note                                                                                       |
| ---------------- | -------- | ------------------------------------------------------------------------------------------ |
| token names      | strict   | Surface, border, radius, shadow, and motion must resolve to the listed --cascivo-\* tokens |
| open/close delay | flexible | openDelay and closeDelay are tunable per instance (defaults 300/100ms)                     |
| content          | flexible | HoverCardContent accepts arbitrary children                                                |
