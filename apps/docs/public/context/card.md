# Card

**Category:** display  
**Description:** Container for grouping related content

## When to use

- Grouping related content into a visually distinct surface with border/shadow
- Creating scannable units in a grid or list (dashboard tiles, item summaries)
- Giving a content cluster elevation to separate it from the page background

## When NOT to use

- Pure semantic/structural grouping with no surface — use a <section>
- Wrapping every element in a card — nesting surfaces flattens visual hierarchy

## Anti-patterns

### Stacked surfaces and shadows compete for attention and muddy the hierarchy

**Bad:** `Nesting Cards several levels deep for layout`  
**Good:** `A single Card with internal spacing, or a plain <section>`  
**Why:** Stacked surfaces and shadows compete for attention and muddy the hierarchy

## Related components

- **Separator** (pairs-with): Use a Separator to divide regions inside a card

## Accessibility rationale

role="region" is appropriate only when the card is a meaningful landmark; otherwise treat it as presentational — the visual surface adds no semantics on its own

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `variant` | `'default' | 'outlined' | 'elevated'` | No | default | — |
| `padding` | `'none' | 'sm' | 'md' | 'lg'` | No | md | — |

## Tokens

- `--cascade-color-surface`
- `--cascade-color-border`
- `--cascade-radius-card`
- `--cascade-shadow-md`

## Examples

### Basic card

```jsx
<Card>
  <CardHeader><CardTitle>Title</CardTitle></CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| variant and padding | flexible | Choose elevation and density to fit the surrounding layout |
| token names | strict | Surface, border, radius, and shadow must resolve to --cascade-* tokens |
