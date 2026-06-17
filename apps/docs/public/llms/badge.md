# Badge

Small status label or category indicator

## Install

```bash
npx cascivo add badge
```

## Category

`display`

## Variants

- `default`
- `secondary`
- `success`
- `warning`
- `destructive`
- `outline`

## Sizes

- `sm`
- `md`

## Props

| Prop      | Type       | Required    | Default   | Description |
| --------- | ---------- | ----------- | --------- | ----------- | ------------- | ---------- | --- | --------- | --- |
| `variant` | `'default' | 'secondary' | 'success' | 'warning'   | 'destructive' | 'outline'` | no  | `default` | —   |
| `size`    | `'sm'      | 'md'`       | no        | `md`        | —             |

## Examples

### Default

```tsx
<Badge>New</Badge>
```

### Success

```tsx
<Badge variant="success">Active</Badge>
```

### Destructive

```tsx
<Badge variant="destructive">Deprecated</Badge>
```

## Design tokens

- `--cascivo-font-sans`
- `--cascivo-font-medium`
- `--cascivo-radius-badge`
- `--cascivo-space-1`
- `--cascivo-space-2`
- `--cascivo-space-3`
- `--cascivo-text-xs`
- `--cascivo-leading-normal`
- `--cascivo-color-accent`
- `--cascivo-color-text-on-accent`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-text`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-color-success-subtle`
- `--cascivo-color-success-foreground`
- `--cascivo-color-warning-subtle`
- `--cascivo-color-warning-foreground`
- `--cascivo-color-destructive-subtle`
- `--cascivo-color-destructive-foreground`
- `--cascivo-color-primary`
- `--cascivo-color-primary-content`
- `--cascivo-color-info`
- `--cascivo-color-info-content`
- `--cascivo-color-error`
- `--cascivo-color-error-content`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `status`

## Dependencies

- `@cascivo/core`

## Tags

label, status, tag
