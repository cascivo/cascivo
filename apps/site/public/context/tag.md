# Tag

**Category:** display  
**Description:** Compact chip for labeling, categorizing, or filtering content

## When to use

- Labeling, categorizing, or filtering content with a compact chip
- Representing a removable selection or active filter (onDismiss)
- Showing a set of keywords or attributes on an item

## When NOT to use

- A static, non-interactive status label — use Badge
- A live system state with a dot — use Status

## Anti-patterns

### Tag provides accessible dismiss semantics; bolting interactivity onto Badge skips that

**Bad:** `Using Badge with a custom close button to make it removable`  
**Good:** `<Tag onDismiss={remove}> which renders a proper labeled remove button`  
**Why:** Tag provides accessible dismiss semantics; bolting interactivity onto Badge skips that

## Related components

- **Badge** (alternative): Badge is the static, non-interactive counterpart
- **TagsInput** (contained-by): TagsInput renders Tags for each entered value

## Accessibility rationale

When dismissible, the remove control is a real button with a label (dismissLabel) so keyboard users can remove it via Enter/Space; color variants are reinforced by text, not hue alone

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `variant` | `'default' \| 'info' \| 'success' \| 'warning' \| 'error'` | No | default | Selects the visual style variant. |
| `size` | `'sm' \| 'md'` | No | md | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `onDismiss` | `() => void` | No | — | When provided, renders a trailing remove button inside the chip |
| `dismissLabel` | `string` | No | Remove | Accessible label for the dismiss button. |

## Tokens

- `--cascivo-color-bg-subtle`
- `--cascivo-color-text-subtle`
- `--cascivo-color-info`
- `--cascivo-color-info-subtle`
- `--cascivo-color-success`
- `--cascivo-color-success-subtle`
- `--cascivo-color-warning`
- `--cascivo-color-warning-subtle`
- `--cascivo-color-destructive`
- `--cascivo-color-destructive-subtle`
- `--cascivo-radius-badge`
- `--cascivo-focus-ring`

## Examples

### Default

```jsx
<Tag>Design</Tag>
```

### Success

```jsx
<Tag variant="success">Approved</Tag>
```

### Dismissible

Renders a trailing remove button labeled by dismissLabel

```jsx
<Tag onDismiss={() => removeFilter()}>Filter: Active</Tag>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| variant and dismissibility | flexible | onDismiss is optional; variant matches semantic meaning |
| token names | strict | Variant colors must resolve to --cascivo-color-*-subtle tokens |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Tag component (display). Compact chip for labeling, categorizing, or filtering content

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Tag is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-bg-subtle, --cascivo-color-text-subtle, --cascivo-color-info, --cascivo-color-info-subtle, --cascivo-color-success, --cascivo-color-success-subtle, --cascivo-color-warning, --cascivo-color-warning-subtle, --cascivo-color-destructive, --cascivo-color-destructive-subtle, --cascivo-radius-badge, --cascivo-focus-ring

Accessibility: role "none", WCAG 2.2-AA, keyboard: Enter/Space. Keep it AA.

Do not change (strict): token names — Variant colors must resolve to --cascivo-color-*-subtle tokens
Flexible: variant and dismissibility.

Do not invent props, tokens, or global viewport media queries.
```
