# Cta

Call-to-action band — quiet hairline-bordered section with title, description, and centered actions. Replace demo content before shipping.

## Install

```bash
npx cascade add section/cta
```

## Category

`layout`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `ReactNode` | yes | — | Primary heading of the CTA band |
| `description` | `ReactNode` | no | — | Supporting text below the title |
| `actions` | `ReactNode` | no | — | Buttons or links centered below the description |
| `headingLevel` | `1 | 2 | 3` | no | `2` | HTML heading level for document outline control |

## Examples

### CTA band

Quiet bordered band with centered heading, description, and action buttons

```tsx
<Cta title="Ready to ship?" description="Add Cascade to your project in minutes." actions={<><Button>Get started</Button><Button variant="ghost">View on GitHub</Button></>} />
```

## Design tokens

- `--cascade-color-border`
- `--cascade-surface-subtle`
- `--cascade-text-2xl`
- `--cascade-text-base`
- `--cascade-font-bold`
- `--cascade-text-secondary`
- `--cascade-space-*`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `region`

## Dependencies

- `@cascade-ui/core`

## Tags

section, cta, marketing
