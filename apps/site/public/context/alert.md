# Alert

**Category:** display  
**Description:** Highlights a short, important message inline

## When to use

- Surfacing a persistent, contextual message inline within a view (warning, error, info, success)
- Communicating status that should stay visible until read or resolved
- Offering an inline recovery action tied to the message (action prop)

## When NOT to use

- Transient confirmation that should auto-dismiss — use Toast
- Blocking the user for a decision — use Modal or AlertDialog

## Anti-patterns

### Alerts persist by design; auto-hiding important inline context risks the user missing it

**Bad:** `Auto-dismissing an Alert on a timer to mimic a notification`  
**Good:** `<Toast> for ephemeral feedback`  
**Why:** Alerts persist by design; auto-hiding important inline context risks the user missing it

## Related components

- **Toast** (alternative): Toast auto-dismisses and floats; Alert persists inline in the layout
- **AlertDialog** (alternative): Use AlertDialog when the message must block and demand a choice

## Accessibility rationale

role="alert" makes assistive tech announce the message when it appears; the dismiss control is a real button so it is reachable and labeled, and color is paired with an icon/title so meaning is not conveyed by hue alone

## Props

| Name          | Type                                                             | Required | Default | Description                                          |
| ------------- | ---------------------------------------------------------------- | -------- | ------- | ---------------------------------------------------- |
| `variant`     | `'default' \| 'info' \| 'success' \| 'warning' \| 'destructive'` | No       | default | Selects the visual style variant.                    |
| `title`       | `string`                                                         | No       | —       | Title text for the component.                        |
| `icon`        | `ReactNode`                                                      | No       | —       | Icon element rendered in the component.              |
| `dismissible` | `boolean`                                                        | No       | false   | When true, shows a control to dismiss the component. |
| `onDismiss`   | `() => void`                                                     | No       | —       | Called when the component is dismissed.              |
| `action`      | `{ label: string; onClick: () => void }`                         | No       | —       | Primary action shown in the component.               |

## Tokens

- `--cascivo-color-info`
- `--cascivo-color-success`
- `--cascivo-color-warning`
- `--cascivo-color-destructive`
- `--cascivo-color-border`
- `--cascivo-radius-md`

## Examples

### Info

```jsx
<Alert variant="info" title="Heads up">
  Your trial ends soon.
</Alert>
```

### Dismissible

```jsx
<Alert variant="success" dismissible title="Saved">
  Changes saved.
</Alert>
```

### Actionable

```jsx
<Alert variant="warning" title="Update available" action={{ label: 'Update now', onClick: update }}>
  A new version is ready.
</Alert>
```

## Boundaries

| Area        | Level    | Note                                                                             |
| ----------- | -------- | -------------------------------------------------------------------------------- |
| variant     | flexible | Choose the severity variant that matches the message; default is neutral         |
| token names | strict   | Severity colors must resolve to --cascivo-color-info/success/warning/destructive |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Alert component (display). Highlights a short, important message inline

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Alert is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-info, --cascivo-color-success, --cascivo-color-warning, --cascivo-color-destructive, --cascivo-color-border, --cascivo-radius-md

Accessibility: role "alert", WCAG 2.2-AA. Keep it AA.

Do not change (strict): token names — Severity colors must resolve to --cascivo-color-info/success/warning/destructive
Flexible: variant.

Do not invent props, tokens, or global viewport media queries.
```
