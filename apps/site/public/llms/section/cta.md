# Cta

Call-to-action band — quiet hairline-bordered section with title, description, and centered actions. Replace demo content before shipping.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add section/cta
```

_Copy-paste only — `Cta` is not exported from `@cascivo/react`. Run the command above to own the source, or compose it from the exported primitives (`Flex`, `Grid`, `Heading`, …)._

## Category

`layout`

## Props

| Prop           | Type          | Required | Default | Description                                     |
| -------------- | ------------- | -------- | ------- | ----------------------------------------------- |
| `title`        | `ReactNode`   | yes      | —       | Primary heading of the CTA band                 |
| `description`  | `ReactNode`   | no       | —       | Supporting text below the title                 |
| `actions`      | `ReactNode`   | no       | —       | Buttons or links centered below the description |
| `headingLevel` | `1 \| 2 \| 3` | no       | `2`     | HTML heading level for document outline control |

## Examples

### CTA band

Quiet bordered band with centered heading, description, and action buttons

```tsx
<Cta
  title="Ready to ship?"
  description="Add Cascade to your project in minutes."
  actions={
    <>
      <Button>Get started</Button>
      <Button variant="ghost">View on GitHub</Button>
    </>
  }
/>
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Design tokens

- `--cascivo-color-border`
- `--cascivo-color-bg-subtle`
- `--cascivo-text-2xl`
- `--cascivo-text-base`
- `--cascivo-font-bold`
- `--cascivo-color-text-subtle`
- `--cascivo-space-*`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `region`

## Dependencies

- `@cascivo/core`

## Tags

section, cta, marketing

---

_Generated from registry v0.14.0 on 2026-07-31. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
