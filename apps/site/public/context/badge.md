# Badge

**Category:** display  
**Description:** Small status label or category indicator

## When to use

- Labeling an item with a short, static status or category (e.g. "New", "Beta")
- Annotating an element with a count or state that is not interactive

## When NOT to use

- A removable or interactive chip (filters, selections) — use Tag
- A standalone system state with a colored dot — use Status

## Anti-patterns

### Badge is a non-interactive label; interactive/removable labels belong to Tag with proper button semantics

**Bad:** `<Badge onClick={removeFilter}>Active</Badge>`  
**Good:** `<Tag onDismiss={removeFilter}>Active</Tag>`  
**Why:** Badge is a non-interactive label; interactive/removable labels belong to Tag with proper button semantics

## Related components

- **Tag** (alternative): Tag is the interactive, dismissible counterpart
- **Status** (alternative): Status pairs a colored dot with a label for live system state

## Accessibility rationale

role="status" lets assistive tech expose the label as state; meaning is reinforced by text, never by color alone

## Props

| Name      | Type       | Required    | Default   | Description |
| --------- | ---------- | ----------- | --------- | ----------- | ----------------------------------------------------- | ---------- | --- | ------- | --------------------------------- |
| `variant` | `'default' | 'secondary' | 'success' | 'warning'   | 'destructive'                                         | 'outline'` | No  | default | Selects the visual style variant. |
| `size`    | `'sm'      | 'md'`       | No        | md          | Visual size of the component (e.g. 'sm', 'md', 'lg'). |

## Tokens

- `--cascivo-font-sans`
- `--cascivo-font-medium`
- `--cascivo-radius-badge`
- `--cascivo-space-1`
- `--cascivo-space-2`
- `--cascivo-space-3`
- `--cascivo-text-xs`
- `--cascivo-leading-normal`
- `--cascivo-color-accent`
- `--cascivo-color-text-on-accent`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-text`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-color-success-subtle`
- `--cascivo-color-success-foreground`
- `--cascivo-color-warning-subtle`
- `--cascivo-color-warning-foreground`
- `--cascivo-color-destructive-subtle`
- `--cascivo-color-destructive-foreground`
- `--cascivo-color-primary`
- `--cascivo-color-primary-content`
- `--cascivo-color-info`
- `--cascivo-color-info-content`
- `--cascivo-color-error`
- `--cascivo-color-error-content`

## Examples

### Default

```jsx
<Badge>New</Badge>
```

### Success

```jsx
<Badge variant="success">Active</Badge>
```

### Destructive

```jsx
<Badge variant="destructive">Deprecated</Badge>
```

## Boundaries

| Area        | Level    | Note                                                                           |
| ----------- | -------- | ------------------------------------------------------------------------------ |
| variant     | flexible | Choose the variant that matches the semantic meaning                           |
| token names | strict   | Colors and radius must resolve to --cascivo-\* tokens (--cascivo-radius-badge) |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Badge component (display). Small status label or category indicator

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Badge is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-font-sans, --cascivo-font-medium, --cascivo-radius-badge, --cascivo-space-1, --cascivo-space-2, --cascivo-space-3, --cascivo-text-xs, --cascivo-leading-normal, --cascivo-color-accent, --cascivo-color-text-on-accent, --cascivo-color-bg-subtle, --cascivo-color-text, --cascivo-color-border, --cascivo-color-border-strong, --cascivo-color-success-subtle, --cascivo-color-success-foreground, --cascivo-color-warning-subtle, --cascivo-color-warning-foreground, --cascivo-color-destructive-subtle, --cascivo-color-destructive-foreground, --cascivo-color-primary, --cascivo-color-primary-content, --cascivo-color-info, --cascivo-color-info-content, --cascivo-color-error, --cascivo-color-error-content

Accessibility: role "status", WCAG 2.2-AA. Keep it AA.

Do not change (strict): token names — Colors and radius must resolve to --cascivo-* tokens (--cascivo-radius-badge)
Flexible: variant.

Do not invent props, tokens, or global viewport media queries.
```
