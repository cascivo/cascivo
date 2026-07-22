# SwipeItem

**Category:** display  
**Description:** List row whose leading/trailing actions are revealed by a horizontal swipe, with keyboard parity

## When to use

- List rows on touch surfaces where secondary actions (archive, delete) should hide until swiped
- Mail/inbox-style rows that reveal contextual actions behind the content
- Compact lists where always-visible action buttons would crowd each row

## When NOT to use

- A single primary action per row — render it inline as a Button
- Destructive actions that need confirmation — pair with an AlertDialog instead of swipe-only
- Non-list, free-form content — swipe-to-reveal is a list-row affordance

## Anti-patterns

### Gesture-only actions are unreachable by keyboard and screen-reader users

**Bad:** `Relying on the swipe gesture as the only way to reach Delete`  
**Good:** `Action buttons stay in the DOM and a11y tree; focusing one reveals its side`  
**Why:** Gesture-only actions are unreachable by keyboard and screen-reader users

## Related components

- **ActionSheet** (alternative): Use an ActionSheet when a row tap should present a fuller list of actions
- **List** (contained-by): SwipeItem wraps individual rows within a list

## Accessibility rationale

The action buttons are always rendered in the DOM and the accessibility tree, never gesture-only. Focusing an action (via keyboard) reveals its side so it is visible, Enter/Space activate it, and Escape closes the row — giving full keyboard and screen-reader parity with the swipe gesture. The drag uses touch-action: pan-y so vertical scrolling is unaffected.

## Props

| Name              | Type              | Required | Default | Description                                                                |
| ----------------- | ----------------- | -------- | ------- | -------------------------------------------------------------------------- |
| `children`        | `React.ReactNode` | Yes      | —       | The row content                                                            |
| `leadingActions`  | `SwipeAction[]`   | No       | —       | Actions revealed by dragging toward the end edge (shown on the start edge) |
| `trailingActions` | `SwipeAction[]`   | No       | —       | Actions revealed by dragging toward the start edge (shown on the end edge) |
| `className`       | `string`          | No       | —       | Additional CSS class names merged onto the root element.                   |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-accent`
- `--cascivo-color-accent-content`
- `--cascivo-color-destructive`
- `--cascivo-color-text-on-destructive`
- `--cascivo-target-min-coarse`
- `--cascivo-motion-enter`

## Examples

### Trailing actions

```jsx
<SwipeItem
  trailingActions={[
    { label: 'Archive', onSelect: archive },
    { label: 'Delete', onSelect: remove, destructive: true },
  ]}
>
  <MessageRow message={message} />
</SwipeItem>
```

### Leading and trailing

```jsx
<SwipeItem
  leadingActions={[{ label: 'Pin', icon: <PinIcon />, onSelect: pin }]}
  trailingActions={[{ label: 'Delete', onSelect: remove, destructive: true }]}
>
  <TaskRow task={task} />
</SwipeItem>
```

## Boundaries

| Area             | Level    | Note                                                                             |
| ---------------- | -------- | -------------------------------------------------------------------------------- |
| actions          | flexible | Any number of leading and/or trailing actions; each may be destructive           |
| reveal direction | strict   | Leading reveals on the start edge, trailing on the end edge (physical-axis drag) |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo SwipeItem component (display). List row whose leading/trailing actions are revealed by a horizontal swipe, with keyboard parity

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

SwipeItem is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-accent, --cascivo-color-accent-content, --cascivo-color-destructive, --cascivo-color-text-on-destructive, --cascivo-target-min-coarse, --cascivo-motion-enter

Accessibility: role "group", WCAG 2.2-AA, keyboard: Tab/Enter/Space/Escape. Keep it AA.

Do not change (strict): reveal direction — Leading reveals on the start edge, trailing on the end edge (physical-axis drag)
Flexible: actions.

Do not invent props, tokens, or global viewport media queries.
```
