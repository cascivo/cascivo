# @cascivo/core

## 0.5.1

### Patch Changes

- e81a0a7: `setLinkComponent` now infers `LinkComponentProps` for an inline adapter.

  An inline router adapter like `setLinkComponent(({ href, ...rest }) => <Link to={href}
{...rest} />)` previously got no parameter types (the parameter was `ElementType`), so
  `href` was untyped — the exact seam where a router integration is most error-prone. An
  added overload contextually types an inline function adapter as `LinkComponentProps`, so
  `href` is inferred with no annotation. Every existing call still compiles (`'a'`, a
  Next.js `Link`, a class component) via the `ElementType` fallback overload.

## 0.5.0

### Minor Changes

- 21e7ddb: Expose the router-link contract as a named, documented type.

  `setLinkComponent` shipped, but the prop bag it hands a custom link was an opaque
  `ElementType` — an adopter reading the shipped `.d.ts` as documentation couldn't see
  `href`/`aria-current`/`onClick`/… or the `href → to` mapping idiom (2026-07-20 report, #6).
  `@cascivo/core` now exports a JSDoc'd `LinkComponentProps` interface, re-exported from
  `@cascivo/react`, and `setLinkComponent`'s docs show the TanStack adapter inline.

  `SideNavLinkProps.onClick` is now optional: cascivo always provides it and it only
  `preventDefault`s a disabled item, so it composes cleanly when spread onto a router
  `<Link>` (which keeps middle-click / open-in-new-tab).

### Patch Changes

- 21e7ddb: Raise the `@preact/signals-react` peer floor from `>=2.0.0` to `>=3.0.0`.

  React 19 removed the internal export that signals-react 2.x imports, so a 2.x
  runtime fails to load under React 19 (`SyntaxError: … '__SECRET_INTERNALS…'`). The
  old `>=2` floor let a resolver pick that broken build. signals-react 3.x still
  supports React 16.14+/17/18, so the new floor costs React-18 users nothing.

  If a lockfile carried over from an earlier install pins signals-react 2.x, run
  `cascivo doctor` — it now flags the mismatch (error on React 19, warning on React 18)
  with the exact upgrade command.

## 0.4.1

### Patch Changes

- 958fd6f: Add an optional `importSymbols` field to `ComponentMeta` so a component whose display
  `name` is not itself an export (compound/imperative modules — `SkipNav` ships
  `SkipNavLink`/`SkipNavTarget`, `Toast` ships `ToastProvider`/`useToast`) renders a
  correct `import { … }` line in its generated docs instead of a broken
  `import { SkipNav }`. Also corrects the DataTable `rows` prop description (was a
  pasted "Number of visible text rows.") and documents 26 previously-undocumented props
  across the manifests, now enforced by the props-parity Direction-B gate.
- 958fd6f: Every published package now exports `./package.json`, so
  `require.resolve('@cascivo/<pkg>/package.json')` resolves instead of throwing
  `ERR_PACKAGE_PATH_NOT_EXPORTED`. Previously only `@cascivo/react` exposed it, which
  tripped version probes, bundler plugins, and inspection tooling on the other packages.

## 0.4.0

### Minor Changes

- 357ba46: Fixes from the TanStack Start dashboard adopter report (SSR + framework integration):

  - **core:** new `setLinkComponent()` / `getLinkComponent()` (and the `LinkComponent`
    type) — register your router's `Link` once at app start so cascivo's config-driven
    nav components render real router links (preserving `href`, `aria-current`, and
    active `data-state`) instead of plain `<a>`, with no `onClick` interception. See
    docs/HEADLESS.md. Also: the signal-returning hooks `useControllableSignal`,
    `useMediaQuery`, `useDisclosure`, `useMachine`, `useRovingFocus`, `useStreamBuffer`,
    and `useScope` now call `useSignals()` internally, so a plain React consumer that
    reads their signal in render stays reactive without calling `useSignals()` itself
    (matching `useTheme`/`useForm`).
  - **react:** `SideNav`, `ShellHeader`, `Header`, `Breadcrumb`, `Switcher`, `Dock`, and
    `NavigationMenu` route their links through the registered link component (above);
    `SideNavItem.render` now receives the computed icon/label node and the anchor prop
    bag so a per-item hatch no longer discards layout. `RelativeTime` is now
    hydration-safe under SSR by default (server text is kept and corrected on the
    client) — pass a fixed `now` for byte-deterministic output.
  - **charts:** `PieChart` (and the whole trig family — donut, gauge, meter, radial-bar,
    radar, sunburst, polar) now emit quantized arc/polar coordinates, so they hydrate
    cleanly under SSR instead of throwing away the server markup on cross-engine
    floating-point differences. Also quieted the shared chart `ResizeObserver` loop.

  Note for reviewers: the responsive `Grid`/`Columns`/`SettingsLayout` container fix and
  the `Fork` → git-branch icon alias ship through the copy-paste registry (private
  `@cascivo/layouts`) and the regenerated site icon catalog respectively, so they are not
  versioned here.

## 0.3.1

### Patch Changes

- 810b8ba: Minor improvements

## 0.3.0

### Minor Changes

- dd05e9b: Add `useTypeahead` and fix duplicate-aria-id bugs in overlay components.

  - **`@cascivo/core`:** new `useTypeahead` primitive — type-to-select buffer for
    menus/listboxes. Accumulates printable keypresses, resets after an inactivity
    window, and calls `onMatch(query)` so the consumer focuses the matching item.
    Signal/ref-based, SSR-safe, no `useEffect`.
  - **Modal / Tooltip / AlertDialog:** replaced hardcoded static aria ids (Modal,
    AlertDialog) and a `Math.random()` id (Tooltip) with `useId()`. Two of the same
    component on one page no longer emit duplicate ids, so their `aria-labelledby` /
    `aria-describedby` references resolve correctly; Tooltip ids are now stable
    (SSR-safe) and colon-free (valid in the CSS anchor name).
  - **Menu:** keyboard navigation moved off per-item `nextElementSibling` walking onto
    panel-level roving focus + `useTypeahead`, so disabled items and separators are
    skipped and Home/End, arrow-wrap, and type-to-select work.

### Patch Changes

- 483e30a: Minor improvements

## 0.2.6

### Patch Changes

- e29ad6e: Re-release: publish the packages held back when the previous release run failed its generated-docs gate.

## 0.2.5

### Patch Changes

- b49e0ba: Fixed red flags.
- 6ee2f91: Experience fixes

## 0.2.4

### Patch Changes

- fc61671: Minor improvements

## 0.2.3

### Patch Changes

- bb3c77e: Templates and further improvements

## 0.2.2

### Patch Changes

- f0b5654: Fixes

## 0.2.1

### Patch Changes

- 2458391: Improvements
- 52c08b6: Improvements

## 0.2.0

### Minor Changes

- 4554af1: Make object-valued prop shapes machine-readable. `ComponentMeta` gains an optional
  `typeDefs` field (`TypeDefMeta`/`TypeFieldMeta`) describing the fields of object props —
  the per-datum/per-series `color` override was previously only discoverable in prose, so
  AI/registry consumers filtering props by name never found it. `PieChart` and `BarChart`
  now declare `typeDefs` for `PieChartDatum`, `BarChartSeries`, `StackedRow`/`StackedSegment`,
  and the `ChartPoint` tooltip-callback argument; these flow into `registry.json`, the MCP
  `get_component` payload, and a new `## Object types` section in the generated `llms.txt`
  component docs. The `@cascivo/charts` README now documents coloring, donut center labels,
  and `toStackedSeries` row-pivot usage. Resolves the `@lifosy/ui` charts discoverability gap.

## 0.1.3

### Patch Changes

- fa55081: SideNav improvements

## 0.1.2

### Patch Changes

- 72d0086: New location

## 0.1.1

### Patch Changes

- e9998ab: Further improvements

## 0.1.0

### Minor Changes

- b23575c: Initial public release of the cascivo design system. Includes:
  - `@cascivo/core` — signal/FSM runtime (Preact Signals integration)
  - `@cascivo/tokens` — CSS design tokens (primitive → semantic → component)
  - `@cascivo/themes` — light, dark, and warm first-party themes
  - `@cascivo/icons` — SVG icon component set
  - `@cascivo/i18n` — signal-driven locale store with typed catalogs
  - `@cascivo/storage` — persisted signals over localStorage/IndexedDB
  - `@cascivo/react` — prebuilt npm distribution of all components
  - `@cascivo/mcp` — MCP server exposing the component registry to AI agents
  - `@cascivo/registry` — component registry runtime (CLI dependency)
  - `cascivo` — CLI for `npx cascivo init / add / list / update`
