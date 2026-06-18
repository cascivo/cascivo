# Cascivo — Feedback & Improvement Notes

Feedback collected while migrating `apps/web` from shadcn/ui + Tailwind to
Cascivo (`@cascivo/react` `0.1.0`, `@cascivo/themes` `0.1.0`,
`@cascivo/tokens` `0.1.0`). Build stack: Astro 5 + React 19 + Vite 6 +
pnpm workspaces.

Ordered roughly by impact. Each item lists what happened, the evidence, and a
suggested fix.

---

## 🔴 Blockers / Bugs

### 1. Broken CSS export — `styles.css` points at a non-existent file
**This blocked the build and required a patch to ship.**

`@cascivo/react/package.json` declares:

```jsonc
"exports": {
  "./styles.css": "./dist/cascade.css"   // ← file does not exist
}
```

…but the file actually shipped in `dist/` is `cascivo.css`. There is no
`cascade.css`.

- With Vite 6 (and any modern bundler that enforces the `exports` map
  strictly), `@import "@cascivo/react/styles.css"` fails hard:
  ```
  [postcss] Missing "./dist/cascivo.css" specifier in "@cascivo/react" package
  ```
- Importing the real path directly (`@cascivo/react/dist/cascivo.css`) *also*
  fails under strict exports, because the `exports` map blocks any subpath not
  explicitly listed.

**Workaround we had to apply** (committed as `patches/@cascivo__react.patch`):

```diff
- "./styles.css": "./dist/cascade.css"
+ "./styles.css": "./dist/cascivo.css"
```

