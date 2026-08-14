<!--
  Generated from docs/ — do not edit here; run `pnpm regen`.
  Canonical: https://cascivo.com/docs/ai-rules.md
  registry v0.17.0 · generated 2026-08-11
-->

# AI rules for building with cascivo

Drop this into your AI agent's system prompt, Cursor rules (`.cursor/rules`), or
`AGENTS.md` / `CLAUDE.md` so it generates CSS that keeps cascivo's cascade intact.
`cascivo create` scaffolds an `AGENTS.md` with the same contract automatically; this
page is for **existing** projects.

## The CSS layer contract (copy-paste)

```md
## cascivo CSS layer contract

cascivo styles live in CSS cascade layers. Layer order beats selector specificity, so
follow these rules whenever you generate or edit CSS:

1. Every declaration goes inside an `@layer` block. Unlayered CSS beats all layers
   regardless of specificity — never emit it.
2. Never invent layer names. Write only: your app's own slot for page/app styles, and
   `@layer cascivo.override { … }` for hotfixes / one-off overrides — it beats
   everything cascivo ships. Your app slot goes **between `cascivo.blocks` and
   `cascivo.override`** in the order statement below (rename `cascivo.myapp` after your
   app) — high enough to beat cascivo's components, themes and blocks, low enough to
   leave `cascivo.override` as the escape hatch.
3. Never nest layers deeper than the shipped `cascivo.blocks.<name>` pattern. For
   sub-elements (a badge in a card, a dot in a badge) use native CSS nesting inside one
   layer block, not new sublayers.
4. Third-party CSS: `@import url('lib/styles.css') layer(vendor);` with `vendor`
   declared before the cascivo layers. Don't import vendor CSS from JavaScript — route
   it through a CSS file, or use `@cascivo/vite-plugin` (`cascivoLayers`) to layer it.
5. Style with `--cascivo-*` tokens, not raw values.

Canonical layer order (lowest → highest priority):
`@layer vendor, cascivo.reset, cascivo.base, cascivo.tokens, cascivo.component, cascivo.platform, cascivo.theme, cascivo.blocks, cascivo.myapp, cascivo.override;`

The full machine-readable guide is at https://cascivo.com/llms.txt.
```

## The reactivity contract (copy-paste)

The CSS contract above keeps the cascade intact; this one keeps the reactivity model
intact. Drop it into the same agent rules file. Without it, an agent defaults to
`useState`/`useEffect`/`useContext` and concludes cascivo "has no state story" — the exact
mistake that makes a signal-native system look layout-only.

