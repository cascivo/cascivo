# Swap

**Category:** inputs  
**Description:** Animated toggle between two icon/content states with rotate or flip transition

## When to use

- Theme toggles where an icon animates between two states (sun/moon)
- Favorite or bookmark toggles that flip between outlined and filled icons
- Any scenario where exactly two icons swap places with a transition

## When NOT to use

- Form toggles with a visible label — use Toggle
- Checkbox-style inputs that are part of a submitted form — use Checkbox
- When a text label must always be visible alongside the control

## Anti-patterns

### Swap is designed for icon transitions; for labeled on/off controls use Toggle

**Bad:** `<Swap on="Enable" off="Disable" /> (text content)`  
**Good:** `<Toggle label="Enable notifications" />`  
**Why:** Swap is designed for icon transitions; for labeled on/off controls use Toggle

## Related components

- **Toggle** (alternative): Use when a visible text label is required alongside the switch control
- **Checkbox** (alternative): Use for form selections that are submitted rather than applied immediately

## Accessibility rationale

Renders a <button role="switch"> with aria-checked reflecting state. Both on/off slots are aria-hidden so screen readers announce the button state, not the icon content.

## Props

| Name         | Type                         | Required | Default | Description |
| ------------ | ---------------------------- | -------- | ------- | ----------- | --- |
| `on`         | `React.ReactNode`            | Yes      | —       | —           |
| `off`        | `React.ReactNode`            | Yes      | —       | —           |
| `checked`    | `boolean`                    | No       | false   | —           |
| `onChange`   | `(checked: boolean) => void` | No       | —       | —           |
| `mode`       | `'rotate'                    | 'flip'`  | No      | rotate      | —   |
| `aria-label` | `string`                     | No       | —       | —           |
| `className`  | `string`                     | No       | —       | —           |

## Tokens

- `--cascivo-ring-width`
- `--cascivo-ring-color`
- `--cascivo-radius-control`
- `--cascivo-ease-out`

## Examples

### Theme toggle (rotate)

Sun/moon icon that rotates between two states

```jsx
<Swap on={<SunIcon />} off={<MoonIcon />} mode="rotate" aria-label="Toggle theme" />
```

### Flip mode

Heart icon that flips to filled on activation

```jsx
<Swap on={<HeartFilledIcon />} off={<HeartIcon />} mode="flip" aria-label="Favorite" />
```

## Boundaries

| Area           | Level    | Note                                                                        |
| -------------- | -------- | --------------------------------------------------------------------------- |
| content        | flexible | on/off slots accept any ReactNode — icons, text, images                     |
| animation mode | flexible | rotate (default) or flip — choose based on the visual metaphor of the icons |
