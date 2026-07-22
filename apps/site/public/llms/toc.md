# Toc

Table of contents with scroll-spy highlighting of the active section

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add toc
```

Or use it from the prebuilt package without copying:

```tsx
import { Toc } from '@cascivo/react'
```

## Category

`navigation`

## Props

| Prop             | Type                                              | Required | Default | Description                                                      |
| ---------------- | ------------------------------------------------- | -------- | ------- | ---------------------------------------------------------------- |
| `items`          | `{ id: string; label: string; level?: number }[]` | yes      | —       | The items to render.                                             |
| `activeId`       | `string`                                          | no       | —       | Controlled active item id; disables built-in scroll-spy when set |
| `onActiveChange` | `(id: string) => void`                            | no       | —       | Called with the id of the active section when it changes.        |
| `labels`         | `{ nav?: string }`                                | no       | —       | Overrides for the component’s user-visible strings (i18n).       |
| `className`      | `string`                                          | no       | —       | Additional CSS class names merged onto the root element.         |

## Examples

### Basic

```tsx
<Toc
  items={[
    { id: 'intro', label: 'Introduction' },
    { id: 'usage', label: 'Usage' },
    { id: 'api', label: 'API', level: 3 },
  ]}
/>
```

### Controlled active item

Pass activeId to drive the highlight yourself; scroll-spy is disabled.

```tsx
<Toc
  activeId="usage"
  items={[
    { id: 'intro', label: 'Introduction' },
    { id: 'usage', label: 'Usage' },
  ]}
/>
```

## Design tokens

- `--cascivo-font-sans`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-accent`
- `--cascivo-focus-ring`
- `--cascivo-target-min-coarse`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `navigation`
- **Keyboard:** Tab, Enter

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

toc, table-of-contents, navigation, scroll-spy, anchor

---

_Generated from registry v0.10.0 on 2026-07-22. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
