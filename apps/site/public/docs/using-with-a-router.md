<!--
  Generated from docs/ — do not edit here; run `pnpm regen`.
  Canonical: https://cascivo.com/docs/using-with-a-router.md
  registry v0.18.0 · generated 2026-08-17
-->

# Using cascivo with a router (TanStack Router, React Router, Next.js)

Every dashboard has a router, and cascivo links come in **two kinds** that are wired
differently. Getting one of them wrong is the single most-reported friction in adopter
reports, so this page is the one owner of the answer.

| Kind of link                                                                                                                           | How you wire it                                 | Why                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Links cascivo renders **for you** from config — `SideNav`, `ShellHeader`, `Header`, `Breadcrumb`, `Switcher`, `Dock`, `NavigationMenu` | `setLinkComponent(...)` **once at app startup** | You never write the `<a>`; cascivo does, from your `items`/`groups` arrays. It needs to know what to render. |
| Links **you** write in page content — a project name in a card title, a branch name in a table cell                                    | `<Link asChild>` wrapping your router's link    | You own the element; cascivo only lends it the styling.                                                      |

**`setLinkComponent` does not affect `<Link>`.** That is deliberate — `Link` is a component
you place yourself, so it takes the child you give it rather than reaching for a global. If you
use `setLinkComponent` and then write a bare `<Link href="/x">` in page content, you get a full
page reload. Use `asChild`.

## 1. Config-driven navigation — `setLinkComponent`

Call it once, at startup, before anything renders:

```tsx
import { setLinkComponent, type LinkComponentProps } from '@cascivo/react'

// TanStack Router — its Link takes `to`, so map href → to and spread the rest:
import { Link as RouterLink } from '@tanstack/react-router'
setLinkComponent(({ href, ...rest }: LinkComponentProps) => (
  <RouterLink to={href ?? '.'} {...rest} />
))

// React Router — same shape:
import { Link as RouterLink } from 'react-router'
setLinkComponent(({ href, ...rest }: LinkComponentProps) => (
  <RouterLink to={href ?? '.'} {...rest} />
))

// Next.js — its Link already takes `href`:
import Link from 'next/link'
setLinkComponent(Link)
```

Spread the whole props bag. cascivo computes `className`, `aria-current="page"`,
`data-state="active"` and assorted `data-*` attributes, and spreading keeps them — plus,
because navigation stays a real `<a>`, middle-click and open-in-new-tab keep working with no
`onClick` interception. The registered component must forward `ref` to its anchor for
roving-focus navs.

`LinkComponentProps` is exported from **both** `@cascivo/react` (Path B) and `@cascivo/core`
(Path A), so you never need to add `@cascivo/core` as a direct dependency just for the type.

### Marking the active item — the prefix-match helper you would otherwise write twice

`SideNav`, `ShellHeader` and `Dock` are **config-driven**: you tell them which item is
active, they do not ask your router. That is deliberate — a nav that reached into your router
would have to know about five of them — but it means every integration writes the same
matcher, and two adopters in a row wrote it wrong the same way.

Exact equality is the wrong test. `item.href === pathname` lights nothing on
`/projects/storefront` when the nav item is `/projects`, and nothing on `/analytics?view=speed`
when the item is `/analytics`. This is the version to copy:

```tsx
/**
 * True when `href` is the current location or one of its ancestors.
 *
 * - Ignores query strings and hashes — `/analytics?view=speed` matches `/analytics`.
 * - Matches on SEGMENT boundaries, so `/project` does not match `/projects`.
 * - Treats `/` as exact-only, or every item would match every route.
 */
function isActive(href: string, pathname: string): boolean {
  const path = href.split(/[?#]/)[0]!.replace(/\/$/, '')
  const here = pathname.split(/[?#]/)[0]!.replace(/\/$/, '')
  if (path === '') return here === ''
  return here === path || here.startsWith(`${path}/`)
}

const items = NAV.map((item) => ({ ...item, active: isActive(item.href, pathname) }))
```

