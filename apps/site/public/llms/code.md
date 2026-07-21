# Code

Inline code span for identifiers, commands, and short snippets

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add code
```

Or use it from the prebuilt package without copying:

```tsx
import { Code } from '@cascivo/react'
```

## Category

`display`

## Sizes

- `sm`
- `md`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `size` | `'sm' \| 'md'` | no | `md` | Visual size of the component (e.g. 'sm', 'md', 'lg'). |

## Examples

### Default

```tsx
<Code>npx cascivo add button</Code>
```

### In a sentence

Sits inline with surrounding text

```tsx
<Text>Run <Code>vp check</Code> before committing.</Text>
```

### Small

```tsx
<Code size="sm">--cascivo-color-accent</Code>
```

## Design tokens

- `--cascivo-font-mono`
- `--cascivo-color-text`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-indicator`
- `--cascivo-text-xs`
- `--cascivo-text-sm`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `code`

## Dependencies

- `@cascivo/core`

## Tags

typography, code, inline, mono

---

_Generated from registry v0.8.0 on 2026-07-21. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
