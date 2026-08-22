# Steps

**Category:** navigation  
**Description:** Visual progress indicator for multi-step flows with horizontal and vertical orientations

## When to use

- Checkout flows where the user moves through a fixed sequence of screens
- Onboarding wizards with a known number of steps
- Multi-step forms where showing overall progress reduces abandonment

## When NOT to use

- General section navigation — use Tabs instead
- Simple back/next controls without step labels — use Pagination instead
- More than 7 steps where the connector lines become unreadable on mobile

## Anti-patterns

### Steps imply a linear sequence and derive complete/pending state from position

**Bad:** `Using Steps as a replacement for Tabs for non-sequential navigation`  
**Good:** `<Tabs> for switching between independent views`  
**Why:** Steps imply a linear sequence and derive complete/pending state from position

## Related components

- **Pagination** (alternative): Pagination is for paged data sets, Steps is for guided task sequences
- **Tabs** (alternative): Tabs are for non-sequential section switching, not ordered task flows

## Accessibility rationale

Rendered as an ordered list (<ol>) with aria-label; the active item carries aria-current="step" to communicate progress to screen readers

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | `string` | No | — | Alias of `ariaLabel` — the same invisible accessible name under the other spelling. Neither is deprecated. Not rendered — screen readers only. |
| `ariaLabel` | `string` | No | — | Accessible label for the steps navigation; defaults to the built-in i18n string. Not rendered — screen readers only. |
| `items` | `Step[]` | No | — | Alias of `steps` — the catalog-wide name for a config-driven collection. Exactly one of the two is required. |
| `steps` | `Step[]` | No | — | Array of step objects with label and optional explicit state |
| `activeStep` | `number` | No | 0 | Index of the currently active step (0-based) |
| `orientation` | `'horizontal' \| 'vertical'` | No | 'horizontal' | Axis the steps flow along: `horizontal` runs them across with connectors between, `vertical` stacks them down the page. |
| `className` | `string` | No | — | Additional CSS class names merged onto the root element. |

## Object types

### `Step`

Shape of an entry in `steps` / `items`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | `string` | Yes | Visible step label. |
| `id` | `string` | No | Stable identity, used as the React key so reordering keeps DOM nodes. |
| `state` | `StepState \| ProgressInput` | No | Step status. `StepState` ('pending' \| 'active' \| 'complete' \| 'error') is canonical; `ProgressInput` also accepts Timeline's `current` / `upcoming` aliases. |

## Tokens

- `--cascivo-color-accent`
- `--cascivo-color-accent-content`
- `--cascivo-color-success`
- `--cascivo-color-success-content`
- `--cascivo-color-error`
- `--cascivo-color-error-content`
- `--cascivo-color-surface`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-text-muted`
- `--cascivo-border-default`
- `--cascivo-radius-full`
- `--cascivo-ease-out`

## Examples

### Horizontal (default)

Standard checkout or onboarding progress tracker

```jsx
<Steps
  steps={[
    { label: 'Cart' },
    { label: 'Shipping' },
    { label: 'Payment' },
    { label: 'Confirm' },
  ]}
  activeStep={1}
/>
```

### Vertical

Sidebar-style progress for tall forms

```jsx
<Steps
  orientation="vertical"
  steps={[
    { label: 'Account info' },
    { label: 'Profile details' },
    { label: 'Preferences' },
  ]}
  activeStep={0}
/>
```

### With explicit error state

Override derived state on a specific step

```jsx
<Steps
  steps={[
    { label: 'Upload' },
    { label: 'Validate', state: 'error' },
    { label: 'Process' },
  ]}
  activeStep={1}
/>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| step state | flexible | Each step can override derived pending/active/complete state via step.state |
| orientation | flexible | Horizontal for top progress bars, vertical for sidebar wizards |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Steps component (navigation). Visual progress indicator for multi-step flows with horizontal and vertical orientations

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Steps is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-accent, --cascivo-color-accent-content, --cascivo-color-success, --cascivo-color-success-content, --cascivo-color-error, --cascivo-color-error-content, --cascivo-color-surface, --cascivo-color-text, --cascivo-color-text-subtle, --cascivo-color-text-muted, --cascivo-border-default, --cascivo-radius-full, --cascivo-ease-out

Accessibility: role "list", WCAG 2.2-AA. Keep it AA.
Flexible: step state, orientation.

Do not invent props, tokens, or global viewport media queries.
```
