# CheckboxCard

Multi-selectable card backed by a native checkbox. Use multiple independent CheckboxCards for multi-select scenarios.

## Install

```bash
npx cascade add checkbox-card
```

## Category

`inputs`

## States

- `default`
- `checked`
- `disabled`

## Props

| Prop              | Type                         | Required | Default | Description              |
| ----------------- | ---------------------------- | -------- | ------- | ------------------------ |
| `title`           | `ReactNode`                  | yes      | —       | Card title               |
| `description`     | `ReactNode`                  | no       | —       | Optional description     |
| `checked`         | `boolean`                    | no       | —       | Controlled checked state |
| `defaultChecked`  | `boolean`                    | no       | —       | Uncontrolled default     |
| `onCheckedChange` | `(checked: boolean) => void` | no       | —       | Change callback          |
| `disabled`        | `boolean`                    | no       | —       | Disables the card        |

## Examples

### Feature toggles

Multi-select feature toggles

```tsx
<div style={{ display: 'grid', gap: 12 }}>
  <CheckboxCard
    title="Automated backups"
    description="Daily snapshots, 30-day retention"
    defaultChecked
  />
  <CheckboxCard title="Monitoring" description="Metrics + alerting" />
  <CheckboxCard title="Audit log" description="Requires Team plan" disabled />
</div>
```

## Design tokens

- `--cascivo-color-accent`
- `--cascivo-color-border`
- `--cascivo-radius-surface`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `checkbox`
- **Keyboard:** Space

## Dependencies

- `@cascivo/core`

## Tags

checkbox, card, selectable, form