Feed `pathname` from whatever your router exposes — `useLocation().pathname` (React Router),
`useRouterState({ select: (s) => s.location.pathname })` (TanStack Router), `usePathname()`
(Next.js).

**When two items would both match**, keep only the longest — otherwise `/projects` and
`/projects/new` both light up:

```tsx
const best = items.filter((i) => i.active).sort((a, b) => b.href.length - a.href.length)[0]
const items2 = items.map((i) => ({ ...i, active: i === best }))
```

Give every item a stable **`id`** while you are here (`SideNavItem`, `ShellHeaderNavLink`,
`SwitcherLink`, … all take one). Items keyed only by `href` collide as soon as two of them
point at `/` — a placeholder link, or three teams in a switcher — and React logs a
duplicate-key warning on every render.

## 2. Links in page content — `asChild`

`asChild` renders **your** element with cascivo's styling applied to it, instead of cascivo's
own element. It is the supported way to put design-system styling on a router link:

```tsx
import { Link } from '@cascivo/react'
import { Link as RouterLink } from '@tanstack/react-router'

// Client-side navigation, fully themed link styling:
<Link asChild>
  <RouterLink to="/projects/alpha">alpha</RouterLink>
</Link>

// Inside prose — `inline` inherits the surrounding typography:
<Link asChild variant="inline">
  <RouterLink to="/docs/limits">rate limits</RouterLink>
</Link>

// A router link that should look like a button:
<Button asChild>
  <RouterLink to="/projects/new">New Project</RouterLink>
</Button>
```

**Do not** hand-roll link styling from tokens. The tokens `Link` reads
(`--cascivo-link-color`, `--cascivo-color-accent-hover`, `--cascivo-color-accent-active`) are
public and in `tokens.catalog.json`, but a copy of the rule in your app layer drifts from
upstream on every release — and because your app slot outranks `cascivo.component`, a partial
copy silently wins over the parts you did not copy.

### Components that support `asChild`

<!-- generated: asChild-support -->

| Component           | Typical child                                               |
| ------------------- | ----------------------------------------------------------- |
| `Button`            | `<a>` / router `Link` — a call-to-action that navigates     |
| `IconButton`        | `<a>` / router `Link` — an icon-only navigation control     |
| `Link`              | router `Link` — an in-content link                          |
| `Item`              | `<a>` / router `Link` — a list row that navigates           |
| `Tile`              | `<a>` / router `Link` — a selectable card that navigates    |
| `ContainedListItem` | `<a>` / router `Link` — a list row inside a `ContainedList` |
| `PopoverTrigger`    | your own trigger element                                    |
| `TabsTrigger`       | router `Link` — one route per tab (see below)               |
| `Label`             | a custom label element                                      |

<!-- /generated: asChild-support -->

The table is checked against the source by
`scripts/checks/aschild-docs.test.ts` — a component that gains `asChild` and is not listed
here fails CI.

### URL-driven tabs

One route per tab is the canonical dashboard shape, and it is the case `asChild` on
`TabsTrigger` exists for. Navigating from `onValueChange` instead loses middle-click,
cmd-click, open-in-new-tab, and a crawlable `href`; a real anchor gives you all four.

Keep `Tabs` controlled from the router so the browser's back button stays authoritative:

```tsx
// TanStack Router
import { Link, Outlet, useMatchRoute } from '@tanstack/react-router'

function ProjectTabs({ id }: { id: string }) {
  const matchRoute = useMatchRoute()
  const active = matchRoute({ to: '/projects/$id/settings' }) ? 'settings' : 'overview'

  return (
    <Tabs value={active}>
      <TabsList>
        <TabsTrigger value="overview" asChild>
          <Link to="/projects/$id/overview" params={{ id }}>
            Overview
          </Link>
        </TabsTrigger>
        <TabsTrigger value="settings" asChild>
          <Link to="/projects/$id/settings" params={{ id }}>
            Settings
          </Link>
        </TabsTrigger>
      </TabsList>
      {/* The router owns the panel, so there is no TabsContent — render the Outlet. */}
      <Outlet />
    </Tabs>
  )
}
```

