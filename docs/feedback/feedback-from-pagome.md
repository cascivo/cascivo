# Feedback for cascivo — from a real Preact migration

Context: we migrated a production Preact 10 PWA (Vite, TypeScript strict,
`exactOptionalPropertyTypes`, Biome) to cascivo `@cascivo/react@0.2.1` /
`@cascivo/themes@0.2.2` / `@cascivo/tokens@0.2.0`, themed to a custom brand
(emerald accent, warm neutrals, DM Sans/Mono). Everything works and we're happy
with the result — the notes below are the friction we hit, ordered roughly by
impact, so you can smooth the path for the next team.

Versions evaluated: `@cascivo/react@0.2.1`, `@cascivo/themes@0.2.2`,
`@cascivo/tokens@0.2.0`, `@cascivo/core@0.1.1`.

---

## 1. Packaging / dependency bugs (highest impact)

### 1.1 `@cascivo/themes` is missing its dependency on `@cascivo/tokens`
`@cascivo/themes` ships CSS that does `@import '@cascivo/tokens';` (in
`light.css`, `dark.css`, every theme, and `all.css`), but `@cascivo/themes`
declares **no dependencies** in its `package.json`. So a consumer who installs
only `@cascivo/themes` gets an unresolvable `@import` at build time. We only
discovered we needed `@cascivo/tokens` by reading the theme source.

**Fix:** add `@cascivo/tokens` to `dependencies` of `@cascivo/themes` (or
`peerDependencies` with a clear version range). Same audit is worth running on
every package that `@import`s another `@cascivo/*` package.

### 1.2 `@cascivo/react/styles.css` contains components but no tokens or theme
`styles.css` is `@layer cascivo.component { … }` only. It defines **no**
primitive tokens, **no** semantic color tokens, and **no** default theme. Every
class references `var(--cascivo-…)` values that don't exist unless you *also*
pull in `@cascivo/tokens` + a theme.

This isn't wrong, but it's surprising and undocumented. A first-time consumer who
imports `@cascivo/react/styles.css` (the obvious thing to do) gets structurally
correct but completely unstyled/uncolored components and no error explaining why.

**Suggestions:**
- Document the required import set prominently in the `@cascivo/react` README
  ("you MUST also import a theme + tokens, in this order").
- Consider a single convenience entry, e.g. `@cascivo/react/styles.css` that
  `@import`s tokens + a default light/dark theme, with an opt-out for people who
  want to bring their own.

### 1.3 The documented/expected import list is incomplete
A migration guide we were following suggested:
```
import '@cascivo/react/styles.css';
import '@cascivo/themes/base.css';
import './my-theme.css';
```
That renders unthemed because tokens + a color theme are never imported. The set
that actually works:
```
import '@cascivo/react/styles.css';   // components
import '@cascivo/themes/light.css';   // @imports @cascivo/tokens + light colors
import '@cascivo/themes/dark.css';    // dark colors
import '@cascivo/themes/base.css';    // html base
import './my-theme.css';              // brand overrides (must come last)
```
Please make the canonical, minimal, correct import order a top-level section of
the docs.

### 1.4 `@cascivo/layouts` appears unpublished
A guide referenced `@cascivo/layouts` (Stack/Grid/etc.), but it's not on npm. We
worked around it (`Stack` is exported from `@cascivo/react` anyway), but the
docs/guides reference a package that doesn't exist. Either publish it or scrub
the references.

---

## 2. Theming gaps

### 2.1 No `--cascivo-text-4xl`
`@cascivo/tokens` defines the type scale up through `text-3xl` but components/use
sites reference `--cascivo-text-4xl`, which is undefined. We had to add it in our
theme. Either define it in tokens or stop referencing it.

### 2.2 Theme override specificity is a footgun
`light.css` scopes tokens to `[data-theme='light'], :root:not([data-theme])`.
That last selector has specificity (0,2,0) — higher than a plain `:root` (0,1,0).
A brand theme that does `:root { --cascivo-color-accent: … }` silently loses to
the default theme in the no-`data-theme` (pre-hydration) state. We had to mirror
the exact selector lists and rely on `@layer` source-order to win.

