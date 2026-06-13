# Heading

Section heading with semantic level decoupled from visual size

## Install

```bash
npx cascade add heading
```

## Category

`display`

## Sizes

- `sm`
- `md`
- `lg`
- `xl`
- `2xl`

## Props

| Prop    | Type  | Required | Default | Description |
| ------- | ----- | -------- | ------- | ----------- | ------ | --- | ---------------------------------------------------------- | --- | --- |
| `level` | `1    | 2        | 3       | 4           | 5      | 6`  | no                                                         | `2` | —   |
| `size`  | `'sm' | 'md'     | 'lg'    | 'xl'        | '2xl'` | no  | `derived from level (1→2xl, 2→xl, 3→lg, 4→md, 5→sm, 6→sm)` | —   |

## Examples

### Default

```tsx
<Heading>Section title</Heading>
```

### Page title

```tsx
<Heading level={1}>Page title</Heading>
```

### Decoupled size

Keep the document outline correct while controlling the visual scale

```tsx
<Heading level={2} size="2xl">
  Visually large, semantically h2
</Heading>
```

## Design tokens

- `--cascade-font-sans`
- `--cascade-font-semibold`
- `--cascade-leading-tight`
- `--cascade-tracking-tight`
- `--cascade-color-text`
- `--cascade-text-base`
- `--cascade-text-lg`
- `--cascade-text-xl`
- `--cascade-text-2xl`
- `--cascade-text-3xl`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `heading`

## Dependencies

- `@cascade-ui/core`

## Tags

typography, heading, title