**Fix:** correct the `exports` map to point at `./dist/cascivo.css` (or rename
the emitted file to `cascade.css` — pick one, see #2). This is a one-line fix
that removes the need for every consumer on a strict bundler to patch the
package.

### 2. Incomplete "cascade" → "cascivo" rename (root cause of #1)
The packages were clearly renamed from **cascade** to **cascivo**, but the
rename is only half-done. Leftover "cascade" references:

- `dist/index.js` and the JSDoc in `index.d.ts`: *"the prebuilt distribution of
  every **cascade** component … import '@cascivo/react/styles.css'"*
- CSS cascade layers are named `@layer cascade.component` and
  `@layer cascade.theme` (in both `cascivo.css` and the theme files)
- The broken export pointing at `cascade.css`

**Fix:** decide on one brand string and sweep the whole monorepo. The mixed
naming is what produced the export typo in #1, and the layer names (#5) leak
the old brand into consumers' CSS.

---

## 🟠 Packaging & Developer Experience

### 3. Three separate CSS imports required, with duplicated token loading
To get a working themed setup we needed:

```css
@import "@cascivo/react/styles.css";
@import "@cascivo/themes/light";
@import "@cascivo/themes/dark";
```

Two friction points:

1. **No single entry point.** There's no `@cascivo/react/styles.css` that also
   pulls a default theme, and no "all themes" bundle. A newcomer has to know to
   import the component CSS *and* at least one theme *and* that themes live in a
   different package.
2. **Tokens are imported twice.** Both `themes/light.css` and `themes/dark.css`
   start with `@import '@cascivo/tokens';`. Importing both (the normal case for
   light+dark support) pulls the entire token layer in twice. Bundlers dedupe
   identical `@import`s by URL, but it's fragile and wasteful.

**Suggested fixes:**
- Ship a convenience bundle, e.g. `@cascivo/themes/all` or a documented
  "import tokens once, then each theme" pattern.
- Have themes assume tokens are already present (or guard the import) so
  light+dark don't double-load `@cascivo/tokens`.

### 4. Type definitions leak the internal monorepo layout
The published types resolve through deeply nested, source-tree-shaped paths:

```
dist/index.d.ts
  └─ export * from './types/packages/react/src/index'
       └─ export * from '../../components/src/button/button'
```

So a consumer's "Go to definition" lands in
`dist/types/packages/components/src/button/button.d.ts`. It works, but it
exposes `packages/components/src/...` internals and makes the published surface
look like a leaked build dir. A flattened/rolled-up `.d.ts` (e.g. via
`tsc` + API-extractor or `dts-bundle`) would be cleaner and faster to resolve.

---

## 🟡 Design Tokens

### 5. Component CSS ships inside a named cascade layer — document the override story
Components are emitted under `@layer cascade.component` and theme vars under
`@layer cascade.theme`. This is a reasonable, modern choice, **but it has a
big, undocumented consequence**: any *unlayered* CSS in the consuming app
always beats Cascivo's component styles, regardless of selector specificity.

We benefited from this (our `landing-*`, `fv-*`, `app-stat-*` classes override
cleanly), but it's a footgun if you don't know it — and the layer name still
says `cascade`, not `cascivo` (see #2).

**Fix:** document the layer name and the recommended `@layer` ordering for
consumers, and rename the layer to `cascivo.*`.

### 6. `--cascivo-font-sans` is defined but never applied to `html`/`body`
**This caused a visible bug:** our landing page rendered in Times New Roman
while the app shell rendered in the expected sans-serif.

`@cascivo/tokens` defines the font tokens…

```css
--cascivo-font-sans:
  ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--cascivo-font-mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
```

…but **nothing in the tokens, themes, or component CSS ever applies
`font-family: var(--cascivo-font-sans)` to a base element** (`html`/`body`).
Each component sets its own font internally, so anything *built from Cascivo
components* looks correct, but any plain markup the consumer writes (our
landing/privacy/terms pages, headings, raw text) falls through to the browser
default — which is a serif (Times New Roman). The result is two different fonts
in the same app depending on whether a region is component-heavy or
markup-heavy.

This is a subtle trap: importing the component CSS + a theme *looks* like a
complete setup, so you don't realize the base font was never set until you put
plain text next to a component.

**Workaround** (applied in our `global.css`):

```css
body {
  font-family: var(--cascivo-font-sans);
}
```

**Fix:** have the theme (or a `@layer cascivo.base`/reset) set
`font-family: var(--cascivo-font-sans)` on `html`/`body` and a sane base
`line-height`/`color`. A design system that ships a font token should also
ship the one rule that activates it, so consumers get consistent typography
out of the box.

### 7. Duplicate / overlapping semantic color tokens with no documented canonical
The light theme defines multiple names for what appear to be the same role:

| Concept    | Token A                         | Token B                              |
|------------|---------------------------------|--------------------------------------|
| Page bg    | `--cascivo-color-background`    | `--cascivo-color-bg`                 |
| Body text  | `--cascivo-color-foreground`    | `--cascivo-color-text`               |
| Danger     | `--cascivo-color-destructive`   | `--cascivo-color-error`              |
| On-accent  | `--cascivo-color-accent-foreground` | `--cascivo-color-accent-content` |
| On-success | `--cascivo-color-success-foreground` | `--cascivo-color-success-content` |

When writing custom CSS against the tokens, it's genuinely unclear which is
canonical and which is a legacy alias — we had to guess (and standardized on
`--cascivo-color-foreground` / `--cascivo-color-text-muted` /
`--cascivo-color-destructive`). There are also "muted" variants spread across
`-muted`, `-subtle`, and `-text-muted` without an obvious system.

**Fix:** publish a token reference table that marks the canonical name for each
role and explicitly flags aliases (or drop the aliases). A machine-readable
token manifest (JSON) would let consumers build typed helpers and autocomplete.

### 8. No exported list / autocomplete for CSS custom properties
Because the design system is "CSS-native," a lot of real work happens by
referencing `--cascivo-color-*` variables directly in app CSS. There's no
`.d.ts`, JSON, or docs page enumerating them, so it's discover-by-grepping the
theme files. We grepped `node_modules` to find the ~50 color tokens. A
published token list (and spacing/radius/typography tokens too) would remove a
lot of guesswork.

---

## 🟢 Components & API

### 9. Component discoverability vs. hand-rolling
`@cascivo/react` exports ~115 components — including a fully featured
`DataTable` (sorting, pagination, selection, expandable rows, virtualization)
and `EmptyState`, `Stat`, `CommandMenu`, etc. We didn't discover several of
these until late and hand-rolled equivalents (e.g. the FileViewer table) before
realizing a built-in existed.

This is partly on us, but a **component index / "what exists" cheat sheet** in
the README (even just the categorized export list) would meaningfully speed
adoption. Right now the only way to enumerate components is reading
`dist/types/.../index.d.ts`.

### 10. Component prop ergonomics — generally good
Positive note: the props we used were clean and idiomatic React.
- `Button`: `variant: 'primary' | 'secondary' | 'ghost' | 'destructive'`,
  `size`, `loading`, and it spreads `ButtonHTMLAttributes`. 👍
- `Textarea`: built-in `label` / `hint` / `error` / `resize` — nice, removed
  boilerplate we had with shadcn.

One small naming heads-up for migrators: Cascivo's Button variants are
`primary/secondary/ghost/destructive`, **not** shadcn's
`default/outline/secondary/ghost/destructive`. There's no `outline` variant.
A short "migrating from shadcn" mapping table would help.

### 11. `SideNav` has no built-in sticky / full-height behavior
`SideNav` styles itself with `min-block-size: 100%` and `overflow: hidden auto`
— i.e. it expects to *fill a height-constrained parent and scroll internally*.
But it never establishes that height context itself: there's no
`position: sticky`, no `height: 100dvh`, and no app-shell wiring. So out of the
box, in a normal document-flow layout, the whole page scrolls and the sidebar
scrolls away with the content.

To get the obvious, expected behavior (sidebar stays fixed full-height, only the
main content scrolls) the consumer has to build the entire shell scaffolding by
hand:

```css
.app-shell { height: 100dvh; overflow: hidden; display: flex; flex-direction: column; }
.app-body  { flex: 1; min-height: 0; overflow: hidden; display: flex; }
.app-main  { flex: 1; overflow-y: auto; }      /* only this scrolls */
/* SideNav's parent stretches full height via flex; SideNav fills + scrolls internally */
```

A nasty corollary: `min-block-size: 100%` actively *defeats* the SideNav's own
`overflow: hidden auto`. Because it's a *min* (not a fixed/`max` height), a long
nav list grows the SideNav past its parent instead of scrolling — so the bottom
entries become unreachable and the internal scrollbar never appears. The
consumer has to *override* the library's own rule to make the library's own
scroll work, e.g. constrain the SideNav in a flex column:

```css
.side-nav-wrapper > * { flex: 1 1 auto; min-height: 0; }  /* cancels min-block-size:100% */
```

This is exactly backwards from what you'd expect — a component that ships
`overflow: hidden auto` should also ship the height constraint that makes it
fire, or use `height: 100%` / `max-block-size` instead of `min-block-size`.

Since Cascivo also ships `ShellHeader` and `SideNav` as a matched pair, this
"app shell" layout is clearly the intended use case — yet the glue that makes
them sit together correctly (sticky header, fixed full-height sidebar, single
scroll container) isn't provided.

**Fix:** either (a) ship an `AppShell`/`Shell` layout component that wires
`ShellHeader` + `SideNav` + content into the correct scroll/sticky structure, or
(b) give `SideNav` an opt-in `sticky` / full-height mode, or at minimum
(c) document the required shell CSS. Right now every consumer reinvents it (and
can easily get the `min-height: 0` flex-scroll trick wrong).

A related gap: there's no built-in **toggle/collapse wiring between
`ShellHeader`'s menu button and `SideNav`**. `ShellHeader` exposes
`onMenuClick`/`menuExpanded` and renders the burger on *all* breakpoints (no
responsive hiding), but it's entirely up to the consumer to translate that into
showing/hiding the sidebar. We had to manage a `sidebarOpen` state ourselves and
hide the sidebar via our own `.closed` class on desktop *and* drive the mobile
drawer + overlay. A first-class "the header button controls the side nav"
binding (or the AppShell from above) would remove a surprising amount of
boilerplate and the easy-to-miss desktop case.

### 12. `SideNav` show/hide has no animation
Following from #11: because the library provides no open/close mechanism for the
sidebar, there is also **no enter/exit animation** when the burger toggles it.
The naive consumer implementation (`display: none` ↔ block, which is what we
started with) can't be transitioned at all, so the sidebar just pops in and out.

To get a smooth collapse we had to re-implement the animation by hand, and it's
genuinely fiddly:
- desktop: animate the wrapper's `width` between the SideNav's width and `0`
  with `overflow: hidden`, pinning the SideNav to its own width so its contents
  are clipped (slide away) rather than reflowed,
- mobile: a `transform: translateX(-100%)` drawer slide plus an overlay fade,
- driving both off `--cascivo-motion-emphasis` so it honours
  `prefers-reduced-motion`,
- and toggling `inert` on the hidden wrapper to keep the clipped/off-screen nav
  out of the tab order and a11y tree (the thing `display: none` gave us for
  free).

A real footgun worth flagging: the popular `grid-template-columns: 1fr → 0fr`
collapse trick **does not work for the side nav**, because the wrapper is a
shrink-to-fit flex item (auto width) in the app-body row — `fr` units have no
definite size to resolve against, so the track never animates and the sidebar
simply stops collapsing. (Cascivo uses `grid-template-rows: 0fr` internally for
accordions/groups, which *does* work there because those containers have a
definite width.) We hit exactly this and had to fall back to explicit `width`
animation. This is the kind of sharp edge a library-owned solution would absorb.

A related constraint: an explicit-width collapse is incompatible with `SideNav`'s
own **rail** collapse (`showCollapseToggle`), since rail mode changes the
SideNav's width out from under the fixed-width wrapper and leaves a gap. We had
to drop `showCollapseToggle` and let the header burger be the single collapse
control. So today the two collapse affordances Cascivo offers (full hide vs.
rail) can't easily coexist in a consumer-built shell.

Notably, Cascivo *already* animates the rail collapse
(`transition: inline-size var(--cascivo-motion-emphasis)` on the root), so the
motion vocabulary exists — it just isn't wired to a full show/hide.

**Fix:** whatever form the open/close API from #11 takes (an `AppShell`, a
`SideNav` `open`/`collapsed` prop, or header↔nav binding), it should ship the
animated transition (and the `inert`/focus handling) with it, reusing the
existing `--cascivo-motion-*` tokens — and it should reconcile full-hide vs.
rail collapse so both modes are usable together. Consumers shouldn't have to
discover that the `grid 1fr→0fr` trick silently fails on an auto-width sidebar.

### 13. README is essentially empty
`node_modules/@cascivo/react/README.md` has no usage example, no install
snippet, and no CSS-import instructions — which is exactly the information that
would have prevented blocker #1 (knowing the correct `styles.css` import) and
#3 (the theme imports). Even a 20-line quickstart would cover the 80% case.

---

## Summary of concrete asks

1. **Fix the `exports` typo** (`cascade.css` → `cascivo.css`) — unblocks strict
   bundlers without a patch. *(highest priority)*
2. Finish the **cascade → cascivo rename** (JS strings, JSDoc, `@layer` names).
3. Provide a **single-import / documented theming path**; stop double-loading
   `@cascivo/tokens`.
4. **Flatten published `.d.ts`** so types don't expose `packages/.../src`.
5. **Document the cascade layer** behavior and rename the layer.
6. **Apply `--cascivo-font-sans` to `html`/`body`** in a base layer so the
   shipped font token actually takes effect for plain markup.
7. **Publish a token reference** (canonical names + aliases + a JSON manifest).
8. Ship an **`AppShell` layout** (or sticky/full-height mode for `SideNav` plus
   header↔side-nav toggle wiring) so the `ShellHeader` + `SideNav` pair sits in
   the correct scroll/sticky structure without consumer boilerplate — including
   the **animated show/hide transition and `inert`/focus handling**, reusing the
   existing `--cascivo-motion-*` tokens.
9. Add a **component index** and a **quickstart README** with the correct CSS
   imports and a shadcn→Cascivo variant mapping.

Overall: once past the packaging papercuts (#1–#4), the actual component and
token API was pleasant to work with and let us delete a large amount of
Tailwind/shadcn boilerplate. The issues above are mostly distribution/docs
polish, not design problems.