```md
## cascivo reactivity contract

cascivo is signal-driven. Do not mix React state with signals — it causes toggles that
don't toggle and UIs that freeze. Reach for the cascivo primitive, not the React hook.

**Import every primitive below from `@cascivo/react`** if you installed the prebuilt
package, or from `@cascivo/core` if you copied component source in with the CLI. Never add
`@cascivo/core` to a prebuilt-path app's package.json — it is only a transitive dependency
there, and everything is re-exported from `@cascivo/react`.

1. Local state -> `useSignal(initial)`; derived -> `useComputed(fn)`. Never `useState`.
   The signal IS the state.
   > ⚠ **Your linter will reject this rule by default.** `eslint-plugin-react-hooks@7`'s
   > `recommended-latest` enables `react-hooks/immutability`, which reports every
   > `signal.value = next` as `Error: This value cannot be modified`. It fires on the idiom
   > this line mandates, in your own page code, on both install paths. Install
   > `@cascivo/eslint-config` (`...cascivo` spread last in `eslint.config.js`) or set
   > `'react-hooks/immutability': 'off'` yourself. Full rationale and what it costs:
   > [USING-WITH-STRICT-ESLINT.md](/docs/using-with-strict-eslint.md).
2. Side effects (DOM, listeners, `showModal()`) -> `useSignalEffect(fn)`. Never `useEffect`.
3. Shared/app-wide state -> a module-level `signal` imported anywhere. Never `useContext`.
4. A controlled/uncontrolled prop bridged to a signal ->
   `useControllableSignal({ value, defaultValue, onChange })`.
5. Avoiding signal leaks across route/tenant changes -> `useScope()` / `createScope()`
   (disposes owned effects on unmount).
6. Forms -> `createForm` / `useForm` / `<Form>` / `field()` (`@cascivo/react`): signal store,
   sync/async + Standard Schema (zod/valibot) validation, optional `validateOnChange`.
7. Theming (light/dark toggle, SSR no-FOUC) -> `<ThemeProvider>` + `useTheme()` /
   `setTheme()` + `themePreloadScript()` (`@cascivo/react`). `useTheme()` returns a **tuple**
   `[theme, setTheme]` where `theme` is a plain **`string`** (the current theme name) — use it
   directly (`theme === 'dark'`), never `theme.value`, and never destructure `{ theme, setTheme }`
   (that is next-themes' shape, not cascivo's). The hook calls `useSignals()` for you, so the
   component re-renders on theme changes with no signal handling. For signal-native code
   (`computed()`/`effect()`/Preact) use `themeSignal()` instead. A controlled
   `<ThemeProvider value=…>` is SSR-safe by itself (emits an inline attribute setter). Never a
   `useEffect` that adds a `.dark` class.
8. Token names in TypeScript -> `import type { CascivoToken, CascivoColorToken } from
'@cascivo/tokens/tokens'` (generated union — no CSS-file lookup).
9. `useSignals()` is needed ONLY for a signal you did not get from a cascivo hook: a
   module-level `signal()`, a signal passed in as a prop, or `currentLocale()`. Call it as
   the component's first statement. Signals returned by `useSignal`, `useComputed`,
   `useDisclosure`, `useMachine`, `useTheme` and the rest subscribe you already — do not
   sprinkle `useSignals()` everywhere. Symptom of getting this wrong: handlers fire, the
   UI never moves, no error.
10. Mirroring a controlled prop into a signal -> `useControllableSignal` when you read it
    in render; `useEffectPropSignal` when it is read only inside `useSignalEffect`. Never
    hand-roll `s.value = prop` for the effect case: signals run effects synchronously on
    write, so that runs the effect body during React's render phase.

Full catalogs: docs/HEADLESS.md (primitives) and docs/ENTERPRISE-READINESS.md (friction map).
```

## Event-handler naming

cascivo names change/activation callbacks by **what the handler receives**, so you can
predict the prop without checking the types:

| Handler receives                                                                       | Prop name                  | Examples                                                                                               |
| -------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------ |
| The component's **value** (string / number / array / boolean / Date — not a DOM event) | **`onValueChange(value)`** | `Tabs`, `SegmentedControl`, `Combobox`, `MultiSelect`, `Toggle`, `Search`, `NumberInput`, `DatePicker` |
| A raw **DOM `ChangeEvent`** from a real underlying element                             | **`onChange(event)`**      | `Checkbox`, `NativeSelect`, `PasswordInput`, `Select`, `Slider`                                        |
| **Activation / selection** of a discrete item                                          | **`onSelect(value)`**      | `Dropdown`, `OverflowMenu`, `MenuItem`, `ContextMenuItem`, chart point clicks                          |
| A raw DOM click passthrough                                                            | **`onClick(event)`**       | nav items, buttons                                                                                     |

Rule of thumb when authoring or generating: **if your handler's first argument is a value,
name it `onValueChange`; if it's a DOM event, name it `onChange`.** A few components still
accept a deprecated value-carrying `onChange` alias for backward compatibility — prefer
`onValueChange`; the alias will be removed in a future major.

> **`Toggle` is the exception to note:** it `Omit`s the DOM `onChange` and redefines it to
> receive a `boolean`. Use **`onValueChange`** — the same boolean, the correct name. The
> value-carrying `onChange` is deprecated and kept only for compatibility; do not add another.

> **`Select` and `Slider` are native-element wrappers**, not composite components: they
> spread onto a real `<select>` / `<input type="range">` and carry only the DOM
> `onChange(event)`. Read the value off `event.target.value`. They were previously listed
> in the `onValueChange` row, which was wrong and cost an adopter a build cycle —
> `scripts/checks/handler-naming-parity.test.ts` now fails the build if this table names a
> handler a component does not have.

> **`onSelect` on menus lives on the item, not the menu.** `MenuItem` / `ContextMenuItem`
> take `onSelect: () => void` (the item already knows which item it is). `Dropdown` and
> `OverflowMenu` are config-driven, so their root takes `onSelect(value)`.

