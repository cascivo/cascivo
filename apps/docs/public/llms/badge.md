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

- `--cascade-color-accent`
- `--cascade-color-success`
- `--cascade-color-warning`
- `--cascade-color-destructive`
- `--cascade-radius-badge`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `status`

## Dependencies

- `@cascade-ui/core`

## Tags

label, status, tag
