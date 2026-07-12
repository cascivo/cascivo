# SettingsLayout

Two-column settings page layout with a fixed-width menu and fluid content area.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add layout/settings-layout
```

_Copy-paste only — this block/layout is not published as an importable package._

## Category

`layout`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `menu` | `ReactNode` | yes | — | Side navigation menu |
| `children` | `ReactNode` | yes | — | Settings content area |

## Examples

### Basic

Menu + content layout

```tsx
<SettingsLayout menu={<nav>Menu</nav>}><div>Settings</div></SettingsLayout>
```

## Design tokens

- `--cascivo-space-8`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascivo/core`

## Tags

layout, settings, page
