# SettingsLayout

Two-column settings page layout with a fixed-width menu and fluid content area.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add layout/settings-layout
```

_Copy-paste only — `SettingsLayout` is not exported from `@cascivo/react`. Run the command above to own the source, or compose it from the exported primitives (`Flex`, `Grid`, `Heading`, …)._

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

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Design tokens

- `--cascivo-space-8`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascivo/core`

## Tags

layout, settings, page

---

_Generated from registry v0.14.0 on 2026-07-31. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
