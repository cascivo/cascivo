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
- You need a persisted collapsible sidebar, a top progress bar, or a right aside — that is the richer copy-paste `layout/app-shell` (different props: `sideNav`/`aside`/`persistKey`/`state`), not this drop-in.

## Anti-patterns

### fr units have no definite size to resolve against on a shrink-to-fit flex item, so the track never animates

**Bad:** `Animating the nav collapse with grid-template-columns: 1fr → 0fr on an auto-width sidebar`  
**Good:** `AppShell animates an explicit inline-size (desktop) / transform (mobile drawer)`  
**Why:** fr units have no definite size to resolve against on a shrink-to-fit flex item, so the track never animates

## Related components

- **layout/app-shell** (alternative): A richer, copy-paste-only app shell with a persisted collapsible sidebar, a signal-driven top progress bar, an error strip, and a right aside. Same `AppShell` name, different prop surface (`sideNav`/`aside`/`persistKey`/`state`). Choose this npm drop-in for a simple header + toggleable nav; choose layout/app-shell when you need persistence/progress/aside.
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

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo AppShell component (layout). Sticky-header + full-height side-nav + single-scroll-container layout with an animated, accessible nav toggle.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

AppShell is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-shell-aside-inline-size, --cascivo-shell-panel-inline-size, --cascivo-motion-emphasis, --cascivo-z-raised, --cascivo-z-overlay, --cascivo-color-foreground, --cascivo-color-background

Accessibility: role "none", WCAG 2.2-AA, keyboard: Escape. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
