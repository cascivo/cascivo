# FeatureGrid

Feature section — AutoGrid of items with optional title, description, and icon slots. Icons are optional; the grid works text-only. Replace demo content before shipping.

## Install

```bash
npx cascade add section/feature-grid
```

## Category

`layout`

## Props

| Prop           | Type            | Required | Default   | Description                                                             |
| -------------- | --------------- | -------- | --------- | ----------------------------------------------------------------------- | --- | ---------------------------------------------------------------- |
| `items`        | `FeatureItem[]` | yes      | —         | Array of feature items with title, optional description, icon, and href |
| `title`        | `ReactNode`     | no       | —         | Section heading above the grid                                          |
| `description`  | `ReactNode`     | no       | —         | Subheading below the section title                                      |
| `headingLevel` | `1              | 2        | 3`        | no                                                                      | `2` | Heading level for the section title (items use headingLevel + 1) |
| `min`          | `string`        | no       | `"16rem"` | Minimum track width forwarded to AutoGrid                               |

## Examples

### Feature grid (text-only)

Four-item text-only feature grid with section heading

```tsx
<FeatureGrid
  title="Built for production"
  description="Everything you need to ship a polished product."
  items={[
    {
      title: 'Zero config',
      description: 'Copy a component and it works — no providers, no wrappers.',
    },
    {
      title: 'Token-first',
      description: 'Every color, size and radius is a CSS custom property you own.',
    },
    {
      title: 'Signal-driven',
      description: 'Fine-grained reactivity with @preact/signals-react — zero re-renders.',
    },
    {
      title: 'Accessible by default',
      description: 'WCAG 2.1 AA, keyboard navigable, logical CSS properties for RTL.',
    },
  ]}
/>
```

## Design tokens

- `--cascade-text-2xl`
- `--cascade-text-base`
- `--cascade-text-sm`
- `--cascade-font-bold`
- `--cascade-font-semibold`
- `--cascade-text-secondary`
- `--cascade-color-border`
- `--cascade-surface-subtle`
- `--cascade-space-*`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `region`

## Dependencies

- `@cascade-ui/core`

## Tags

section, features, grid
