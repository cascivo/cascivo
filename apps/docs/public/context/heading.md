# Heading

**Category:** display  
**Description:** Section heading with semantic level decoupled from visual size

## When to use

- Titling a page or section as part of the document outline
- Keeping the semantic heading level correct while choosing the visual size independently

## When NOT to use

- Emphasizing inline or body text — use Text with a weight
- Long-form rendered content — let Prose style its own headings

## Anti-patterns

### Skipping heading levels breaks the document outline screen-reader users rely on to navigate

**Bad:** `<Heading level={4} size="2xl"> chosen only to look big, skipping h2/h3`  
**Good:** `Keep levels sequential; use size to control scale within the correct level`  
**Why:** Skipping heading levels breaks the document outline screen-reader users rely on to navigate

## Related components

- **Text** (alternative): Text is for body copy; Heading is for outline structure
- **Prose** (alternative): Prose styles headings inside authored long-form content

## Accessibility rationale

Renders a real <h1>–<h6> from the level prop so the heading appears in the accessibility tree at the correct level; visual size is decoupled so styling never forces an incorrect level

## Props

| Name    | Type  | Required | Default | Description |
| ------- | ----- | -------- | ------- | ----------- | ------ | --- | -------------------------------------------------------- | --- | --- |
| `level` | `1    | 2        | 3       | 4           | 5      | 6`  | No                                                       | 2   | —   |
| `size`  | `'sm' | 'md'     | 'lg'    | 'xl'        | '2xl'` | No  | derived from level (1→2xl, 2→xl, 3→lg, 4→md, 5→sm, 6→sm) | —   |

## Tokens

- `--cascivo-font-display`
- `--cascivo-font-semibold`
- `--cascivo-leading-tight`
- `--cascivo-tracking-tight`
- `--cascivo-color-text`
- `--cascivo-text-base`
- `--cascivo-text-lg`
- `--cascivo-text-xl`
- `--cascivo-text-2xl`
- `--cascivo-text-3xl`

## Examples

### Default

```jsx
<Heading>Section title</Heading>
```

### Page title

```jsx
<Heading level={1}>Page title</Heading>
```

### Decoupled size

Keep the document outline correct while controlling the visual scale

```jsx
<Heading level={2} size="2xl">
  Visually large, semantically h2
</Heading>
```

## Boundaries

| Area           | Level    | Note                                                         |
| -------------- | -------- | ------------------------------------------------------------ |
| size           | flexible | size may override the level-derived default for visual scale |
| level sequence | strict   | Levels must not skip — maintain a valid heading hierarchy    |
