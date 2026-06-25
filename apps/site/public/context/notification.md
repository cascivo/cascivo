# Notification

**Category:** feedback  
**Description:** Inline, actionable notification banner that surfaces a titled message with an optional recovery action

## When to use

- Surfacing a prominent, often actionable message in the page flow (sync result, failed upload, available update)
- Pairing a status message with one or more recovery actions via the actions slot
- Communicating outcomes that should persist until the user reads or acts on them

## When NOT to use

- Transient, auto-dismissing feedback that floats above the layout — use Toast
- A terse single-line action status next to a control — use InlineLoading
- Blocking the user for a required decision — use Modal or AlertDialog

## Anti-patterns

### Notification is an in-flow banner; faking toast behavior duplicates Toast and breaks layout expectations

**Bad:** `Stacking Notifications in a fixed corner viewport on a timer to fake toasts`  
**Good:** `<Toast> for ephemeral, floating, auto-dismissing feedback`  
**Why:** Notification is an in-flow banner; faking toast behavior duplicates Toast and breaks layout expectations

## Related components

- **Toast** (alternative): Toast floats and auto-dismisses; Notification stays inline in the document flow
- **Alert** (alternative): Alert is a lighter inline message; Notification leans into a leading variant icon and an actions slot

## Accessibility rationale

role="alert" for warning and error so assistive tech announces them assertively, role="status" for info and success; the variant icon is decorative (aria-hidden) and color is always paired with the icon and title, and the dismiss control is a labeled button

## Props

| Name          | Type                   | Required  | Default   | Description |
| ------------- | ---------------------- | --------- | --------- | ----------- | --- | ---- | --- |
| `title`       | `ReactNode`            | Yes       | —         | —           |
| `description` | `ReactNode`            | No        | —         | —           |
| `variant`     | `'info'                | 'success' | 'warning' | 'error'`    | No  | info | —   |
| `dismissible` | `boolean`              | No        | false     | —           |
| `onDismiss`   | `() => void`           | No        | —         | —           |
| `actions`     | `ReactNode`            | No        | —         | —           |
| `icon`        | `ReactNode`            | No        | —         | —           |
| `labels`      | `{ dismiss?: string }` | No        | —         | —           |

## Tokens

- `--cascivo-color-info`
- `--cascivo-color-success`
- `--cascivo-color-warning`
- `--cascivo-color-destructive`
- `--cascivo-color-border`
- `--cascivo-color-surface`
- `--cascivo-radius-surface`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`

## Examples

### Info

```jsx
<Notification variant="info" title="Sync complete" description="Your files are up to date." />
```

### Dismissible

```jsx
<Notification variant="success" title="Saved" dismissible onDismiss={handleDismiss} />
```

### Actionable

```jsx
<Notification
  variant="error"
  title="Upload failed"
  description="The connection dropped."
  actions={<Button onClick={retry}>Retry</Button>}
/>
```

## Boundaries

| Area         | Level    | Note                                                                           |
| ------------ | -------- | ------------------------------------------------------------------------------ |
| icon         | flexible | A variant-appropriate icon is supplied by default; override with the icon prop |
| actions      | flexible | Any ReactNode (typically Buttons) can fill the actions slot                    |
| role mapping | strict   | warning/error must use role="alert"; info/success use role="status"            |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Notification component (feedback). Inline, actionable notification banner that surfaces a titled message with an optional recovery action

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Notification is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-info, --cascivo-color-success, --cascivo-color-warning, --cascivo-color-destructive, --cascivo-color-border, --cascivo-color-surface, --cascivo-radius-surface, --cascivo-motion-enter, --cascivo-motion-exit

Accessibility: role "alert", WCAG 2.2-AA. Keep it AA.

Do not change (strict): role mapping — warning/error must use role="alert"; info/success use role="status"
Flexible: icon, actions.

Do not invent props, tokens, or global viewport media queries.
```
