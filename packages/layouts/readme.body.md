Copy-paste **app shells and page layouts** for cascivo — the structural pieces that sit above individual components. Like the component registry, layouts are copied into your project via the CLI (you own the source), not imported from this package.

## What's inside

- **App shells** — `AppShell` (sticky header + full-height side-nav + single scroll container, with an accessible nav toggle), `DashboardLayout`, `SettingsLayout`, `AuthLayout`.
- **Primitives** — `Stack`, `Columns`, `Grid`, `AutoGrid`, `Masonry`, `Center`, `Section`, `Spacer`, `SplitView`, `PageHeader`.
- **Marketing sections** — `Hero`, `FeatureGrid`, `Stats`, `CTA`, `MediaMasonry`, `PageFooter`.

## Usage

Add a layout to your project with the CLI:

```sh
npx cascivo add app-shell dashboard-layout
```

Layouts are signal-driven (collapse state, responsive breakpoints) and built mobile-first with `@container` queries, so they adapt to their slot rather than the viewport. They never use `display:none` to hide content — collapsed navigation relocates to an accessible drawer that stays keyboard-reachable.
