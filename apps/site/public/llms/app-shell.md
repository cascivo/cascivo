# AppShell

Sticky-header + full-height side-nav + single-scroll-container layout with an animated, accessible nav toggle.

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

| Prop           | Type                      | Required | Default | Description                                                                                                                                                                                                                         |
| -------------- | ------------------------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `header`       | `ReactNode`               | yes      | —       | Top bar (typically a ShellHeader). If a React element, its onMenuClick/menuExpanded are bound to the nav toggle.                                                                                                                    |
| `nav`          | `ReactNode`               | no       | —       | Side navigation (typically a SideNav). Fills full height and scrolls internally.                                                                                                                                                    |
| `children`     | `ReactNode`               | yes      | —       | Main content, rendered inside the single scroll container.                                                                                                                                                                          |
| `footer`       | `ReactNode`               | no       | —       | Optional footer pinned below the content area.                                                                                                                                                                                      |
| `open`         | `boolean`                 | no       | —       | Controlled nav open/visible state. Omit for uncontrolled.                                                                                                                                                                           |
| `defaultOpen`  | `boolean`                 | no       | —       | Initial open state when uncontrolled. Defaults open on desktop, closed on small screens.                                                                                                                                            |
| `onOpenChange` | `(open: boolean) => void` | no       | —       | Fired when the nav requests open/close (burger, Escape, scrim).                                                                                                                                                                     |
| `padding`      | `SpaceStep \| 'none'`     | no       | `6`     | Inset around the main content area, as a space-scale step. Defaults to 6 — `<main>` shipped unpadded for three releases and every adopter wrote the same wrapper div. Pass 'none' for a full-bleed layout that owns its own insets. |

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

## Client JavaScript

Enhancement only. The component still does its job with JavaScript disabled — the server-rendered HTML is correct and nothing is unreachable; client JS adds polish on top.

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

_Generated from registry v0.18.0 on 2026-08-17. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
