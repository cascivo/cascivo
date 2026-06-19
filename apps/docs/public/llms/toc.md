# Toc

Table of contents with scroll-spy highlighting of the active section

## Install

```bash
npx cascivo add toc
```

## Category

`navigation`

## Props

| Prop             | Type                                              | Required | Default | Description                                                      |
| ---------------- | ------------------------------------------------- | -------- | ------- | ---------------------------------------------------------------- |
| `items`          | `{ id: string; label: string; level?: number }[]` | yes      | —       | —                                                                |
| `activeId`       | `string`                                          | no       | —       | Controlled active item id; disables built-in scroll-spy when set |
| `onActiveChange` | `(id: string) => void`                            | no       | —       | —                                                                |
| `labels`         | `{ nav?: string }`                                | no       | —       | —                                                                |
| `className`      | `string`                                          | no       | —       | —                                                                |

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
