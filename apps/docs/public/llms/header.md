# Header

App top bar with brand, primary navigation links, and an actions slot

## Install

```bash
npx cascade add header
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
| `sticky`    | `boolean`                                             | no       | `false` | —                                                              |
| `className` | `string`                                              | no       | —       | —                                                              |

## Examples

### Basic

```tsx
<Header brand="cascade" links={[{ label: 'Docs', href: '/docs' }]} />
```

### With actions

```tsx
<Header brand="cascade" actions={<Button size="sm">Sign in</Button>} />
```

### Sticky

```tsx
<Header sticky brand="cascade" links={links} />
```

## Design tokens

- `--cascade-header-bg`
- `--cascade-color-surface`
- `--cascade-color-border`
- `--cascade-color-text`
- `--cascade-color-text-subtle`
- `--cascade-color-bg-subtle`
- `--cascade-focus-ring`
- `--cascade-z-raised`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `banner`
- **Keyboard:** Tab

## Dependencies

- `@cascade-ui/core`
- `@cascade-ui/i18n`

## Tags

navigation, app-shell, top-bar, banner
