# Cookbook: Using cascivo in u11g.com

A practical, recipe-style guide for adopting **cascivo** on
[u11g.com](https://u11g.com) — the dark, monospace, phosphor-green
"modern mainframe" site — **without changing its design**.

The strategy throughout: cascivo's built-in **`terminal` theme** already _is_
u11g's aesthetic (phosphor green on near-black, monospace, zero radius, green
glow). You adopt components, point them at that theme, and override a handful of
tokens to lock in the exact look. No redesign.

---

## 0. TL;DR

```sh
# 1. Init cascivo in the project
npx cascivo init

# 2. Pull in the components u11g uses
npx cascivo add command-menu side-nav app-shell stat kbd card badge \
  toggle link code status separator

# 3. Apply the terminal theme on <html> (or any container)
#    <html data-theme="terminal">

# 4. Fine-tune to match u11g exactly with a thin theme override (Recipe 3)
```

Two consumption models — pick one:

| Model | How | Best for |
|---|---|---|
| **Copy-paste (owned)** | `npx cascivo add <name>` writes source into your repo | You want to own/tweak the markup (shadcn model) |
| **Prebuilt library** | `pnpm add @cascivo/react` + `import { Button } from '@cascivo/react'` | You want a normal dependency, no source in-repo |

u11g is a personal site with a strong custom identity → **copy-paste is the
recommended model** so you can lean into the terminal motifs.

---

## 1. Recipe: Install & initialize

```sh
# Themes + core are real npm packages (always needed)
pnpm add @cascivo/themes @cascivo/core

# Optional icon set (for social links, nav glyphs)
pnpm add @cascivo/icons

# Initialize component config (creates the cascivo config + target dir)
npx cascivo init
```

Other CLI commands you'll use (all confirmed in `packages/cli`):

```sh
npx cascivo list                 # list every available component
npx cascivo search <query>       # find a component by name/tag
npx cascivo view <component>     # print a component's manifest (props, tokens, a11y)
npx cascivo add <component...>   # copy source into your project
npx cascivo theme                # theme tooling
npx cascivo tokens               # inspect/emit design tokens
npx cascivo update <component>   # pull upstream changes for an added component
npx cascivo doctor               # sanity-check the setup
```

---

## 2. Recipe: Turn on the terminal theme (the whole design, for free)

cascivo ships `terminal.css` — described in-repo as _"Developer/CLI, phosphor
green on near-black, zero radius, green glow."_ That is u11g's look.

**Step 1 — import the base tokens + the terminal theme once, at the app root:**

```ts
// e.g. src/main.tsx or your global stylesheet entry
import '@cascivo/themes/base.css'      // primitive tokens (required)
import '@cascivo/themes/terminal.css'  // the terminal semantic theme

// If using the prebuilt distribution, also:
import '@cascivo/react/styles.css'     // component CSS (skip if copy-pasting)
```

**Step 2 — apply it on any container.** Put it on `<html>` for the whole site:

```html
<html lang="en" data-theme="terminal">
```

Themes override the **semantic** token layer only, so this re-skins every
cascivo component at once. What you get out of the box:

- Accent: bright phosphor green `oklch(0.82 0.2 145)`
- Background: near-black green-tinted `oklch(0.17 0.01 150)`
- Display font mapped to the mono stack (`--cascivo-font-display: var(--cascivo-font-mono)`)
- Radius `0` everywhere (buttons, cards, inputs, badges, modals)
- Flat surfaces, green glow on overlays

> Alternates if you want a different starting point: `cyberpunk`, `midnight`,
> `brutalist`, `arcade` — same `data-theme="<name>"` switch.

---

## 3. Recipe: Match u11g _exactly_ with a thin override theme

The built-in `terminal` theme gets you ~95% there. To pin the exact u11g accent
hue, font, and glow, extend it — **don't fork it**. Override only the semantic
tokens you care about; everything else inherits.

