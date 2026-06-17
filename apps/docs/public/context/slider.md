# Slider

**Category:** inputs  
**Description:** Range input for selecting a value within bounds

## When to use

- Selecting a value within a continuous or stepped numeric range where approximate adjustment is fine
- Settings like volume, brightness, or opacity where dragging gives instant feedback
- When the bounds (min/max) matter more than entering an exact figure

## When NOT to use

- A precise numeric value must be typed — use NumberInput
- Picking a discrete rating on a small scale where stars/icons read better — use RatingGroup

## Anti-patterns

### A huge range makes a single value impossible to hit by dragging; type the exact number instead

**Bad:** `<Slider label="Price" min={0} max={1000000} />`  
**Good:** `<NumberInput label="Price" />`  
**Why:** A huge range makes a single value impossible to hit by dragging; type the exact number instead

## Related components

- **NumberInput** (alternative): Use when an exact, typed numeric value is required
- **RatingGroup** (alternative): Use for small discrete rating scales rather than a continuous range

## Accessibility rationale

Renders a native <input type="range"> so the slider role, value announcements, and full arrow/Home/End keyboard support come from the platform without custom ARIA.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | `string` | No | — | — |
| `min` | `number` | No | 0 | — |
| `max` | `number` | No | 100 | — |
| `step` | `number` | No | 1 | — |
| `value` | `number` | No | — | — |
| `defaultValue` | `number` | No | — | — |
| `disabled` | `boolean` | No | false | — |

## Tokens

- `--cascivo-color-accent`
- `--cascivo-color-border-strong`
- `--cascivo-color-surface`
- `--cascivo-radius-full`
- `--cascivo-focus-ring`

## Examples

### Basic

```jsx
<Slider label="Volume" defaultValue={50} />
```

### Stepped

```jsx
<Slider label="Rating" min={0} max={5} step={1} />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| token names | strict | Track and thumb colors must resolve to --cascivo-color-* / radius / focus-ring tokens |
| min/max/step | flexible | Consumer-defined bounds and increment |
