# FeatureGrid

Feature section — AutoGrid of items with optional title, description, and icon slots. Icons are optional; the grid works text-only. Replace demo content before shipping.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add section/feature-grid
```

_Copy-paste only — this block/layout is not published as an importable package._

## Category

`layout`

## Props

| Prop           | Type            | Required | Default   | Description                                                             |
| -------------- | --------------- | -------- | --------- | ----------------------------------------------------------------------- |
| `items`        | `FeatureItem[]` | yes      | —         | Array of feature items with title, optional description, icon, and href |
| `title`        | `ReactNode`     | no       | —         | Section heading above the grid                                          |
| `description`  | `ReactNode`     | no       | —         | Subheading below the section title                                      |
| `headingLevel` | `1 \| 2 \| 3`   | no       | `2`       | Heading level for the section title (items use headingLevel + 1)        |
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

- `--cascivo-text-2xl`
- `--cascivo-text-base`
- `--cascivo-text-sm`
- `--cascivo-font-bold`
- `--cascivo-font-semibold`
- `--cascivo-text-secondary`
- `--cascivo-color-border`
- `--cascivo-surface-subtle`
- `--cascivo-space-*`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `region`

## Dependencies

- `@cascivo/core`

## Tags

section, features, grid

---

_Generated from registry v0.11.0 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
