# Sources

Collapsible, numbered list of the sources an AI answer drew on — "Used 3 sources" — whose numbers match InlineCitation

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add sources
```

Or use it from the prebuilt package without copying:

```tsx
import { Sources } from '@cascivo/react'
```

## Category

`display`

## Props

| Prop     | Type                   | Required | Default | Description                                                                                                                                                                         |
| -------- | ---------------------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `items`  | `AiSource[]`           | yes      | —       | The sources, in citation order. Each has `title`, `url` and an optional `description`. Only absolute http(s) URLs become links; anything else (e.g. `javascript:`) renders as text. |
| `labels` | `{ summary?: string }` | no       | —       | Overrides for the component’s user-visible strings (i18n). `summary` may contain `{count}`.                                                                                         |

## Object types

### `AiSource`

One source an answer cites.

| Field         | Type        | Required | Description                                                                  |
| ------------- | ----------- | -------- | ---------------------------------------------------------------------------- |
| `title`       | `string`    | yes      | The source’s title.                                                          |
| `url`         | `string`    | yes      | Where it lives. Treated as untrusted: only absolute http(s) URLs are linked. |
| `description` | `ReactNode` | no       | An excerpt or note shown under the title.                                    |

## Examples

### Answer sources

```tsx
<Sources
  items={[
    { title: 'Refund policy', url: 'https://example.com/refunds' },
    {
      title: 'Terms of service',
      url: 'https://example.com/terms',
      description: '§4 covers cancellations.',
    },
  ]}
/>
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Design tokens

- `--cascivo-link-color`
- `--cascivo-color-accent-text`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `button`
- **Keyboard:** Enter, Space

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

ai, sources, citations, references, provenance, links

---

_Generated from registry v1.9.0 on 2026-10-09. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
