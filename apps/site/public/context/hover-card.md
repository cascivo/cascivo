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

## Props

| Name         | Type              | Required | Default | Description                                                 |
| ------------ | ----------------- | -------- | ------- | ----------------------------------------------------------- |
| `children`   | `React.ReactNode` | Yes      | —       | A HoverCardTrigger and HoverCardContent pair.               |
| `openDelay`  | `number`          | No       | 300     | Delay (ms) before the card opens on hover/focus.            |
| `closeDelay` | `number`          | No       | 100     | Delay (ms) before the card closes after hover/focus leaves. |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-md`
- `--cascivo-shadow-md`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`

## Examples

### Profile preview

```jsx
<HoverCard>
  <HoverCardTrigger>
    <a href="/users/ada">@ada</a>
  </HoverCardTrigger>
  <HoverCardContent>
    <Avatar name="Ada Lovelace" />
    <p>Wrote the first program.</p>
  </HoverCardContent>
</HoverCard>
```

### Custom delays

```jsx
<HoverCard openDelay={500} closeDelay={200}>
  <HoverCardTrigger>Definition</HoverCardTrigger>
  <HoverCardContent>A longer explanation shown on hover or focus.</HoverCardContent>
</HoverCard>
```

## Boundaries

| Area             | Level    | Note                                                                                       |
| ---------------- | -------- | ------------------------------------------------------------------------------------------ |
| token names      | strict   | Surface, border, radius, shadow, and motion must resolve to the listed --cascivo-\* tokens |
| open/close delay | flexible | openDelay and closeDelay are tunable per instance (defaults 300/100ms)                     |
| content          | flexible | HoverCardContent accepts arbitrary children                                                |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo HoverCard component (overlay). Hover-triggered popover with configurable open/close delay

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

HoverCard is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-border, --cascivo-radius-md, --cascivo-shadow-md, --cascivo-motion-enter, --cascivo-motion-exit

Accessibility: role "complementary", WCAG 2.2-AA, keyboard: Tab/Escape. Keep it AA.

Do not change (strict): token names — Surface, border, radius, shadow, and motion must resolve to the listed --cascivo-* tokens
Flexible: open/close delay, content.

Do not invent props, tokens, or global viewport media queries.
```
