# Prose

Wrapper that styles raw descendant HTML — headings, lists, code, quotes, tables

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add prose
```

Or use it from the prebuilt package without copying:

```tsx
import { Prose } from '@cascivo/react'
```

## Category

`display`

## Props

| Prop                      | Type                 | Required | Default | Description                                                                 |
| ------------------------- | -------------------- | -------- | ------- | --------------------------------------------------------------------------- |
| `children`                | `React.ReactNode`    | no       | —       | Authored flow content (headings, paragraphs, lists, code, tables) to style. |
| `dangerouslySetInnerHTML` | `{ __html: string }` | no       | —       | Rendered HTML you do not control (CMS, markdown pipelines). Sanitize first. |
| `className`               | `string`             | no       | —       | Additional CSS class names merged onto the root element.                    |

## Examples

### Authored content

```tsx
<Prose>
  <h2>Install</h2>
  <p>
    Run <code>npx cascivo init</code>.
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

---

_Generated from registry v0.10.0 on 2026-07-22. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