```css
/* u11g-theme.css — import AFTER terminal.css */
@layer cascivo.theme {
  [data-theme='terminal'] {
    /* Swap in u11g's exact monospace stack */
    --cascivo-font-mono: 'Berkeley Mono', 'JetBrains Mono', ui-monospace, monospace;

    /* Tune the green to u11g's precise accent (edit the oklch to taste) */
    --cascivo-color-accent: oklch(0.85 0.21 150);
    --cascivo-color-accent-hover: oklch(0.90 0.19 150);
    --cascivo-color-primary: var(--cascivo-color-accent);

    /* Optionally deepen the background toward true black */
    --cascivo-color-background: oklch(0.14 0.008 150);

    /* Strengthen the phosphor glow on overlays/popovers */
    --cascivo-shadow-overlay:
      0 0 0 1px oklch(0.85 0.21 150 / 0.4),
      0 4px 32px oklch(0.85 0.21 150 / 0.12);
  }
}
```

```ts
import '@cascivo/themes/base.css'
import '@cascivo/themes/terminal.css'
import './u11g-theme.css'   // your overrides win (same layer, later import)
```

To discover which tokens a given component reads (so you know what's
overridable), run `npx cascivo view <component>` — the manifest lists its
`tokens`. The CRT/scanline texture and animated mainframe motifs stay as your
own CSS on top; cascivo won't fight them.

---

## 4. Recipe: ⚠️ React apps must subscribe to signals

This is the #1 gotcha. cascivo is signal-driven, and a plain React app (Vite /
Next) gets **no signals Babel transform**. Any component that reads a signal
during render must call `useSignals()` first, or interactive UI silently freezes
(toggles that don't toggle, the command menu that won't open).

```tsx
import { useSignals } from '@cascivo/core'

export function Header() {
  useSignals() // ← first statement, always
  // ...rest of the component
}
```

If u11g is built with Preact, signals are natively reactive and this isn't
needed. For a React/Next build, add it to any component holding cascivo
interactive state.

---

## 5. Recipe: Map every u11g element to a component

Each row is a real component (`npx cascivo add <name>`):

| u11g element | cascivo component |
|---|---|
| `⌘K` command palette | `command-menu` + `kbd` |
| Sidebar / nested ROOT→NAVIGATE menu | `app-shell` + `side-nav` |
| Collapsible menu sections | `accordion` or `collapsible` |
| CPU / MEM / NET dashboard widgets | `stat` (and `status` / `indicator`) |
| Project cards (date + title) | `card` (or `tile` / `item`) |
| Year badges (`2025 PROJECT`) | `badge` or `tag` |
| Theme toggle switch | `toggle` (or `swap`) |
| Social icon links | `link` / `icon-button` + `@cascivo/icons` |
| Terminal command text | `code` / `code-snippet` |
| `LIVE_FEED` status dot | `status` / `indicator` |
| Section dividers | `separator` |

---

## 6. Recipe: The ⌘K command palette

`CommandMenu` has built-in hotkey handling, fuzzy search, and nested pages.

```tsx
import { useSignal, useSignals } from '@cascivo/core'
import { CommandMenu } from '@cascivo/react' // or your copied path

export function U11gCommandMenu() {
  useSignals()
  const open = useSignal(false)

  return (
    <CommandMenu
      open={open.value}
      onOpenChange={(v) => (open.value = v)}
      hotkey                    // binds ⌘K / Ctrl-K automatically
      placeholder="INIT_COMMAND_SEQUENCE…"
      emptyLabel="NO_MATCH"
      groups={[
        {
          heading: 'NAVIGATE',
          items: [
            { id: 'blog', label: 'Blog', shortcut: ['B'], onSelect: () => location.assign('/blog') },
            { id: 'work', label: 'Work history', onSelect: () => location.assign('/work') },
            { id: 'projects', label: 'Projects', onSelect: () => location.assign('/projects') },
          ],
        },
        {
          heading: 'SOCIAL',
          items: [
            { id: 'gh', label: 'GitHub', onSelect: () => open('https://github.com/...') },
            { id: 'x', label: 'X', onSelect: () => open('https://x.com/...') },
          ],
        },
      ]}
    />
  )
}
```

Render the trigger hint with `Kbd`:

