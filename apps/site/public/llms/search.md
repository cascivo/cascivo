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

| Prop           | Type                      | Required | Default        | Description |
| -------------- | ------------------------- | -------- | -------------- | ----------- | ---- | --- |
| `value`        | `string`                  | no       | —              | —           |
| `defaultValue` | `string`                  | no       | `''`           | —           |
| `onChange`     | `(value: string) => void` | no       | —              | —           |
| `onSearch`     | `(value: string) => void` | no       | —              | —           |
| `debounceMs`   | `number`                  | no       | `300`          | —           |
| `placeholder`  | `string`                  | no       | `Search`       | —           |
| `size`         | `'sm'                     | 'md'     | 'lg'`          | no          | `md` | —   |
| `label`        | `string`                  | no       | `Search`       | —           |
| `disabled`     | `boolean`                 | no       | `false`        | —           |
| `clearLabel`   | `string`                  | no       | `Clear search` | —           |
| `id`           | `string`                  | no       | —              | —           |
| `className`    | `string`                  | no       | —              | —           |

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

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `searchbox`
- **Keyboard:** Enter

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

search, input, filter, form
