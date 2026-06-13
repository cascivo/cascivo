# EmptyState

**Category:** display  
**Description:** Placeholder for views that have no data to display

## When to use

- Filling a view that has no data with guidance and a primary next step
- Explaining why a list/table is empty (no results, nothing created yet)
- Offering an action that resolves the empty condition (action prop)

## When NOT to use

- Content is still loading — use Skeleton or Spinner
- An error occurred — use Alert to explain the failure

## Anti-patterns

### Conflating loading with empty tells the user there is no data when there may be

**Bad:** `Showing an EmptyState while data is still fetching`  
**Good:** `A Skeleton during load, then EmptyState only if the result is empty`  
**Why:** Conflating loading with empty tells the user there is no data when there may be

## Related components

- **Skeleton** (alternative): Skeleton covers the loading phase before data resolves
- **Alert** (alternative): Use Alert for error states rather than a generic empty state

## Accessibility rationale

Presentational by role; the title carries the meaning as text and the action is a real focusable control, so keyboard and screen-reader users can act on the next step

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `icon` | `ReactNode` | No | — | — |
| `title` | `string` | Yes | — | — |
| `description` | `string` | No | — | — |
| `action` | `ReactNode` | No | — | — |
| `size` | `'md' | 'lg'` | No | md | — |

## Tokens

- `--cascade-color-text`
- `--cascade-color-text-subtle`
- `--cascade-color-text-muted`
- `--cascade-color-bg-subtle`
- `--cascade-radius-full`

## Examples

### Basic

```jsx
<EmptyState title="No results" description="Try adjusting your filters." />
```

### With action

```jsx
<EmptyState icon="📄" title="No documents yet" description="Create your first document to get started." action={<Button>New document</Button>} />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| size and action | flexible | Action and icon are optional; size scales for full-page vs in-panel use |
| token names | strict | Text and background colors must resolve to --cascade-* tokens |
