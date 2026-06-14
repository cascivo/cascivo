# ColorPicker

**Category:** inputs  
**Description:** Interactive color selection widget with saturation/lightness area, hue and alpha sliders

## When to use

- Letting a user choose an arbitrary color via a visual saturation/lightness area plus hue control
- Brand or theme customization UIs where an exact color value (hex) is captured
- Forms that need an optional alpha channel alongside the color

## When NOT to use

- Choosing from a small fixed palette only — use a swatch RadioGroup instead
- A single accent toggle where a few preset chips suffice

## Anti-patterns

### A free-form picker invites off-brand values when only a fixed set is allowed

**Bad:** `<ColorPicker /> with no presets for a brand palette of 4 fixed colors`  
**Good:** `<RadioGroup> of color swatches`  
**Why:** A free-form picker invites off-brand values when only a fixed set is allowed

## Related components

- **Slider** (contains): Hue and alpha channels are range sliders
- **Input** (pairs-with): The hex text field lets users paste an exact value

## Accessibility rationale

The saturation/lightness area is a focusable role="slider" with arrow-key nudging and an aria-valuetext reporting the current hex; hue and alpha are native range inputs that inherit platform slider semantics and announcements.

## Props

| Name            | Type                      | Required | Default | Description                |
| --------------- | ------------------------- | -------- | ------- | -------------------------- | --- | --- |
| `value`         | `string`                  | No       | —       | Controlled hex color value |
| `defaultValue`  | `string`                  | No       | #3b82f6 | —                          |
| `onValueChange` | `(value: string) => void` | No       | —       | —                          |
| `presets`       | `string[]`                | No       | —       | Preset swatch colors       |
| `alpha`         | `boolean`                 | No       | true    | —                          |
| `label`         | `string`                  | No       | —       | —                          |
| `disabled`      | `boolean`                 | No       | false   | —                          |
| `size`          | `'sm'                     | 'md'     | 'lg'`   | No                         | md  | —   |

## Tokens

- `--cascivo-color-accent`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-radius-md`
- `--cascivo-radius-full`
- `--cascivo-focus-ring`

## Examples

### Basic

```jsx
<ColorPicker defaultValue="#3b82f6" onValueChange={setColor} />
```

### With presets

```jsx
<ColorPicker presets={['#ef4444', '#3b82f6', '#10b981']} alpha={false} />
```

## Boundaries

| Area        | Level    | Note                                                                       |
| ----------- | -------- | -------------------------------------------------------------------------- |
| color model | flexible | Values are stored as hex; consumers can convert to rgb/hsl/oklch as needed |
| token names | strict   | Surfaces, borders and focus ring must resolve to --cascivo-\* tokens       |