## Accessible-name and item-identity props

The sibling of the handler rule: name a prop by **what it is**, not by the component.

| The value is                                                                                       | Prop name                                         | Examples                                                               |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| Text the component **renders**                                                                     | **`label`**                                       | `Field`, `Checkbox`, `Radio`, `Toggle`, `Slider`                       |
| An **invisible** accessible name for an icon-only control or a nav landmark (goes to `aria-label`) | **`ariaLabel`**                                   | `OverflowMenu`, `SideNav`, `Breadcrumb`, `Dock`, `Steps`               |
| The identity of an item that is **handed to a callback**                                           | **`value`**                                       | `OverflowMenu`, `Dropdown`, `Select`, `Combobox`                       |
| A **React key** for an item — never passed anywhere                                                | **`id`** (rows/items) / **`key`** (table columns) | `CommandMenu`, `StructuredList`, `Timeline`, `DataTable.columns[].key` |

Two components predate the rule and take `label` for an **invisible** name: `IconButton`
and `Sparkline`. Both now also accept `ariaLabel` as an alias, so guessing either way works;
`label` keeps working and is not deprecated.

Every component that took only the DOM spelling `aria-label` now accepts **both**
`ariaLabel` and `aria-label` — two spellings of one idea inside one package was a coin flip
on every component. That covers `Filter`, `StructuredList`, `Progress`, `Menubar`,
`NavigationMenu`, `TreeView`, `Swap`, `RadialProgress`, `SplitView` and `StatsBand`. Where
the name is **required** (`Menubar`, `IconButton`), an XOR union enforces that exactly one
is present, so the a11y guarantee survives the alias.

**`value` vs `id` is a real distinction, not an inconsistency.** `value` is the identity the
component _hands back to you_ — `onSelect(value)`. `id` is a React key the component uses
internally and never passes anywhere: `CommandMenu`'s items take `onSelect: () => void`, so
their `id` could not be delivered even in principle. Reach for `value` when a callback
receives it, `id` when it is only identity. `OverflowMenu` items additionally accept **`id`**
as an alias of `value`, because it is the common wrong guess by analogy with `CommandMenu`.

Guessing across components is the failure this prevents: an adopter wrote
`<OverflowMenu label=… items={[{ id, label }]}>` by analogy with `CommandMenu` and
`IconButton` and got two type errors — `OverflowMenu` takes `ariaLabel` and `value`. The
per-component pages were correct; the cost was that the convention was never stated.

## Data and shape props — the vocabulary an agent has to guess

The two tables above cover _handlers_ and _names_. This one covers the props that carry the
**data and the look**, which is where a 2026-08-08 adopter lost nine compile cycles in one
small dashboard — the single largest friction in that report.

| The prop carries                          | Prop name                   | Never                                 | Why                                                                                                                                       |
| ----------------------------------------- | --------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| A config-driven **collection**            | **`items`**                 | `rows`, `data`, `entries`             | `DataList`, `StructuredList`, `Timeline`, `Steps`, `CommandMenu`, `OverflowMenu`, `Switcher`                                              |
| The rows of a **table**                   | **`rows`**                  | `items`                               | `DataTable` only — it renders a `<table>`, where "rows" is the domain word, not a synonym for items                                       |
| A **visual style** enum                   | **`variant`**               | `shape`, `kind`, `type`, `appearance` | `Badge`, `Tag`, `Button`, `Alert`, `Card`, `Notification`                                                                                 |
| The **tag of a discriminated union**      | **`kind`**                  | `type`                                | `AreaChart.annotations[].kind`, and every new union — `type` is reserved for HTML-ish meanings (`input type`, edge/node renderer keys)    |
| A **space-scale step**                    | numeric **`gap={4}`**       | `gap="4"`                             | `Flex`, `Grid`, `AutoGrid`, `AppShell.padding`. ⚠ See the warning below — this is the one that breaks the pattern                         |
| A **rich, replaceable slot**              | **`actions`** (`ReactNode`) | `action={{ label, onClick }}`         | `Notification`, `CardHeader`, `PageHeader`. `Alert.action` is the one `{label,onClick}` shorthand left; it is not the pattern to copy     |
| The **body text** of a feedback component | **`description`**           | children                              | `Notification`, `Alert`, `EmptyState`, `Field` — passing children renders nothing                                                         |
| A **visible** text label                  | **`label`**                 | `title`, `text`, `caption`            | The default: ~25 components render `label` on screen (`Toggle`, `Checkbox`, `Input`, `Slider`, `Stat`, `Kpi`, …). ⚠ See the warning below |
| An **invisible** accessible name          | **`ariaLabel`**             | `label`                               | `Sparkline`, `Spinner`, `Fab`, `ProgressCircle`, `Resizable`. Always accepted alongside the raw `aria-label`                              |

