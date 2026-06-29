# Header

App top bar with brand, primary navigation links, and an actions slot

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add header
```

Or use it from the prebuilt package without copying:

```tsx
import { Header } from '@cascivo/react'
```

## Category

`navigation`

## States

- `default`

## Props

| Prop        | Type                                                  | Required | Default | Description                                                    |
| ----------- | ----------------------------------------------------- | -------- | ------- | -------------------------------------------------------------- |
| `brand`     | `React.ReactNode`                                     | no       | —       | Product name or logo area, typically wraps a link              |
| `links`     | `{ label: string; href: string; active?: boolean }[]` | no       | —       | Primary navigation links; active link gets aria-current="page" |
| `actions`   | `React.ReactNode`                                     | no       | —       | Right-aligned slot for buttons or an avatar                    |
| `sticky`    | `boolean`                                             | no       | `false` | When true, the header sticks to the top on scroll.             |
| `className` | `string`                                              | no       | —       | Additional CSS class names merged onto the root element.       |

## Examples

### Basic

```tsx
<Header brand="cascivo" links={[{ label: 'Docs', href: '/docs' }]} />
```

### With actions

```tsx
<Header brand="cascivo" actions={<Button size="sm">Sign in</Button>} />
```

### Sticky

```tsx
<Header sticky brand="cascivo" links={links} />
```

## Design tokens

- `--cascivo-header-bg`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-bg-subtle`
- `--cascivo-focus-ring`
- `--cascivo-z-raised`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `banner`
- **Keyboard:** Tab

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

navigation, app-shell, top-bar, banner
