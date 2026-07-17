---
'@cascivo/core': minor
'@cascivo/react': minor
'@cascivo/charts': patch
---

Fixes from the TanStack Start dashboard adopter report (SSR + framework integration):

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
