Copy-paste **app shells, page layouts, blocks, and marketing sections** for cascivo — the structural pieces that sit above individual components. This package is a **registry source**: it is private, never published to npm, and its files are copied into your project by the CLI (you own the source afterwards).

## Install via the CLI, not npm

Every entry is indexed in `registry.json` under a namespaced name — `layout/<name>`, `block/<name>`, or `section/<name>`:

```sh
npx cascivo add layout/app-shell layout/dashboard-layout
npx cascivo add block/login-page
npx cascivo add section/hero section/page-footer
```

The CLI resolves registry dependencies automatically (e.g. a block pulls in the components it composes) and writes the `.tsx` + `.module.css` sources into your project.

## What's inside

**App shells & page layouts** (`layout/…`)

- `app-shell` — sticky header + full-height side-nav + single scroll container, with an accessible nav toggle and persisted collapse state (`shell-state.ts`).
- `dashboard-layout`, `settings-layout`, `auth-layout`, `page-header`.

**Layout primitives** (`layout/…`)

- `stack`, `columns`, `grid`, `auto-grid`, `masonry`, `center`, `section`, `spacer`, `split-view`.

**Blocks** (`block/…`) — full-page compositions ready to adapt:

- `sidebar-app`, `console-app`, `login-page`, `dashboard-charts`, `empty-dashboard`, `stats-cards`, `users-table-page`, `settings-form-page`, `notification-center`, `page-with-breadcrumb`.

**Marketing sections** (`section/…`)

- `hero`, `feature-grid`, `cta`, `stats-band`, `media-masonry`, `page-footer`.

## Design constraints

Layouts follow the same rules as every cascivo component:

- **Signal-driven** — collapse state and responsive behavior use `@cascivo/core` signals, not React state hooks.
- **Mobile-first `@container` queries** — layouts adapt to their slot, not the viewport, so they work inside any container.
- **No hidden content** — collapsed navigation relocates to an accessible drawer that stays keyboard-reachable and in the a11y tree; `display:none` is never used to drop content on mobile.
- **CSS logical properties** throughout, so everything works RTL.

Prefer a prebuilt import instead of owned source? `Stack` and `AppShell` also ship prebuilt in [`@cascivo/react`](https://github.com/cascivo/cascivo/tree/main/packages/react); the rest of the layouts are copy-paste only — install them as owned source via the CLI.
