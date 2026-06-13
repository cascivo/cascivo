# Separator

**Category:** display  
**Description:** Visual or semantic divider between content

## When to use

- Dividing groups of content within a section or menu
- Adding a vertical rule between inline items (orientation="vertical")
- Marking a meaningful thematic break (decorative=false)

## When NOT to use

- Adding spacing only — use margin/padding, not a separator
- Bordering a container — use the container border, not a separator

## Anti-patterns

### Separators imply a content division; using them for spacing misleads assistive tech

**Bad:** `Multiple separators stacked to create whitespace`  
**Good:** `Use spacing tokens for gaps; one separator for a real break`  
**Why:** Separators imply a content division; using them for spacing misleads assistive tech

## Related components

- **Card** (contained-by): Often used to divide regions inside a Card

## Accessibility rationale

role="separator" when meaningful so screen readers announce the division; setting decorative hides it from the accessibility tree when it is purely visual

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `orientation` | `'horizontal' | 'vertical'` | No | horizontal | — |
| `decorative` | `boolean` | No | false | When true, the separator is purely visual and hidden from assistive tech |

## Tokens

- `--cascade-color-border`

## Examples

### Horizontal

```jsx
<Separator />
```

### Vertical

```jsx
<Separator orientation="vertical" />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| decorative | flexible | Mark decorative when the break carries no meaning beyond visuals |
| token names | strict | Color must resolve to --cascade-color-border |