> ### ⚠ `label` renders on screen — check the prop docs before assuming it is a11y-only
>
> A 2026-08-14 adopter learned `label` from `Sparkline`, where it is explicitly an invisible
> accessible name, and passed `<Toggle label="Automatic deployments">` into a settings row
> that already had a visible title. The string rendered **next to the switch**, duplicating
> the row's own heading.
>
> The catalog rule is: **`label` is visible unless its own description says otherwise, and
> `ariaLabel` is never visible.** When a row, heading or `Field` already labels the control,
> omit `label` and pass `aria-label` instead — every component forwards it.
>
> Enforced by `vocabulary.test.ts`: a `label` prop whose manifest description states neither
> fails `pnpm meta:check`. Silence is the bug — the reader cannot tell it from either case.

> ### ⚠ `gap` takes a NUMBER, and it is the one prop that breaks the pattern
>
> Every other size-ish prop in the catalog is a **string** union — `size="sm"`,
> `padding="md"`, `density="compact"`. The space scale is a **numeric** `SpaceStep`
> (`1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12`), so it is `gap={4}`, not `gap="4"`.
>
> This is deliberate: the steps are a scale with an order, and a string union would let
> `gap="7"` type-check into a token that does not exist. But it is genuinely surprising, and
> one adopter's `gap="4"` produced **20 type errors in a single run** — by far the largest
> single cost in their build. Write the braces.

### Items-prop-driven vs children-driven — and the types that look like components

`DataList`, `StructuredList`, `Timeline` and `Steps` are **items-prop-driven**: they take an
array and render it. `ListItem`, `ContainedListItem`, `MenuItem` and `TabsTrigger` are
**children-driven**: you compose them as elements. Nothing in the name tells you which, so
the catalog's export list mixes real components with the interfaces that describe their
items — `DataListItem` is an **interface**, not a component, and

```tsx
<DataList>
  <DataListItem label="Domain">{project.domain}</DataListItem>   {/* ✗ not a component */}
</DataList>

<DataList items={[{ label: 'Domain', value: project.domain }]} /> {/* ✓ */}
```

`DataList`'s items are `{ label, value }`. They render into a `<dl>`, so `term`/`description`
is the natural guess from the HTML and it is wrong — `label`/`value` is the catalog-wide
naming (see the accessible-name table above), and consistency across components beats
mirroring one element's vocabulary.

## Status and progress vocabularies — one set of words

Four display components and two sequence components used to ship six overlapping enums for
two ideas. There is now one canonical vocabulary for each, and every historical spelling is
accepted as an alias — so one domain enum drives the whole catalog with no lookup table.

**Severity — `Tone`** (`@cascivo/core`): `neutral | info | success | warning | danger`

| Component      | Prop      | Also accepts (aliases)                                                                         |
| -------------- | --------- | ---------------------------------------------------------------------------------------------- |
| `Badge`        | `variant` | `default`→neutral, `destructive`/`error`→danger, plus `secondary`/`outline` (looks, not tones) |
| `Tag`          | `variant` | `default`→neutral, `error`/`destructive`→danger                                                |
| `Status`       | `status`  | `error`/`destructive`→danger, `default`→neutral                                                |
| `Notification` | `variant` | `error`/`destructive`→danger                                                                   |

**Position in a sequence — `Progress`** (`@cascivo/core`): `pending | active | complete | error`

| Component  | Prop                  | Also accepts (aliases)               |
| ---------- | --------------------- | ------------------------------------ |
| `Steps`    | `Step.state`          | `current`→active, `upcoming`→pending |
| `Timeline` | `TimelineItem.status` | `current`→active, `upcoming`→pending |

