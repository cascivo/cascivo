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
<Prose><h2>Install</h2><p>Run <code>npx cascade init</code>.</p></Prose>
```

### Rendered markdown

The use case: HTML you do not control (CMS, markdown pipelines)

```tsx
<Prose dangerouslySetInnerHTML={{ __html: html }} />
```

## Design tokens

- `--cascade-font-sans`
- `--cascade-font-mono`
- `--cascade-font-semibold`
- `--cascade-leading-tight`
- `--cascade-leading-relaxed`
- `--cascade-tracking-tight`
- `--cascade-color-text`
- `--cascade-color-text-subtle`
- `--cascade-color-accent`
- `--cascade-color-accent-hover`
- `--cascade-color-surface`
- `--cascade-color-border`
- `--cascade-color-border-strong`
- `--cascade-radius-indicator`
- `--cascade-radius-surface`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascade-ui/core`

## Tags

typography, prose, content, markdown, article
