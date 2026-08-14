---
'@cascivo/ai': minor
'@cascivo/charts': minor
'cascivo': minor
'@cascivo/core': minor
'@cascivo/docs': patch
'@cascivo/editor': minor
'@cascivo/flow': minor
'@cascivo/i18n': minor
'@cascivo/react': minor
'@cascivo/storage': minor
---

Fixes for the 2026-08-14 adopter report (a Vercel-style dashboard on Vite +
React Router).

## New: the vocabulary types are importable on the prebuilt path

`Status.status` and `Badge.variant` are typed `ToneInput`, and every layout
`gap` is a `SpaceStep` — but those types live in `@cascivo/core`, which is a
_transitive_ dependency on the prebuilt path that the docs tell you not to
install. So the first thing a typed dashboard writes had no supported import.

```ts
import type { Tone } from '@cascivo/react/types'

const DEPLOY_TONE: Record<DeployState, Tone> = { ready: 'success', error: 'danger' }
```

`@cascivo/react/types` exports `Tone`, `ToneAlias`, `ToneInput`, `Progress`,
`ProgressAlias`, `ProgressInput`, `SpaceStep` and `RovingOrientation`. On the
copy-paste path keep importing from `@cascivo/core`. **Do not** add
`@cascivo/core` to a prebuilt app to reach these — it is transitive there.

They ship from a subpath rather than the main entry for a mechanical reason:
component sources already import those names from core, so re-exporting them
from `@cascivo/react` makes the dts bundler emit `ToneInput as ToneInput$1`
and every prop switches to the aliased name.

## The router guide is now published

`docs/USING-WITH-A-ROUTER.md` existed and was referenced from `Link`, `Tabs`
and `setLinkComponent`, but was never published — so those pointers 404'd.
It is now at <https://cascivo.com/docs/using-with-a-router.md> and in
`npx @cascivo/docs`, along with three other guides that were also unpublished:
`testing`, `css-layers-pitfall` and `third-party-css` (the last two cited by
`@cascivo/react`'s own README and by `cascivo audit`).

`setLinkComponent` gains a React Router recipe — its `to` is required, so the
disabled-item case needs a fallback:

```tsx
setLinkComponent(({ href, ...rest }: LinkComponentProps) => <Link to={href ?? '#'} {...rest} />)
```

## Components

- `PageHeader.title` and `.description` accept `ReactNode`, not just `string`,
  so a page title can carry a status badge or a linked domain.
- `CodeSnippet` accepts children as an alias for `code`
  (`<CodeSnippet>npm i foo</CodeSnippet>`). It stays a string — the content is
  tokenized for highlighting and handed to the clipboard.
- `BreadcrumbItem` and `DockItem` gain the `id` escape hatch the other
  link-shaped item types already had. `Dock` previously keyed on the array
  index.
- `Sparkline`'s documented default was 80 while the code applied 120; the docs
  now say 120 and that it is **fixed-width**, correcting a dashboard-recipe
  claim that it shrinks to fit.
- `Stat` and `Kpi` now document the choice between them: `<Stat card>` matches
  `Kpi`'s chrome but **not** its layout, so pick one per app.
- `label` visibility is now stated per component. It renders on screen for most
  components and is an invisible accessible name for a few (`Sparkline`,
  `Spinner`, `Fab`, …); nothing said which, and `<Toggle label>` duplicating a
  settings row's own heading is what the ambiguity cost.

## Charts

`@cascivo/charts/styles.css` is **not** required on a bundler build — the entry
imports its own stylesheet. It is required with no bundler, and on an SSR setup
that externalises dependencies, where the CSS-free `node` twin loads. Several
docs still called it unconditionally required. Also documents 13 chart and flow
prop defaults that no generated table had ever shown.

## CLI

- `cascivo create` emits the app shell as its own `src/Shell.tsx` with a
  `children` slot, so adding a router means deleting `App.tsx` and
  `src/sections/` rather than re-deriving the shell wiring.
- The scaffold no longer imports the ~273 kB aggregate `@cascivo/react/styles.css`;
  per-component CSS auto-includes and tree-shakes on a bundler. A generated app
  now emits **39.65 kB** of entry CSS (6.90 kB gzip).
- `create` inside an existing workspace detects the package manager from the
  surrounding lock file instead of always reporting npm under `npx`.
- The browser tab title is title-cased rather than the raw directory name.
