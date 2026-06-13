# Hero

Page hero section — centered or split layout with eyebrow, title, description, actions and media slots. Replace demo content before shipping.

## Install

```bash
npx cascade add section/hero
```

## Category

`layout`

## Variants

- `centered`
- `split`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `variant` | `"centered" | "split"` | no | `"centered"` | Layout variant: centered (single column) or split (two columns) |
| `title` | `ReactNode` | yes | — | Primary heading content |
| `eyebrow` | `ReactNode` | no | — | Small monospace label above the title |
| `description` | `ReactNode` | no | — | Supporting paragraph below the title |
| `actions` | `ReactNode` | no | — | Buttons or links rendered in a row below the description |
| `media` | `ReactNode` | no | — | Right-hand slot in the split variant (image, demo, code block) |
| `headingLevel` | `1 | 2 | 3` | no | `1` | HTML heading level for document outline control |

## Examples

### Centered hero

Single-column hero with eyebrow, headline, description, and CTA buttons

```tsx
<Hero eyebrow="v8 — Assembly Included" title="Ship the dashboard your ops team deserves" description="Cascade gives you charts, layouts and sections — fully composed, copy-paste ready." actions={<><Button>Get started</Button><Button variant="ghost">View docs</Button></>} />
```

### Split hero

Two-column layout with copy on the left and media on the right

```tsx
<Hero variant="split" title="Signal-driven, CSS-native" description="Fine-grained reactivity with zero re-renders. Beautiful by default." actions={<Button>Start building</Button>} media={<img src="/preview.png" alt="Dashboard preview" />} />
```

## Design tokens

- `--cascade-text-4xl`
- `--cascade-text-lg`
- `--cascade-text-sm`
- `--cascade-font-mono`
- `--cascade-font-bold`
- `--cascade-text-secondary`
- `--cascade-space-*`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `region`

## Dependencies

- `@cascade-ui/core`

## Tags

section, hero, marketing
