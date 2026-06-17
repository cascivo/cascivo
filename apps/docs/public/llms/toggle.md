# Toggle

On/off switch built as an accessible button

## Install

```bash
npx cascivo add toggle
```

## Category

`inputs`

## Sizes

- `sm`
- `md`

## States

- `off`
- `on`

## Props

| Prop             | Type                         | Required | Default | Description |
| ---------------- | ---------------------------- | -------- | ------- | ----------- | --- |
| `checked`        | `boolean`                    | no       | —       | —           |
| `defaultChecked` | `boolean`                    | no       | `false` | —           |
| `onChange`       | `(checked: boolean) => void` | no       | —       | —           |
| `label`          | `string`                     | no       | —       | —           |
| `size`           | `'sm'                        | 'md'`    | no      | `md`        | —   |
| `disabled`       | `boolean`                    | no       | `false` | —           |

## Examples

### Uncontrolled

```tsx
<Toggle label="Notifications" defaultChecked />
```

### Controlled

```tsx
<Toggle checked={enabled} onChange={setEnabled} label="Dark mode" />
```

## Design tokens

- `--cascivo-color-accent`
- `--cascivo-color-border-strong`
- `--cascivo-color-surface`
- `--cascivo-radius-full`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `switch`
- **Keyboard:** Space, Enter

## Dependencies

- `@cascivo/core`

## Tags

switch, form, boolean
