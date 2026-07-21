# AppShell

Sticky-header + full-height side-nav + single-scroll-container layout with an animated, accessible nav toggle.

> ⚠ **Name collision:** more than one cascivo entry is named `AppShell`.
> This page documents `app-shell` (npm @cascivo/react · or copy-paste). Others:
>
> - `layout/app-shell` — copy-paste — /llms/layout/app-shell.md

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add app-shell
```

Or use it from the prebuilt package without copying:

```tsx
import { AppShell } from '@cascivo/react'
```

## Category

`layout`

## States

- `open`
- `closed`

## Props

| Prop           | Type                      | Required | Default | Description                                                                                                      |
| -------------- | ------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| `header`       | `ReactNode`               | yes      | —       | Top bar (typically a ShellHeader). If a React element, its onMenuClick/menuExpanded are bound to the nav toggle. |
| `nav`          | `ReactNode`               | no       | —       | Side navigation (typically a SideNav). Fills full height and scrolls internally.                                 |
| `children`     | `ReactNode`               | yes      | —       | Main content, rendered inside the single scroll container.                                                       |
| `footer`       | `ReactNode`               | no       | —       | Optional footer pinned below the content area.                                                                   |
| `open`         | `boolean`                 | no       | —       | Controlled nav open/visible state. Omit for uncontrolled.                                                        |
| `defaultOpen`  | `boolean`                 | no       | —       | Initial open state when uncontrolled. Defaults open on desktop, closed on small screens.                         |
| `onOpenChange` | `(open: boolean) => void` | no       | —       | Fired when the nav requests open/close (burger, Escape, scrim).                                                  |

## Examples

### Header + SideNav + content

The burger in ShellHeader toggles the SideNav automatically.

```tsx
<AppShell header={<ShellHeader brand={{ name: 'Acme' }} />} nav={<SideNav items={items} />}>
  <h1>Dashboard</h1>
</AppShell>
```

### Controlled open

```tsx
<AppShell header={header} nav={nav} open={open.value} onOpenChange={(v) => (open.value = v)}>
  …
</AppShell>
```

## Design tokens

- `--cascivo-shell-aside-inline-size`
- `--cascivo-shell-panel-inline-size`
- `--cascivo-motion-emphasis`
- `--cascivo-z-raised`
- `--cascivo-z-overlay`
- `--cascivo-color-foreground`
- `--cascivo-color-background`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `none`
- **Keyboard:** Escape

## Dependencies

- `@cascivo/core`

## Tags

shell, layout, sidebar, navigation, drawer, responsive, sticky

---

_Generated from registry v0.9.0 on 2026-07-21. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
