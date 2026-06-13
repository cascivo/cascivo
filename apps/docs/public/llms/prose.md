# Prose

Wrapper that styles raw descendant HTML — headings, lists, code, quotes, tables

## Install

```bash
npx cascade add prose
```

## Category

`display`

## Props

_No props._

## Examples

### Authored content

```tsx
<Prose>
  <h2>Install</h2>
  <p>
    Run <code>npx cascade init</code>.
  </p>
</Prose>
```

### Rendered markdown

The use case: HTML you do not control (CMS, markdown pipelines)

```tsx
<Prose dangerouslySetInnerHTML={{ __html: html }} />
```

## Design tokens

- `--cascivo-font-sans`
- `--cascivo-font-mono`
- `--cascivo-font-semibold`
- `--cascivo-leading-tight`
- `--cascivo-leading-relaxed`
- `--cascivo-tracking-tight`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-accent`
- `--cascivo-color-accent-hover`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-radius-indicator`
- `--cascivo-radius-surface`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascivo/core`

## Tags

typography, prose, content, markdown, article
