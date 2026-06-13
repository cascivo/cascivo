# CopyButton

Icon button that copies a value to the clipboard with copied feedback

## Install

```bash
npx cascade add copy-button
```

## Category

`inputs`

## Sizes

- `sm`
- `md`

## States

- `idle`
- `copied`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `string` | yes | — | The text written to the clipboard on click |
| `size` | `'sm' | 'md'` | no | `md` | — |
| `labels` | `{ copy?: string; copied?: string }` | no | — | Overrides the built-in i18n labels per instance |

## Examples

### Default

```tsx
<CopyButton value="npx cascade add button" />
```

### Small

```tsx
<CopyButton value="pnpm install" size="sm" />
```

### Custom labels

Override the built-in copy/copied strings per instance

```tsx
<CopyButton value="token" labels={{ copy: 'Copy token', copied: 'Token copied' }} />
```

## Design tokens

- `--cascade-color-surface`
- `--cascade-color-text-subtle`
- `--cascade-color-text`
- `--cascade-color-border`
- `--cascade-color-bg-subtle`
- `--cascade-color-success`
- `--cascade-radius-control`
- `--cascade-focus-ring`
- `--cascade-control-height-sm`
- `--cascade-control-height-md`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `button`
- **Keyboard:** Enter, Space

## Dependencies

- `@cascade-ui/core`
- `@cascade-ui/i18n`

## Tags

clipboard, copy, button, snippet