```tsx
import { Kbd } from '@cascivo/react'
// <span>Press <Kbd>⌘</Kbd> <Kbd>K</Kbd></span>
```

---

## 7. Recipe: Shell + sidebar navigation

`AppShell` composes a sticky header + full-height nav + single scroll container,
and auto-wires the header burger to the nav. Below `lg` (64rem) the nav becomes
an overlay drawer — mobile handled for free.

```tsx
import { AppShell, SideNav, ShellHeader } from '@cascivo/react'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      header={<ShellHeader title="u11g // MODERN MAINFRAME" />}
      nav={
        <SideNav
          ariaLabel="ROOT"
          showCollapseToggle
          groups={[
            {
              label: 'NAVIGATE',
              items: [
                { label: 'Blog', href: '/blog', active: true },
                {
                  label: 'Projects',
                  items: [
                    { label: '2025 — Foo', href: '/p/foo' },
                    { label: '2021 — Bar', href: '/p/bar' },
                  ],
                },
                { label: 'Work', href: '/work' },
              ],
            },
          ]}
        />
      }
    >
      {children}
    </AppShell>
  )
}
```

---

## 8. Recipe: The CPU / MEM / NET dashboard widgets

`Stat` takes `label`, `value`, optional `delta` + `trend` (`up | down | flat`).

```tsx
import { Stat } from '@cascivo/react'

export function SystemBar() {
  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <Stat label="CPU" value="14%" trend="up" delta="+2%" />
      <Stat label="MEM" value="2.1G" trend="flat" />
      <Stat label="NET" value="38ms" trend="down" delta="-5ms" />
    </div>
  )
}
```

Pair with `status` / `indicator` for the `LIVE_FEED` dot, and `separator`
between sections.

---

## 9. Recipe: Project cards, badges, theme toggle

```tsx
import { Card, Badge, Toggle, Link } from '@cascivo/react'

// Project card with a year badge
<Card>
  <Badge>2025 PROJECT</Badge>
  <h3>ACCESS_GRANTED</h3>
  <Link href="/p/access">OPEN ▸</Link>
</Card>

// Interface switch (the "Switch Interface ACTION" toggle).
// Toggling data-theme is what actually swaps the look.
function ThemeSwitch() {
  useSignals()
  const dark = useSignal(true)
  return (
    <Toggle
      checked={dark.value}
      onCheckedChange={(v) => {
        dark.value = v
        document.documentElement.dataset.theme = v ? 'terminal' : 'light'
      }}
      label="Switch Interface"
    />
  )
}
```

---

## 10. Recipe: Keep your CRT / mainframe flourishes

cascivo styles components via tokens; it doesn't own your page chrome. So your
signature effects stay 100% custom and layer on top without conflict:

- Scanline / CRT overlay → your own `::after` gradient on `<body>`
- Animated boot sequence / `INIT_BLOG_SEQUENCE` typing → your own JS/CSS
- ASCII art, section numbering (`08`, `010`, …) → your own markup

cascivo handles the _interactive, accessible_ widgets (palette, nav, inputs,
cards, stats); you keep the soul of the site.

---

## 11. Pre-ship checklist

- [ ] `@cascivo/themes/base.css` imported **before** any theme.
- [ ] `data-theme="terminal"` on `<html>` (+ your `u11g-theme.css` override loaded after).
- [ ] React build: every interactive cascivo component calls `useSignals()` first.
- [ ] No `useState`/`useEffect`/`useContext` introduced in copied components (cascivo rule — use signals).
- [ ] Mobile sweep at 320/360/390/414 — nav drawer + touch targets OK (AppShell handles this).
- [ ] `npx cascivo doctor` passes.

---

## Appendix: Why this works without a redesign

cascivo is built for exactly this: **theming via `data-theme` + CSS custom
properties, no Tailwind, no CSS-in-JS.** The `terminal` theme matches u11g's
identity by default, every widget on the page already exists as a component, and
copied components are _owned_ by you — so the retro-mainframe character is
preserved while you gain accessible, signal-driven, responsive building blocks.
