# Indicator

**Category:** layout  
**Description:** Positions an overlay element (badge, dot, count) at a corner of its child

## When to use

- Notification counts on icon buttons
- Status dots on avatars

## When NOT to use

- Inline badges within text — use Badge directly
- Status messages below a field — use a form hint or Alert

## Related components

- **Badge** (contained-by): Badge is the most common overlay content placed inside Indicator
- **Avatar** (pairs-with): Indicator is frequently used to attach a status dot to an Avatar

## Accessibility rationale

The overlay is marked aria-hidden because it is a visual affordance — the underlying control (button, avatar) carries its own accessible label. Screen-reader users should receive the count or status through the control's accessible name or a live region, not from the overlay div.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `React.ReactNode` | Yes | — | — |
| `overlay` | `React.ReactNode` | Yes | — | The element to display at the corner (badge, dot, count) |
| `placement` | `'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'` | No | top-end | — |
| `className` | `string` | No | — | — |

## Examples

### Notification count

Notification count badge on an icon button

```jsx
<Indicator overlay={<Badge>3</Badge>}><Button variant="ghost"><Icon name="bell" /></Button></Indicator>
```

### Online status

Online status dot on an avatar

```jsx
<Indicator overlay={<span className="status-dot" />} placement="bottom-end"><Avatar src="/user.jpg" /></Indicator>
```

### Bottom-start placement

Indicator positioned at the bottom-start corner

```jsx
<Indicator overlay={<Badge variant="destructive">!</Badge>} placement="bottom-start"><Card>Content</Card></Indicator>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| placement | flexible | All four corners are supported; top-end is the most common convention for notification counts |
