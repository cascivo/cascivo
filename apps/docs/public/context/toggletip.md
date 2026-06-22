# Toggletip

**Category:** overlay  
**Description:** A click-triggered info popover for supplementary, selectable content

## When to use

- Revealing brief supplementary information on demand when the user clicks an info affordance
- Content that must be selectable or contain a link, where a hover Tooltip would be unreachable
- Touch-friendly hint surfaces where hover is unavailable

## When NOT to use

- A passive label that should appear on hover/focus without a click — use Tooltip
- A blocking, focus-trapping dialog for a task — use Modal
- Rich forms or pickers anchored to a trigger — use Popover
- A list of one-shot actions behind a button — use MenuButton

## Anti-patterns

### Hover tooltips disappear on pointer-out and are not keyboard- or touch-reachable for interaction, so interactive or copyable content needs a click-toggled bubble

**Bad:** `Using a hover Tooltip to hold a link or text the user needs to read or copy`  
**Good:** `Use a Toggletip so the content stays open on click and remains reachable and selectable`  
**Why:** Hover tooltips disappear on pointer-out and are not keyboard- or touch-reachable for interaction, so interactive or copyable content needs a click-toggled bubble

### An icon-only button with no accessible name cannot be operated by screen-reader or voice users

**Bad:** `Giving the trigger an icon with no text and no labels.label override`  
**Good:** `Provide labels.label or rely on the built-in i18n accessible name`  
**Why:** An icon-only button with no accessible name cannot be operated by screen-reader or voice users

## Related components

- **Tooltip** (alternative): Use Tooltip for non-interactive hints shown on hover/focus rather than click
- **Popover** (alternative): Use Popover for richer interactive content like forms or pickers
- **MenuButton** (alternative): Use MenuButton when the trigger should reveal a list of actions

## Accessibility rationale

The trigger is a real <button> with aria-expanded reflecting open state and aria-controls pointing at the bubble; an icon-only trigger gets an accessible name from labels.label or the built-in i18n catalog. The bubble is role="status" so its content is announced when it opens, and unlike a hover tooltip the content remains visible and reachable for selection and links. DismissableLayer provides Escape and outside-pointer dismissal, and high-contrast and reduced-motion preferences are honored in CSS.

## Props

| Name           | Type                      | Required | Default | Description                                                   |
| -------------- | ------------------------- | -------- | ------- | ------------------------------------------------------------- | ----------- | --------- | -------------- | ------------- | --- | ----- | -------------------------------------------------------- |
| `trigger`      | `ReactNode`               | Yes      | —       | Trigger content, rendered inside a button (e.g. an info icon) |
| `children`     | `ReactNode`               | Yes      | —       | The popover content — interactive and selectable              |
| `placement`    | `'top'                    | 'bottom' | 'left'  | 'right'                                                       | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'` | No  | 'top' | Side and alignment of the bubble relative to the trigger |
| `defaultOpen`  | `boolean`                 | No       | false   | Initial open state when uncontrolled                          |
| `open`         | `boolean`                 | No       | —       | Controlled open state                                         |
| `onOpenChange` | `(open: boolean) => void` | No       | —       | Called whenever the open state should change                  |
| `labels`       | `{ label?: string }`      | No       | —       | Override the trigger accessible name                          |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-text`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-control`
- `--cascivo-radius-overlay`
- `--cascivo-shadow-md`
- `--cascivo-focus-ring`
- `--cascivo-motion-enter`
- `--cascivo-z-tooltip`

## Examples

### Info toggletip

An info button that reveals supplementary text on click

```jsx
<Toggletip trigger={<InfoIcon />}>Your password must contain at least 12 characters.</Toggletip>
```

### Controlled

Drive the open state from the parent

```jsx
<Toggletip trigger={<InfoIcon />} open={open} onOpenChange={setOpen} placement="bottom-start">
  <a href="/docs">Learn more</a>
</Toggletip>
```

## Boundaries

| Area                 | Level    | Note                                                                         |
| -------------------- | -------- | ---------------------------------------------------------------------------- |
| token names          | strict   | Trigger and bubble styling must resolve to the listed --cascivo-\* tokens    |
| content              | flexible | trigger and children accept arbitrary ReactNode supplied by the consumer     |
| open state ownership | flexible | Use uncontrolled (defaultOpen) or controlled (open + onOpenChange) as needed |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Toggletip component (overlay). A click-triggered info popover for supplementary, selectable content

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Toggletip is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-border, --cascivo-color-text, --cascivo-color-bg-subtle, --cascivo-radius-control, --cascivo-radius-overlay, --cascivo-shadow-md, --cascivo-focus-ring, --cascivo-motion-enter, --cascivo-z-tooltip

Accessibility: role "status", WCAG 2.2-AA, keyboard: Enter/Space/Escape. Keep it AA.

Do not change (strict): token names — Trigger and bubble styling must resolve to the listed --cascivo-* tokens
Flexible: content, open state ownership.

Do not invent props, tokens, or global viewport media queries.
```