Write the canonical value in new code. `scripts/checks/vocabulary.test.ts` fails a component
that models either idea with a private union.

## Links in a routed app

Two kinds of link, wired two different ways. Getting this wrong costs either a full page
reload or a hand-rolled copy of cascivo's link CSS — both were reported by adopters.

| The link is                                                                                                                  | Do this                                                      |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Rendered **by cascivo** from config (`SideNav`, `ShellHeader`, `Header`, `Breadcrumb`, `Switcher`, `Dock`, `NavigationMenu`) | `setLinkComponent(...)` **once** at app startup              |
| Written **by you** in page content (a project name, a branch in a table cell)                                                | `<Link asChild><RouterLink to="…">…</RouterLink></Link>`     |
| A call-to-action that navigates                                                                                              | `<Button asChild><RouterLink to="…">…</RouterLink></Button>` |

**Never write a bare `<Link href="/x">` in a routed app** — cascivo's `Link` renders a real
`<a>`, so it is a full page reload. `setLinkComponent` does **not** apply to it: `Link` is a
component you place, so it takes the child you hand it. **Never copy cascivo's link CSS into
your own layer** — override the tokens (`--cascivo-link-color`) instead.

Full guide: [USING-WITH-A-ROUTER.md](/docs/using-with-a-router.md).

## Overriding styles the sanctioned way

Every cascivo component spreads `{...props}` onto its root element, so `style` and
`className` **already pass through on every component** — you do not need (and there is
no) `sx`/`css` styling prop. When a component's props and tokens don't cover a one-off,
climb this ladder in order and stop at the first rung that works:

1. **Component props + tokens** — the intended path. `variant`, `size`, and setting a
   `--cascivo-*` component token cover almost everything.
2. **`className` + a rule in `cascivo.override`** — for a reusable override. The
   `cascivo.override` layer beats everything cascivo ships.
3. **Inline `style` with `var(--cascivo-*)` values** — for a fast one-off. This stays
   `cascivo audit --ai`-clean because the values are tokens.
4. **`/* cascivo-audit: allow <rule> */`** — the rare remainder. A comment on the same
   line as, or the line above, a flagged line downgrades that finding so the audit no
   longer fails on it (e.g. `allow unknown-prop`, `allow hardcoded-value`, or `allow all`).
   Suppressed findings still print, so nothing is hidden.

`cascivo audit --ai` treats an inline `style` value that happens to equal a token as a
gentle **warning**, not an error — it never blocks a build on a fast-prototyping override.
Genuinely invented props (`sx`, `elevation`, …) remain errors; use rung 4 only when you
mean it.

### Running the audit

It works in any project with no setup — the contract ships inside the CLI, so there is
nothing to download and no network needed:

```sh
npx cascivo audit --ai src            # or add it to your lint script
npx cascivo audit --ai --json src     # machine-readable findings
npx cascivo audit --ai --fix src      # rewrite unambiguous literals to tokens
```

A good CI gate pairs it with `doctor`, which checks the install itself:

```jsonc
{ "scripts": { "lint": "cascivo doctor --ci && cascivo audit --ai src" } }
```

Only `error`-level findings fail `--ci`. `info` findings (a component using a `{...spread}`,
whose props can't be known statically) and `warn` findings (an inline `style` literal that
happens to equal a token) never do — so the gate stays green on correct code. A realistic
router-based dashboard is audited in cascivo's own CI
(`packages/cli/src/audit-ai/adopter-app.test.ts`) and must report **zero errors**; that
fixture is what keeps this recommendation honest.

`--contract <path>` points at a specific `audit-contract.json` (pin a version, or run
fully air-gapped); `--verbose` reports which contract source was used.

## Layout primitives — structure with these before writing CSS

Page structure (dashboard shells, toolbars, card grids, multi-column sections) has
first-class primitives, all exported from `@cascivo/react` — reach for them before
hand-writing grid/flex CSS or inline `style` layout:

- **`Flex`** — the gap-based flex container (`direction`, `gap`, `align`, `justify`, `wrap`).
- **`Grid`** / **`GridItem`** — CSS grid with responsive object props:
  `<Grid cols={{ base: 1, md: 2, lg: 3 }} gap={4}>`, `<GridItem span={{ base: 1, lg: 2 }}>`.
