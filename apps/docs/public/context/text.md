# Text

**Category:** display  
**Description:** Body text with size, weight, and muted variants

## When to use

- Rendering body copy, paragraphs, and inline text in app UI
- Applying size/weight/muted treatment to secondary or emphasized text
- Inline emphasis inside flow content (as="span")

## When NOT to use

- Section or page titles — use Heading for the document outline
- Long-form authored/markdown content — use Prose

## Anti-patterns

### Visually-large Text has no heading semantics, so it is missing from the document outline

**Bad:** `<Text size="lg" weight="semibold"> used as a page title`  
**Good:** `<Heading level={1}>`  
**Why:** Visually-large Text has no heading semantics, so it is missing from the document outline

## Related components

- **Heading** (alternative): Heading carries outline semantics; Text is plain body copy

## Accessibility rationale

Renders the chosen native element (p/span/div) without imposing roles; muted styling keeps contrast within AA so secondary text stays readable

## Props

| Name     | Type      | Required | Default     | Description |
| -------- | --------- | -------- | ----------- | ----------- | ------ | --- |
| `as`     | `'p'      | 'span'   | 'div'`      | No          | p      | —   |
| `size`   | `'sm'     | 'md'     | 'lg'`       | No          | md     | —   |
| `weight` | `'normal' | 'medium' | 'semibold'` | No          | normal | —   |
| `muted`  | `boolean` | No       | false       | —           |

## Tokens

- `--cascivo-font-sans`
- `--cascivo-font-normal`
- `--cascivo-font-medium`
- `--cascivo-font-semibold`
- `--cascivo-leading-normal`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-text-sm`
- `--cascivo-text-base`
- `--cascivo-text-lg`

## Examples

### Default

```jsx
<Text>Body copy reads at the base size.</Text>
```

### Muted helper

```jsx
<Text size="sm" muted>
  Secondary information
</Text>
```

### Inline span

Use as="span" inside other flow content

```jsx
<Text as="span" weight="semibold">
  emphasis
</Text>
```

## Boundaries

| Area               | Level    | Note                                                         |
| ------------------ | -------- | ------------------------------------------------------------ |
| as / size / weight | flexible | Choose element and treatment to fit context                  |
| token names        | strict   | Font, leading, and color must resolve to --cascivo-\* tokens |
