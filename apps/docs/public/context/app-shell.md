# AppShell

**Category:** layout  
**Description:** Sticky-header + full-height side-nav + single-scroll-container layout with an animated, accessible nav toggle.

## When to use

- Building an application screen with a persistent header and side navigation
- You want the header burger to toggle the side nav with an animated, accessible show/hide out of the box
- You need one scroll container (the main area) with a fixed header and full-height nav

## When NOT to use

- Marketing/document pages where the whole page should scroll — use a plain Header instead
- A single, always-visible sidebar with no toggle — compose SideNav directly

## Anti-patterns

### fr units have no definite size to resolve against on a shrink-to-fit flex item, so the track never animates

**Bad:** `Animating the nav collapse with grid-template-columns: 1fr → 0fr on an auto-width sidebar`  
**Good:** `AppShell animates an explicit inline-size (desktop) / transform (mobile drawer)`  
**Why:** fr units have no definite size to resolve against on a shrink-to-fit flex item, so the track never animates

## Related components

- **ShellHeader** (pairs-with): Provides the top bar and burger AppShell binds to the nav
- **SideNav** (pairs-with): The side navigation AppShell lays out full-height

## Accessibility rationale

The hidden nav uses transform/inline-size + inert (never display:none alone), so it stays in the a11y tree and is keyboard-reachable when open while leaving the tab order when closed; Escape and a scrim close the mobile drawer and focus returns to the toggle.

## Props

| Name           | Type                      | Required | Default | Description                                                                                                      |
| -------------- | ------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| `header`       | `ReactNode`               | Yes      | —       | Top bar (typically a ShellHeader). If a React element, its onMenuClick/menuExpanded are bound to the nav toggle. |
| `nav`          | `ReactNode`               | No       | —       | Side navigation (typically a SideNav). Fills full height and scrolls internally.                                 |
| `children`     | `ReactNode`               | Yes      | —       | Main content, rendered inside the single scroll container.                                                       |
| `footer`       | `ReactNode`               | No       | —       | Optional footer pinned below the content area.                                                                   |
| `open`         | `boolean`                 | No       | —       | Controlled nav open/visible state. Omit for uncontrolled.                                                        |
| `defaultOpen`  | `boolean`                 | No       | —       | Initial open state when uncontrolled. Defaults open on desktop, closed on small screens.                         |
| `onOpenChange` | `(open: boolean) => void` | No       | —       | Fired when the nav requests open/close (burger, Escape, scrim).                                                  |

## Tokens

- `--cascivo-shell-aside-inline-size`
- `--cascivo-shell-panel-inline-size`
- `--cascivo-motion-emphasis`
- `--cascivo-z-raised`
- `--cascivo-z-overlay`
- `--cascivo-color-foreground`
- `--cascivo-color-background`

## Examples

### Header + SideNav + content

The burger in ShellHeader toggles the SideNav automatically.

```jsx
<AppShell header={<ShellHeader brand={{ name: 'Acme' }} />} nav={<SideNav items={items} />}>
  <h1>Dashboard</h1>
</AppShell>
```

### Controlled open

```jsx
<AppShell header={header} nav={nav} open={open.value} onOpenChange={(v) => (open.value = v)}>
  …
</AppShell>
```