- **`AutoGrid`** — responsive card grid that fills columns by available width, no media queries.
- **`Columns`**, **`Center`**, **`Spacer`** — equal columns, centered max-width column, fixed gap.

The published `Stack` is a visual card-pile (overlaps children by an `offset`) — for
gap-based layout use `Flex`, not `Stack`.

## Coming from utility-first (Tailwind)?

cascivo has no utility classes. You express the same intent with plain CSS properties
reading `--cascivo-*` tokens, inside a layer. The mapping is mechanical:

| Tailwind utility          | cascivo CSS (inside `@layer …`)                                    |
| ------------------------- | ------------------------------------------------------------------ |
| `p-4`                     | `padding: var(--cascivo-space-4);`                                 |
| `px-2`                    | `padding-inline: var(--cascivo-space-2);`                          |
| `gap-2`                   | `gap: var(--cascivo-space-2);`                                     |
| `flex items-center`       | `display: flex; align-items: center;`                              |
| `flex items-center gap-2` | `display: flex; align-items: center; gap: var(--cascivo-space-2);` |
| `text-sm`                 | `font-size: var(--cascivo-text-sm);`                               |
| `text-muted-foreground`   | `color: var(--cascivo-color-text-subtle);`                         |
| `font-semibold`           | `font-weight: var(--cascivo-font-semibold);`                       |
| `rounded-md`              | `border-radius: var(--cascivo-radius-md);`                         |
| `bg-card`                 | `background: var(--cascivo-color-surface);`                        |

Two habit changes:

- **Structure vs. style split.** Markup stays semantic; all styling lives in a CSS
  module inside a layer. You are not decorating JSX with class strings.
- **Tokens, not values.** Reach for a `--cascivo-*` token instead of a raw `16px` /
  `#111`. The closed token set is at
  [`https://cascivo.com/tokens.catalog.json`](https://cascivo.com/tokens.catalog.json)
  and documented in [TOKENS.md](/docs/tokens.md).

## Server-rendering setup (Vite SSR / TanStack Start / Remix / workerd)

If you scaffold an app that server-renders through **Vite** (TanStack Start,
vite-ssr, Remix on Vite, or a workerd/Cloudflare target), do two things or the
build throws `Unknown file extension ".css"` and silently falls back to
client-only rendering:

1. Add `ssr: { noExternal: [/^@cascivo\//] }` to `vite.config.ts` — or add the
   `cascivoSsr()` plugin from `@cascivo/vite-plugin`. This makes Vite process the
   packages' per-component CSS imports instead of leaving them for the server
   runtime to load raw.
2. Import `@cascivo/react/styles.css` once in the root route/entry. Don't rely on
   per-component CSS imports server-side.

No `<ClientOnly>` wrappers are needed — components ship `'use client'` and render
their server HTML normally. **Next.js App Router needs none of this** (its recipe
imports the aggregate sheet in a Server Component), and plain **Vite CSR/SPA**
needs none of it either — only Vite _SSR_ runtimes do. Full recipe:
[USING-WITH-VITE-SSR.md](/docs/using-with-vite-ssr.md).

**TypeScript + CSS imports.** The `import '@cascivo/react/styles.css'` (and
`@cascivo/themes/all.css`) side-effect imports need ambient CSS-module types under
`tsc --noEmit`, or they error with `TS2307` (`TS2882` under
`noUncheckedSideEffectImports`). Add `src/vite-env.d.ts` with
`/// <reference types="vite/client" />`, or `declare module '*.css'`. This is a
type-only declaration — no runtime effect.

## See also

- [USING-WITH-A-ROUTER.md](/docs/using-with-a-router.md) — `setLinkComponent` vs `asChild`.
- [USING-WITH-VITE-SSR.md](/docs/using-with-vite-ssr.md) — the SSR `ssr.noExternal` recipe.
- [CSS-LAYERS-PITFALL.md](/docs/css-layers-pitfall.md) — the canonical order and the
  `cascivo.override` escape hatch.
- [THIRD-PARTY-CSS.md](/docs/third-party-css.md) — the `layer(vendor)` recipe.
- [USING-WITH-TAILWIND.md](/docs/using-with-tailwind.md) — running cascivo alongside an
  existing Tailwind v4 setup.
- [TOKENS.md](/docs/tokens.md) — the full token catalog.
