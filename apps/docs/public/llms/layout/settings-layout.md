# SettingsLayout

Two-column settings page layout with a fixed-width menu and fluid content area.

## Install

```bash
npx cascade add layout/settings-layout
```

## Category

`layout`

## Props

| Prop       | Type        | Required | Default | Description           |
| ---------- | ----------- | -------- | ------- | --------------------- |
| `menu`     | `ReactNode` | yes      | —       | Side navigation menu  |
| `children` | `ReactNode` | yes      | —       | Settings content area |

## Examples

### Basic

Menu + content layout

```tsx
<SettingsLayout menu={<nav>Menu</nav>}>
  <div>Settings</div>
</SettingsLayout>
```

## Design tokens

- `--cascade-space-8`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `generic`

## Dependencies

- `@cascade-ui/core`

## Tags

layout, settings, page
