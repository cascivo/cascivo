# Tag

**Category:** display  
**Description:** Compact chip for labeling, categorizing, or filtering content

## When to use

- Labeling, categorizing, or filtering content with a compact chip
- Representing a removable selection or active filter (onDismiss)
- Showing a set of keywords or attributes on an item

## When NOT to use

- A static, non-interactive status label — use Badge
- A live system state with a dot — use Status

## Anti-patterns

### Tag provides accessible dismiss semantics; bolting interactivity onto Badge skips that

**Bad:** `Using Badge with a custom close button to make it removable`  
**Good:** `<Tag onDismiss={remove}> which renders a proper labeled remove button`  
**Why:** Tag provides accessible dismiss semantics; bolting interactivity onto Badge skips that

## Related components

- **Badge** (alternative): Badge is the static, non-interactive counterpart
- **TagsInput** (contained-by): TagsInput renders Tags for each entered value

## Accessibility rationale

When dismissible, the remove control is a real button with a label (dismissLabel) so keyboard users can remove it via Enter/Space; color variants are reinforced by text, not hue alone

## Props

| Name           | Type         | Required | Default   | Description                                                     |
| -------------- | ------------ | -------- | --------- | --------------------------------------------------------------- | -------- | --- | ------- | --- |
| `variant`      | `'default'   | 'info'   | 'success' | 'warning'                                                       | 'error'` | No  | default | —   |
| `size`         | `'sm'        | 'md'`    | No        | md                                                              | —        |
| `onDismiss`    | `() => void` | No       | —         | When provided, renders a trailing remove button inside the chip |
| `dismissLabel` | `string`     | No       | Remove    | —                                                               |

## Tokens

- `--cascade-color-bg-subtle`
- `--cascade-color-text-subtle`
- `--cascade-color-info`
- `--cascade-color-info-subtle`
- `--cascade-color-success`
- `--cascade-color-success-subtle`
- `--cascade-color-warning`
- `--cascade-color-warning-subtle`
- `--cascade-color-destructive`
- `--cascade-color-destructive-subtle`
- `--cascade-radius-badge`
- `--cascade-focus-ring`

## Examples

### Default

```jsx
<Tag>Design</Tag>
```

### Success

```jsx
<Tag variant="success">Approved</Tag>
```

### Dismissible

Renders a trailing remove button labeled by dismissLabel

```jsx
<Tag onDismiss={() => removeFilter()}>Filter: Active</Tag>
```

## Boundaries

| Area                       | Level    | Note                                                            |
| -------------------------- | -------- | --------------------------------------------------------------- |
| variant and dismissibility | flexible | onDismiss is optional; variant matches semantic meaning         |
| token names                | strict   | Variant colors must resolve to --cascade-color-\*-subtle tokens |
