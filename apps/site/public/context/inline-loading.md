# InlineLoading

**Category:** feedback  
**Description:** Compact inline status indicator that pairs a label with a loading, success, or error state

## When to use

- Showing the progress of a single inline action — a Save button that becomes "Saving… / Saved / Failed"
- Communicating async status next to a control without occupying its own block or modal
- Reflecting a terminal success or error state that should be announced to assistive tech

## When NOT to use

- Page- or section-level loading where layout space is reserved — use Skeleton or Spinner
- Persistent, multi-line messages with recovery actions — use Alert or Notification
- Determinate progress with a known percentage — use a progress bar

## Anti-patterns

### A single status keeps the icon, color, and announced label in sync and prevents mismatched states

**Bad:** `<Spinner /> with separate manually-managed success and error markup`  
**Good:** `<InlineLoading status={status} /> driving icon and color from one status prop`  
**Why:** A single status keeps the icon, color, and announced label in sync and prevents mismatched states

## Related components

- **Spinner** (contains): InlineLoading renders a Spinner for its active state and adds finished/error icons plus a label
- **Alert** (alternative): Use Alert for persistent messages that need a title, body, and actions rather than a terse status

## Accessibility rationale

role="status" with aria-live="polite" announces the label when the status changes; the icon is decorative (aria-hidden) so meaning is carried by the text and color is never the sole signal

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `status` | `'inactive' \| 'active' \| 'finished' \| 'error'` | Yes | — | Status state. |
| `label` | `ReactNode` | No | — | Text label for the control. |
| `labels` | `{ active?: string; finished?: string; error?: string }` | No | — | Overrides for the component’s user-visible strings (i18n). |

## Tokens

- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-success`
- `--cascivo-color-destructive`
- `--cascivo-motion-enter`

## Examples

### Active

```jsx
<InlineLoading status="active" />
```

### Finished

```jsx
<InlineLoading status="finished" label="Saved" />
```

### Error

```jsx
<InlineLoading status="error" label="Save failed" />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| label | flexible | Defaults come from the i18n catalog per status; override with label or the per-status labels map |
| status semantics | strict | active must show a spinner, finished a success icon, error an error icon — do not repurpose |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo InlineLoading component (feedback). Compact inline status indicator that pairs a label with a loading, success, or error state

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

InlineLoading is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-text, --cascivo-color-text-muted, --cascivo-color-success, --cascivo-color-destructive, --cascivo-motion-enter

Accessibility: role "status", WCAG 2.2-AA. Keep it AA.

Do not change (strict): status semantics — active must show a spinner, finished a success icon, error an error icon — do not repurpose
Flexible: label.

Do not invent props, tokens, or global viewport media queries.
```
