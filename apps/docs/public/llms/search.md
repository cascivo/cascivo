# Search

Search input with debounced search callback and clear button

## Install

```bash
npx cascade add search
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

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `string` | no | — | — |
| `defaultValue` | `string` | no | `''` | — |
| `onChange` | `(value: string) => void` | no | — | — |
| `onSearch` | `(value: string) => void` | no | — | — |
| `debounceMs` | `number` | no | `300` | — |
| `placeholder` | `string` | no | `Search` | — |
| `size` | `'sm' | 'md' | 'lg'` | no | `md` | — |
| `label` | `string` | no | `Search` | — |
| `disabled` | `boolean` | no | `false` | — |
| `clearLabel` | `string` | no | `Clear search` | — |
| `id` | `string` | no | — | — |
| `className` | `string` | no | — | — |

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

- `--cascade-color-surface`
- `--cascade-color-border`
- `--cascade-color-border-strong`
- `--cascade-color-accent`
- `--cascade-color-text`
- `--cascade-color-text-muted`
- `--cascade-color-bg-subtle`
- `--cascade-radius-input`
- `--cascade-focus-ring`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `searchbox`
- **Keyboard:** Enter

## Dependencies

- `@cascade-ui/core`
- `@cascade-ui/i18n`

## Tags

search, input, filter, form