**Suggestions:**
- Document the intended override pattern explicitly (same `@layer cascivo.theme`,
  same selectors, imported last).
- Consider exposing brand tokens as a thin indirection (e.g.
  `--cascivo-color-accent: var(--brand-accent, <default>)`) so consumers can
  override one variable at `:root` without fighting specificity.

### 2.3 "One knob" radius doesn't cover real brands
`--cascivo-radius-base` derives the scale, but our brand wanted control=10px,
card/surface=14px, modal=20px, badge=full — not a single multiplier family. We
ended up setting ~10 individual `--cascivo-radius-*` tokens. That's fine, but the
"one knob" framing in the source comments undersells what's needed; documenting
the full per-role radius token list as the real override surface would help.

### 2.4 Control heights are smaller than many design systems expect
Defaults are 32/40/48px (sm/md/lg). Our brand uses 36/48/56px. Easy to override
via `--cascivo-control-height-{sm,md,lg}`, but worth calling these out as
first-class theme tokens in the docs since most teams will touch them.

---

## 3. Component API gaps we hit

### 3.1 No polymorphic `Button` (`as` / `asChild` / anchor)
`Button` is `<button>`-only (`extends ButtonHTMLAttributes`). We had a
"Share via WhatsApp" link that semantically needs `<a href target rel>`.
`Link` is a text link, not a button-styled anchor, and only `IconButton` has
`asChild`. We had to convert the anchor to a `<button onClick={window.open}>`,
losing real link semantics (middle-click/open-in-new-tab, right-click menu).

**Ask:** add `asChild` (or an `as`/polymorphic `render`) to `Button`, like
`IconButton` already has. A button-styled anchor is an extremely common need.

### 3.2 `Field` + adornments (`InputGroup`) don't compose cleanly
`Field` clones a single child and injects
`{ id, 'aria-describedby', 'aria-invalid', disabled }`. `InputGroup`'s props are
`HTMLAttributes<HTMLDivElement>`, which has no `disabled`, so
`<Field><InputGroup>…</InputGroup></Field>` is a **type error** under strict TS —
and even if it compiled, the injected `id`/aria would land on the group `<div>`
rather than the inner `<input>`, breaking label association.

Meanwhile `Input` *also* renders its own label/hint/error wrapper, so
`<InputGroup><Input/></InputGroup>` double-wraps. The net effect: there's no
obvious, type-safe way to build "labeled + error + leading/trailing adornment".
We dropped our currency adornment as a result.

**Asks:**
- Document the intended composition for "field + label/error + adornment".
- Make `Field` forward injected props to the actual control through `InputGroup`
  (or have `InputGroup` accept and relay them), and make the types reflect it.

### 3.3 `Input` has no adornment slots of its own
Given 3.2, a simple `prefix`/`suffix`/`startContent`/`endContent` on `Input`
itself (like many libraries) would have been the path of least resistance.

### 3.4 `Sheet` requires `title: string`
`SheetProps.title` is required and string-typed. Our bottom-sheet had optional
titles and sometimes rich title nodes. Minor, but `title?: ReactNode` would be
friendlier.

---

## 4. Preact / `preact/compat` compatibility (it works — please keep it that way)

We run cascivo (React 19) inside a Preact app via
`@preact/preset-vite`'s `react`→`preact/compat` aliasing. **Result: it works** —
components render, signals update, interactions fire, zero runtime errors. A few
notes:

- `@cascivo/core` peer-deps `@preact/signals-react`. Under `preact/compat` the
  natural choice would be `@preact/signals`. It functioned fine with
  `@preact/signals-react@3` + compat, but a sentence in the docs confirming
  Preact support (and the recommended signals package) would remove a lot of
  uncertainty. We were genuinely unsure it would work until we smoke-tested.
