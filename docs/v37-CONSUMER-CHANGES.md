# cascivo v37 — Consumer Upgrade Guide

This release ("migration hardening") fixes every issue raised in a real
shadcn/ui + Tailwind → cascivo migration. It is written so a downstream project
can act on it **without** the cascivo source: every snippet references only the
installable packages `@cascivo/react`, `@cascivo/themes`, and `@cascivo/tokens`.

**Minimum versions carrying these fixes:**

```jsonc
"@cascivo/react":  ">=0.2.0",
"@cascivo/themes": ">=0.2.0",
"@cascivo/tokens": ">=0.2.0"
```

**TL;DR — what you can now delete on your side:**

- the `patch-package` patch for `@cascivo/react` (the `styles.css` export is fixed),
- the `body { font-family: var(--cascivo-font-sans) }` workaround,
- your hand-rolled app-shell CSS + `sidebarOpen` state + drawer/overlay code,
- any `node_modules` grep notes for token names.

## ⚠️ One breaking change: CSS `@layer` rename

The shipped cascade layers were renamed from `cascade.*` to **`cascivo.*`**
(`cascivo.base`, `cascivo.theme`, `cascivo.component`). **If — and only if — you
referenced the old layer names in your own `@layer` ordering, rename them:**

```css
/* before */
@layer cascade.tokens, cascade.theme, cascade.component, app;
/* after */
@layer cascivo.base, cascivo.theme, cascivo.component, app;
```

If you never wrote `@layer cascade…` yourself, nothing to do. Recommended
ordering: `cascivo.base < cascivo.theme < cascivo.component`, and **unlayered**
app CSS still beats every cascivo layer.

---

## Per-issue: what changed / what to do

### #1 — `styles.css` export typo (blocker)

- **Changed:** `@cascivo/react`'s `exports["./styles.css"]` now resolves to the
  real emitted CSS (`./dist/cascivo.css`). Strict bundlers (Vite 6, etc.) import
  it with no patch.
- **Do:** delete your `patches/@cascivo__react.patch` and the `postinstall`/
  `patchedDependencies` wiring, then bump `@cascivo/react` to `>=0.2.0`.

  ```jsonc
  // remove from package.json
  "pnpm": { "patchedDependencies": { "@cascivo/react@0.1.0": "patches/@cascivo__react.patch" } }
  ```

### #2 / #5 — cascade→cascivo rename + layer behavior

- **Changed:** all shipped CSS uses `@layer cascivo.*`; the layer name no longer
  leaks the old brand into your stylesheet.
- **Do:** see the breaking-change callout above — rename any `@layer cascade…`
  references in your app CSS to `cascivo…`. The override story is unchanged:
  unlayered CSS wins; to override from a layer, order it after `cascivo.component`.

### #3 — Three CSS imports / tokens double-loaded

- **Changed:** `@cascivo/themes/all` loads tokens **once**, plus base typography
  and both light & dark themes. Per-theme files still self-import tokens (deduped
  by URL) for à-la-carte use.
- **Do:** replace the three-import block with the single import:

  ```diff
  - @import '@cascivo/react/styles.css';
  - @import '@cascivo/themes/light';
  - @import '@cascivo/themes/dark';
  + @import '@cascivo/react/styles.css';
  + @import '@cascivo/themes/all';
  ```

  À-la-carte still works (`@cascivo/themes/base` + the themes you need).

### #6 — base font never applied

- **Changed:** a `@layer cascivo.base` rule applies `--cascivo-font-sans` (plus a
  sane line-height/color/background) to the document root, shipped by every theme
  and by `@cascivo/themes/all` / `@cascivo/themes/base`.
- **Do:** delete the workaround from your global CSS:

  ```diff
  - body { font-family: var(--cascivo-font-sans); }
  ```

  Plain markup (headings, prose pages) now renders in the sans stack, not serif.

### #7 / #8 — token canonical names + discoverability

- **Changed:** `@cascivo/tokens` now publishes `tokens.json` (every token with
  role, value, and a canonical/alias flag) and a `CascivoToken` type union for
  editor autocomplete (`@cascivo/tokens/tokens`). A `TOKENS.md` reference marks
  the canonical name per role. No token was removed — aliases are kept and labeled.
