# Swap

**Category:** inputs  
**Description:** Animated toggle between two icon/content states with rotate or flip transition

## When to use

- Theme toggles where an icon animates between two states (sun/moon)
- Favorite or bookmark toggles that flip between outlined and filled icons
- Any scenario where exactly two icons swap places with a transition

## When NOT to use

- Form toggles with a visible label — use Toggle
- Checkbox-style inputs that are part of a submitted form — use Checkbox
- When a text label must always be visible alongside the control

## Anti-patterns

### Swap is designed for icon transitions; for labeled on/off controls use Toggle

**Bad:** `<Swap on="Enable" off="Disable" /> (text content)`  
**Good:** `<Toggle label="Enable notifications" />`  
**Why:** Swap is designed for icon transitions; for labeled on/off controls use Toggle

## Related components

- **Toggle** (alternative): Use when a visible text label is required alongside the switch control
- **Checkbox** (alternative): Use for form selections that are submitted rather than applied immediately

## Accessibility rationale

Renders a <button role="switch"> with aria-checked reflecting state. Both on/off slots are aria-hidden so screen readers announce the button state, not the icon content.

## Props

| Name         | Type                         | Required | Default | Description                                              |
| ------------ | ---------------------------- | -------- | ------- | -------------------------------------------------------- |
| `on`         | `React.ReactNode`            | Yes      | —       | Content shown in the active (on) state.                  |
| `off`        | `React.ReactNode`            | Yes      | —       | Content shown in the inactive (off) state.               |
| `checked`    | `boolean`                    | No       | false   | Whether the control is checked (controlled).             |
| `onChange`   | `(checked: boolean) => void` | No       | —       | Called when the value changes.                           |
| `mode`       | `'rotate' \| 'flip'`         | No       | rotate  | Transition between states ('rotate' \| 'flip').          |
| `aria-label` | `string`                     | No       | —       | Accessible label used when no visible label is present.  |
| `className`  | `string`                     | No       | —       | Additional CSS class names merged onto the root element. |

## Tokens

- `--cascivo-ring-width`
- `--cascivo-ring-color`
- `--cascivo-radius-control`
- `--cascivo-ease-out`

## Examples

### Theme toggle (rotate)

Sun/moon icon that rotates between two states

```jsx
<Swap on={<SunIcon />} off={<MoonIcon />} mode="rotate" aria-label="Toggle theme" />
```

### Flip mode

Heart icon that flips to filled on activation

```jsx
<Swap on={<HeartFilledIcon />} off={<HeartIcon />} mode="flip" aria-label="Favorite" />
```

## Boundaries

| Area           | Level    | Note                                                                        |
| -------------- | -------- | --------------------------------------------------------------------------- |
| content        | flexible | on/off slots accept any ReactNode — icons, text, images                     |
| animation mode | flexible | rotate (default) or flip — choose based on the visual metaphor of the icons |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Swap component (inputs). Animated toggle between two icon/content states with rotate or flip transition

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Swap is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-ring-width, --cascivo-ring-color, --cascivo-radius-control, --cascivo-ease-out

Accessibility: role "switch", WCAG 2.2-AA, keyboard: Space/Enter. Keep it AA.
Flexible: content, animation mode.

Do not invent props, tokens, or global viewport media queries.
```
