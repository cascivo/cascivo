# Badge

Small status label or category indicator

## Install

```bash
npx cascade add badge
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

- `--cascivo-color-accent`
- `--cascivo-color-success`
- `--cascivo-color-warning`
- `--cascivo-color-destructive`
- `--cascivo-radius-badge`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `status`

## Dependencies

- `@cascade-ui/core`

## Tags

label, status, tag
