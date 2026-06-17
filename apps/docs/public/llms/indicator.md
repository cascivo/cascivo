# Indicator

Positions an overlay element (badge, dot, count) at a corner of its child

## Install

```bash
npx cascivo add indicator
```

## Category

`layout`

## Props

| Prop        | Type              | Required  | Default        | Description                                              |
| ----------- | ----------------- | --------- | -------------- | -------------------------------------------------------- | --- | --------- | --- |
| `children`  | `React.ReactNode` | yes       | —              | —                                                        |
| `overlay`   | `React.ReactNode` | yes       | —              | The element to display at the corner (badge, dot, count) |
| `placement` | `'top-start'      | 'top-end' | 'bottom-start' | 'bottom-end'`                                            | no  | `top-end` | —   |
| `className` | `string`          | no        | —              | —                                                        |

## Examples

### Notification count

Notification count badge on an icon button

```tsx
<Indicator overlay={<Badge>3</Badge>}>
  <Button variant="ghost">
    <Icon name="bell" />
  </Button>
</Indicator>
```

### Online status

Online status dot on an avatar

```tsx
<Indicator overlay={<span className="status-dot" />} placement="bottom-end">
  <Avatar src="/user.jpg" />
</Indicator>
```

### Bottom-start placement

Indicator positioned at the bottom-start corner

```tsx
<Indicator overlay={<Badge variant="destructive">!</Badge>} placement="bottom-start">
  <Card>Content</Card>
</Indicator>
```

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `none`

## Tags

badge, indicator, overlay, notification, layout