Next.js App Router is the same shape with `usePathname()` in place of `useMatchRoute()`
and `next/link` in place of `Link`.

Two things to know:

- **`value` is still required** on each trigger. It is what `aria-controls` and
  `data-state` key on, so the selected tab is announced correctly even though the router,
  not `Tabs`, decides which one is active.
- **`disabled` becomes `aria-disabled`** under `asChild`: `disabled` is not a valid
  attribute on an anchor. Guard the navigation yourself if a tab must be inert.

## 3. What `asChild` guarantees

- The child element receives cascivo's `className` **merged with its own**, plus the
  component's `data-variant` / `data-size` / state attributes.
- The child keeps its own props: `to`, `href`, `onClick`, `ref`.
- **No UA underline leaks through.** `Button`, `IconButton`, `Item` and `Tile` explicitly set
  `text-decoration: none`, so the browser's `a[href]` default cannot survive onto a control
  that should not look like a link.
- **Disabled works on an anchor.** An `<a>` cannot be `:disabled`, so pass
  `aria-disabled="true"` — every `asChild`-capable component styles that identically to
  `:disabled`.

### One caveat when you override styling locally

Your app's layer slot sits **above** `cascivo.component` in the cascade, so an app-layer rule
wins over the component's own — including parts you did not mean to override. If you add
`color: inherit` next to a `Button asChild`, you also override the button's own foreground
colour and can end up with near-white text on a near-white background. Override the
**component tokens** (`--cascivo-button-bg`, `--cascivo-link-color`, …) rather than the
properties, and the cascade stays on your side. See
[CSS-LAYERS-PITFALL.md](/docs/css-layers-pitfall.md).

## 4. Code splitting — and the `HydrateFallback` warning it produces

[RECIPE-DASHBOARD.md](/docs/recipe-dashboard.md) tells you to route-split a console, and it is
right, but the consequences land here — in the router — so they are documented here.

**Split every route, including the index one.** "Split the chart routes" reads as _not_
including the landing page, and an adopter took it that way: their entry chunk stayed at
524.70 kB because one `Sparkline` on an eagerly-loaded `/` pulled the whole chart engine into
it. A later adopter made `/` lazy like everything else and measured 413.07 kB with the
sparklines still there (2026-08-21 report).

```tsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <Shell />,
    // `HydrateFallback` — see below. Without it React Router warns on every page load.
    HydrateFallback: () => <Spinner label="Loading" />,
    children: [
      { index: true, lazy: () => import('./routes/overview') },
      { path: 'projects', lazy: () => import('./routes/projects') },
      { path: 'analytics', lazy: () => import('./routes/analytics') },
    ],
  },
])
```

**The warning.** With `lazy` routes on a data router, React Router logs on every page load:

```
No HydrateFallback element provided to render during initial hydration
```

That is React Router's warning, not cascivo's, and nothing is broken — it is telling you
there is no element to show while the first lazy route module is in flight. It is noise an
adopter following the splitting advice above will hit, which is why it is called out here.
Give the root route a `HydrateFallback` and it goes away:

```tsx
import { Spinner } from '@cascivo/react'

HydrateFallback: () => <Spinner label="Loading" />
```

Any component works; `Spinner` and `Skeleton` are the two that read as "this is coming",
and `Spinner`'s `label` is a screen-reader-only name, so it announces without painting text.

## 5. Checklist

1. `setLinkComponent(...)` once at startup — covers every config-driven nav.
2. `<Link asChild>` for in-content links; `<Button asChild>` for CTAs.
3. Never a bare `<Link href>` in a routed app — that is a full page reload.
4. Never a copy of cascivo's link CSS in your own layer.
5. Route-split every route **including the index**, and give the root a `HydrateFallback`.

## See also

- [HEADLESS.md](/docs/headless.md) — `setLinkComponent` in the primitive catalogue.
- [RECIPE-DASHBOARD.md](/docs/recipe-dashboard.md) — the dashboard component map.
- [CSS-LAYERS-PITFALL.md](/docs/css-layers-pitfall.md) — where your app's layer slot goes.