- **Do:** stop grepping `node_modules`. Prefer the canonical names
  (`--cascivo-color-foreground`, `--cascivo-color-text-muted`,
  `--cascivo-color-destructive`); aliases (`-text`, `-bg`, `-error`, `-content`)
  still work. For tooling:

  ```ts
  import tokens from '@cascivo/tokens/tokens.json'
  import type { CascivoToken } from '@cascivo/tokens/tokens'
  ```

### #4 — types leaked the monorepo layout

- **Changed:** the published `@cascivo/react` `.d.ts` is a flat rollup; its only
  imports are externals (`@cascivo/core`, `react`). No `dist/types/packages/.../src`.
- **Do:** nothing required — "Go to definition" now stays inside the published
  surface.

### #11 / #12 — no app-shell glue, no animation

- **Changed:** `@cascivo/react` exports an `AppShell` that wires `ShellHeader` +
  `SideNav` + content into one sticky-header, full-height-nav, single-scroll-
  container layout. The header burger toggles the nav out of the box, with an
  animated (and `prefers-reduced-motion`-aware) show/hide, `inert`/focus handling,
  and a mobile drawer + scrim. `SideNav`'s internal scroll now fires (its
  `min-block-size:100%` was the bug — long nav lists scroll internally now).
  AppShell owns full show/hide; `SideNav` owns its own rail collapse — they
  compose without fighting.
- **Do:** replace your hand-rolled shell — the `.app-shell`/`.app-body`/`.app-main`
  CSS, the `sidebarOpen` state, the manual drawer/overlay, the `min-height:0` flex
  trick, and the bespoke width/translate animation — with `<AppShell>`:

  ```tsx
  // before: ~80 lines of shell CSS + a sidebarOpen useState + drawer/overlay JSX
  // after:
  import { AppShell, ShellHeader, SideNav } from '@cascivo/react'

  function Shell() {
    return (
      <AppShell
        header={<ShellHeader brand={{ name: 'Acme' }} />}
        nav={<SideNav items={navItems} />}
      >
        <YourRoutedContent />
      </AppShell>
    )
  }
  ```

  Need controlled state? Pass `open` + `onOpenChange`. The burger binding,
  animation, `inert`, focus return, Escape, and mobile drawer come for free.

### #9 / #10 / #13 — discoverability, shadcn mapping, README

- **Changed:** the `@cascivo/react` README now leads with a quickstart (correct
  CSS imports) and a categorized **component index** of everything exported.
  `MIGRATING-FROM-SHADCN.md` maps the variant/prop deltas.
- **Do:**
  - Skim the component index before hand-rolling — built-ins you may have missed
    include `DataTable` (sort/filter/paginate/select/expand), `CommandMenu`,
    `EmptyState`, `Stat`, `Combobox`, `MultiSelect`. (e.g. a custom file/results
    table → `DataTable`.)
  - Fix Button variants: shadcn `default`/`outline` → cascivo `primary`/
    `secondary`. **There is no `outline` variant.** `ghost` and `destructive` are
    the same; `link` → use the `Link` component.
  - Inputs (`Input`, `Textarea`, `Select`) take `label`/`hint`/`error` directly —
    drop the `FormField`/`FormItem` wrapper stack.

---

## Upgrade checklist

- [ ] Bump `@cascivo/react`, `@cascivo/themes`, `@cascivo/tokens` to `>=0.2.0`.
- [ ] Remove the `@cascivo/react` `patch-package` patch + its wiring (#1).
- [ ] Rename any `@layer cascade…` references in your CSS to `cascivo…` (#2/#5).
- [ ] Replace the three theme imports with `@cascivo/themes/all` (#3).
- [ ] Delete the `body { font-family }` workaround (#6).
- [ ] Switch hand-picked token names to the canonical ones; wire `tokens.json` /
      the `CascivoToken` type if you build token tooling (#7/#8).
- [ ] Replace the hand-rolled shell with `<AppShell>` (#11/#12).
- [ ] Swap Button `default`/`outline` → `primary`/`secondary`; drop input
      `FormField` wrappers (#10).
- [ ] Re-check the component index for built-ins before hand-rolling (#9).

> Tip: copy this file into your repo as `UPGRADING-cascivo-v37.md` and tick the
> boxes as you go.
