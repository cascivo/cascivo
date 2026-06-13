# RatingGroup

**Category:** inputs  
**Description:** Star rating input with accessible radio group pattern

## When to use

- Capturing a discrete subjective rating on a small fixed scale (e.g. 1–5 stars)
- Displaying an existing rating read-only as a compact star summary

## When NOT to use

- Choosing along a continuous or large numeric range — use Slider
- Entering an exact bounded number with steppers — use NumberInput
- A non-rating single choice among labeled options — use Radio or SegmentedControl

## Anti-patterns

### A slider communicates a continuous magnitude; RatingGroup uses radio semantics so each star is an exclusive discrete choice announced as "N of M stars"

**Bad:** `<Slider min={1} max={5} step={1} /> labeled as a star rating`  
**Good:** `<RatingGroup value={rating} onValueChange={setRating} />`  
**Why:** A slider communicates a continuous magnitude; RatingGroup uses radio semantics so each star is an exclusive discrete choice announced as "N of M stars"

## Related components

- **Slider** (alternative): Use for continuous or larger numeric ranges
- **NumberInput** (alternative): Use when an exact typed number is needed rather than a rating

## Accessibility rationale

Each star is a <button role="radio"> inside a role="radiogroup" with aria-checked on the selected value and an aria-label like "3 of 5 stars"; when readOnly or disabled the stars drop out of the tab order so a non-interactive rating is not announced as actionable.

## Props

| Name            | Type                  | Required | Default | Description |
| --------------- | --------------------- | -------- | ------- | ----------- | --- | --- |
| `value`         | `number`              | Yes      | —       | —           |
| `onValueChange` | `(v: number) => void` | No       | —       | —           |
| `max`           | `number`              | No       | 5       | —           |
| `size`          | `'sm'                 | 'md'     | 'lg'`   | No          | md  | —   |
| `disabled`      | `boolean`             | No       | false   | —           |
| `readOnly`      | `boolean`             | No       | false   | —           |
| `labels`        | `RatingGroupLabels`   | No       | —       | —           |

## Tokens

- `--cascade-color-warning`
- `--cascade-color-border-strong`
- `--cascade-color-accent`
- `--cascade-radius-sm`

## Examples

### Basic

```jsx
<RatingGroup value={3} onValueChange={() => {}} />
```

### Read only

```jsx
<RatingGroup value={4} readOnly />
```

## Boundaries

| Area             | Level    | Note                                                                      |
| ---------------- | -------- | ------------------------------------------------------------------------- |
| token names      | strict   | Star styling must resolve to the listed --cascade-\* tokens               |
| scale and labels | flexible | max sets the scale and labels.rating customizes the per-star announcement |
