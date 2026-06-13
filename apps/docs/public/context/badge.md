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

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `variant` | `'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'` | No | default | — |
| `size` | `'sm' | 'md'` | No | md | — |

## Tokens

- `--cascade-color-accent`
- `--cascade-color-success`
- `--cascade-color-warning`
- `--cascade-color-destructive`
- `--cascade-radius-badge`

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

| Area | Level | Note |
|------|-------|------|
| variant | flexible | Choose the variant that matches the semantic meaning |
| token names | strict | Colors and radius must resolve to --cascade-* tokens (--cascade-radius-badge) |
