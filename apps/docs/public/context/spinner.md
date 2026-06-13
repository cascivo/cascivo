# Spinner

**Category:** feedback  
**Description:** Indeterminate loading indicator

## When to use

- Indicating indeterminate work where duration and progress are unknown
- Loading a small region or inline control where a shape preview is unnecessary
- Showing busy state in buttons or compact UI

## When NOT to use

- Progress with a known percentage — use ProgressBar or ProgressCircle
- Loading content with a known structure — use Skeleton

## Anti-patterns

### Skeletons preview structure and feel faster; spinners are best for short, shapeless waits

**Bad:** `A full-page spinner for content whose layout is known`  
**Good:** `<Skeleton> mirroring the content shape to reduce perceived wait and layout shift`  
**Why:** Skeletons preview structure and feel faster; spinners are best for short, shapeless waits

## Related components

- **Skeleton** (alternative): Skeleton suits content with a known shape
- **ProgressBar** (alternative): ProgressBar suits determinate progress

## Accessibility rationale

role="status" with an accessible label (default "Loading", i18n-driven) so assistive tech announces the busy state rather than leaving the spin silent

## Props

| Name    | Type     | Required | Default | Description                                  |
| ------- | -------- | -------- | ------- | -------------------------------------------- | --- | --- |
| `size`  | `'sm'    | 'md'     | 'lg'`   | No                                           | md  | —   |
| `label` | `string` | No       | Loading | Accessible label announced by screen readers |

## Tokens

- `--cascade-radius-full`

## Examples

### Default

```jsx
<Spinner />
```

### Large

```jsx
<Spinner size="lg" />
```

## Boundaries

| Area        | Level    | Note                                         |
| ----------- | -------- | -------------------------------------------- |
| size        | flexible | sm/md/lg to fit inline vs standalone use     |
| token names | strict   | Radius must resolve to --cascade-radius-full |
