# PageFooter

Site footer — AutoGrid of link groups with a brand/meta bottom row. Renders a <footer> element with a <nav aria-label="Footer"> wrapping the link columns.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add section/page-footer
```

_Copy-paste only — this block/layout is not published as an importable package._

## Category

`layout`

## Props

| Prop     | Type            | Required | Default | Description                                                              |
| -------- | --------------- | -------- | ------- | ------------------------------------------------------------------------ |
| `groups` | `FooterGroup[]` | yes      | —       | Array of link groups, each with a title and array of {label, href} links |
| `brand`  | `ReactNode`     | no       | —       | Brand name or logo shown in the bottom row                               |
| `meta`   | `ReactNode`     | no       | —       | Meta line in the bottom row (license, copyright, etc.)                   |

## Examples

### Site footer

Three-column footer with brand and license meta

```tsx
<PageFooter
  brand="Cascade"
  meta="MIT licensed. Built with care."
  groups={[
    {
      title: 'Product',
      links: [
        { label: 'Components', href: '/components' },
        { label: 'Charts', href: '/charts' },
        { label: 'Layouts', href: '/layouts' },
      ],
    },
    {
      title: 'Developers',
      links: [
        { label: 'Docs', href: '/docs' },
        { label: 'GitHub', href: 'https://github.com/cascivo/cascivo' },
        { label: 'Changelog', href: '/changelog' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Figma kit', href: '/figma' },
        { label: 'Storybook', href: '/storybook' },
      ],
    },
  ]}
/>
```

## Design tokens

- `--cascivo-text-sm`
- `--cascivo-font-mono`
- `--cascivo-font-semibold`
- `--cascivo-text-primary`
- `--cascivo-text-secondary`
- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-space-*`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `contentinfo`

## Dependencies

- `@cascivo/core`

## Tags

section, footer, navigation
