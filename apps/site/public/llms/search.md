# Search

Search input with debounced search callback and clear button

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add search
```

Or use it from the prebuilt package without copying:

```tsx
import { Search } from '@cascivo/react'
```

## Category

`inputs`

## Sizes

- `sm`
- `md`
- `lg`

## States

- `empty`
- `filled`

## Props

| Prop            | Type                      | Required | Default        | Description                                                                                                                                                                                                                                                                       |
| --------------- | ------------------------- | -------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`         | `string`                  | no       | —              | The controlled value.                                                                                                                                                                                                                                                             |
| `defaultValue`  | `string`                  | no       | `''`           | The initial value when uncontrolled.                                                                                                                                                                                                                                              |
| `onValueChange` | `(value: string) => void` | no       | —              | Called with the current text on every keystroke.                                                                                                                                                                                                                                  |
| `onChange`      | `(value: string) => void` | no       | —              | Deprecated: use onValueChange (same string).                                                                                                                                                                                                                                      |
| `onSearch`      | `(value: string) => void` | no       | —              | Called with the query, debounced, as the user types.                                                                                                                                                                                                                              |
| `debounceMs`    | `number`                  | no       | `300`          | Debounce delay (ms) before onSearch fires.                                                                                                                                                                                                                                        |
| `placeholder`   | `string`                  | no       | `Search`       | Placeholder text shown when the field is empty.                                                                                                                                                                                                                                   |
| `size`          | `'sm' \| 'md' \| 'lg'`    | no       | `md`           | Visual size of the component (e.g. 'sm', 'md', 'lg').                                                                                                                                                                                                                             |
| `label`         | `string`                  | no       | `Search`       | Accessible name for the control. Rendered as a real `<label>` that is **visually hidden** by design — it changes the accessible name, not the visible UI. If you can see it, the component stylesheet did not load (import `@cascivo/react/styles.css` or the per-component CSS). |
| `disabled`      | `boolean`                 | no       | `false`        | When true, disables the control and removes it from the tab order.                                                                                                                                                                                                                |
| `clearLabel`    | `string`                  | no       | `Clear search` | Accessible label for the clear button.                                                                                                                                                                                                                                            |
| `id`            | `string`                  | no       | —              | Id for the input, wired to the label. Auto-generated with useId when omitted — SSR-safe and stable across hydration.                                                                                                                                                              |
| `className`     | `string`                  | no       | —              | Additional CSS class names merged onto the root element.                                                                                                                                                                                                                          |

## Examples

### Basic

```tsx
<Search onSearch={(q) => runQuery(q)} />
```

### Controlled

```tsx
<Search value={query} onChange={setQuery} onSearch={runQuery} debounceMs={500} />
```

### Large

```tsx
<Search size="lg" placeholder="Search products…" />
```

## Client JavaScript

Enhancement only. The server-rendered HTML is correct and no content is unreachable with JavaScript disabled; client JS adds interaction on top.

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-color-accent`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-input`
- `--cascivo-focus-ring`
- `--cascivo-search-width`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `searchbox`
- **Keyboard:** Enter

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

search, input, filter, form

---

_Generated from registry v0.14.0 on 2026-07-31. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
