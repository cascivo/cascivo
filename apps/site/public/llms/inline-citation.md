# InlineCitation

A numbered citation marker inside AI-generated text that links to its source and previews it in a hover card

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add inline-citation
```

Or use it from the prebuilt package without copying:

```tsx
import { InlineCitation } from '@cascivo/react'
```

## Category

`display`

## Props

| Prop     | Type                  | Required | Default | Description                                                                                                                            |
| -------- | --------------------- | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `index`  | `number`              | yes      | —       | The visible citation number — the source’s position in the matching Sources list.                                                      |
| `source` | `AiSource`            | yes      | —       | The cited source (`title`, `url`, optional `description`). Only absolute http(s) URLs become links.                                    |
| `labels` | `{ source?: string }` | no       | —       | Overrides for the component’s user-visible strings (i18n). `source` may contain `{index}`; the accessible name is "<source>: <title>". |

## Object types

### `AiSource`

One source an answer cites (shared with Sources).

| Field         | Type        | Required | Description                                                  |
| ------------- | ----------- | -------- | ------------------------------------------------------------ |
| `title`       | `string`    | yes      | The source’s title.                                          |
| `url`         | `string`    | yes      | Treated as untrusted: only absolute http(s) URLs are linked. |
| `description` | `ReactNode` | no       | An excerpt shown in the hover card.                          |

## Examples

### In a sentence

```tsx
<p>
  Refunds are available for 30 days.
  <InlineCitation
    index={1}
    source={{ title: 'Refund policy', url: 'https://example.com/refunds' }}
  />
</p>
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Design tokens

- `--cascivo-color-ai-subtle`
- `--cascivo-color-ai-sheen`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-radius-full`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `link`
- **Keyboard:** Tab, Enter

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

ai, citation, sources, footnote, references, provenance

---

_Generated from registry v1.7.0 on 2026-10-06. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
