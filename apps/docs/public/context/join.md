# Join

**Category:** layout  
**Description:** Groups adjacent children into a seamless joined element by removing interior borders and radii

## When to use

- Input + button search groups where the two controls should appear as one unit
- Segmented button rows where buttons share borders

## When NOT to use

- Independent adjacent buttons that should remain visually separate
- SegmentedControl — it has its own built-in grouping and selection semantics

## Related components

- **SegmentedControl** (alternative): SegmentedControl has built-in selection state; Join is purely a layout wrapper
- **InputGroup** (alternative): InputGroup handles input + addon joining; Join is the general-purpose grouping primitive

## Accessibility rationale

Join is a layout-only container (role="none"). Accessibility semantics belong on the individual child controls — buttons carry their own role, inputs their labels.

## Props

| Name          | Type              | Required    | Default | Description |
| ------------- | ----------------- | ----------- | ------- | ----------- | --- |
| `children`    | `React.ReactNode` | Yes         | —       | —           |
| `orientation` | `'horizontal'     | 'vertical'` | No      | horizontal  | —   |
| `className`   | `string`          | No          | —       | —           |

## Examples

### Search group

Input and button joined into a single search control

```jsx
<Join>
  <Input placeholder="Search…" />
  <Button>Go</Button>
</Join>
```

### Segmented buttons

Segmented button row with no gaps between items

```jsx
<Join>
  <Button variant="secondary">Day</Button>
  <Button variant="secondary">Week</Button>
  <Button variant="secondary">Month</Button>
</Join>
```

### Vertical stack

Vertically joined button group

```jsx
<Join orientation="vertical">
  <Button>Top</Button>
  <Button>Middle</Button>
  <Button>Bottom</Button>
</Join>
```

## Boundaries

| Area        | Level    | Note                                                                         |
| ----------- | -------- | ---------------------------------------------------------------------------- |
| orientation | flexible | Horizontal and vertical grouping are both supported via the orientation prop |