- For typechecking, consumers must map `react`/`react-dom` → `preact/compat` in
  `tsconfig` `paths` (cascivo's `.d.ts` imports from `"react"`). Worth a
  "Using cascivo with Preact" docs page.
- Everything was strict-mode clean once we built small wrappers; no `any` needed.

---

## 5. TypeScript / strictness

- Under `exactOptionalPropertyTypes: true`, forwarding optional props is awkward
  because you can't pass `undefined` to an optional prop. This is on us, but
  cascivo prop types passing through `...HTMLAttributes` are otherwise pleasant
  to work with. No action required — just confirming the types hold up under the
  strictest settings.
- Exposing the prop *types* (`ButtonProps`, `InputProps`, `BadgeProps`, etc.) is
  great and we relied on them (e.g. `NonNullable<BadgeProps['variant']>` to build
  a variant map). Please keep exporting all of them.

---

## 6. Docs wishlist (summary)

1. Canonical, minimal, correct **import order** (components + tokens + theme).
2. A **"Theming / branding"** page: which tokens to override, the selector/
   specificity/`@layer` rules, and a copy-pasteable starter theme.
3. A **"Using cascivo with Preact"** page (aliasing, tsconfig paths, signals).
4. **Composition recipes**: field + label + error + adornment; split buttons;
   button-as-link.
5. Per-package dependency hygiene so each package installs standalone.

---

## What went well

- Token-driven theming meant we matched a fairly specific brand without forking a
  single component — overriding `--cascivo-*` semantic tokens was powerful.
- `@layer cascivo.{base,theme,component}` ordering made our unlayered app CSS win
  predictably; we never needed `!important`.
- The component surface is huge and the exported types are thorough.
- It runs under Preact via compat with no runtime errors — that's a big deal for
  us and worth advertising.

Thanks for the library — happy to provide a repro repo for any of the above.

---

## Resolution log (maintainers)

> Added in response to this report. ✅ fixed · 📝 documented · ⏭️ deferred (tracked).

### Packaging / dependency
- ✅ **`@cascivo/themes` → `@cascivo/tokens` dependency** → `@cascivo/themes` now
  declares `@cascivo/tokens` as a `peerDependency` so the transitive `@import`
  resolves. `COMPATIBILITY.md` notes that a standalone themes install should also
  add `@cascivo/tokens`.
- 📝 **Canonical, minimal import order** → documented in the `@cascivo/react`
  README and [`docs/COMPATIBILITY.md`](./COMPATIBILITY.md). `@cascivo/react/styles.css`
  is explicitly described as component-structure-only (no tokens/colors).
- 📝 **`@cascivo/layouts` references** → `@cascivo/layouts` is intentionally
  unpublished (`private: true`) registry/copy-paste source; the README package
  table labels it "not published." Migration cookbooks that referenced it as an
  installable package are internal notes, not the published guidance.

### Theming
- ✅ **`--cascivo-text-4xl` undefined** → added `--cascivo-text-4xl` (36px) and
  `--cascivo-text-4xl-fluid` to `@cascivo/tokens`.
- 📝 **Theme override specificity footgun** → documented in
  [`docs/THEMING.md`](./THEMING.md), including the brand-token indirection pattern
  so one knob can be set at `:root` without fighting `:root:not([data-theme])`.
- 📝 **Per-role radius + control-height as the real override surface** → documented
  as first-class brand tokens in `THEMING.md`.

### Component API
- ✅ **Polymorphic `Button` (`asChild`)** → `Button` now accepts `asChild` (same
  `Slot` mechanism as `IconButton`), so a button-styled `<a href>` keeps real anchor
  semantics. Covered by a test and a `meta` example.
- ✅ **`Sheet` required `title`** → `title` is now optional and `ReactNode`-typed;
  when present it labels the dialog via `aria-labelledby` (rich title nodes stay
  accessible). Covered by tests.
- ⏭️ **`Field` + `InputGroup` composition** and **`Input` adornment slots** →
  deferred; needs a typed prop-forwarding design through `Field`/`InputGroup` (or
  native `prefix`/`suffix` on `Input`). Tracked.

### Preact / TypeScript
- 📝 **Preact support** → confirmed and documented in
  [`docs/USING-WITH-PREACT.md`](./USING-WITH-PREACT.md) (alias, tsconfig paths,
  `@preact/signals-react`, peer deps).
- ✅ **Exported prop types hold up under `exactOptionalPropertyTypes`** → no change
  needed; the public prop types remain exported.
