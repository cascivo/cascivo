# Blockquote

**Category:** display  
**Description:** Quoted passage with optional attribution footer

## When to use

- Setting off a quoted passage from another source with visual emphasis
- Attributing a quote to a person or work via the cite footer

## When NOT to use

- Indenting or emphasizing your own non-quoted text — use Text styling
- Inline quotations within a sentence — use a <q> element

## Anti-patterns

### blockquote semantics tell assistive tech the content is a quotation; misusing it misleads readers

**Bad:** `Using <Blockquote> purely to indent a callout`  
**Good:** `A Card or styled Text block for non-quote emphasis`  
**Why:** blockquote semantics tell assistive tech the content is a quotation; misusing it misleads readers

## Related components

- **Prose** (pairs-with): Prose styles blockquotes among other long-form elements automatically

## Accessibility rationale

Renders a native <blockquote> with the attribution in <footer><cite>, so the quotation and its source are semantically distinct to assistive tech

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `cite` | `string` | No | undefined | — |

## Tokens

- `--cascade-color-border-strong`
- `--cascade-color-text`
- `--cascade-color-text-subtle`
- `--cascade-font-sans`
- `--cascade-font-medium`
- `--cascade-leading-relaxed`
- `--cascade-text-sm`
- `--cascade-text-base`

## Examples

### Default

```jsx
<Blockquote>Less, but better.</Blockquote>
```

### With attribution

Attribution renders as <footer><cite>

```jsx
<Blockquote cite="Dieter Rams">Less, but better.</Blockquote>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| attribution | flexible | cite is optional; omit when the source is given in surrounding context |
| token names | strict | Border and text colors must resolve to --cascade-* tokens |
