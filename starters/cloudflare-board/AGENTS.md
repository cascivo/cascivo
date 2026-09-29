# Agent instructions — cascivo-board

This is a [cascivo](https://cascivo.com) app. When generating or editing CSS, follow
the **layer contract** — cascivo styles live in cascade layers, and layer order beats
selector specificity.

## CSS layer contract

1. Every declaration goes inside an `@layer` block. Unlayered CSS beats all layers
   regardless of specificity — never emit it.
2. Never invent layer names. Write only: your app slot `cascivo.example` (declared in
   the order statement in `index.html`) for page styles, and
   `@layer cascivo.override { … }` for hotfixes / one-off overrides — it beats
   everything cascivo ships.
3. Never nest layers deeper than the shipped `cascivo.blocks.<name>` pattern. For
   sub-elements, use native CSS nesting inside one layer block, not new sublayers.
4. Third-party CSS: `@import url('lib/styles.css') layer(vendor);` with `vendor`
   declared before the cascivo layers. Don't import vendor CSS from JavaScript — route it
   through a CSS file, or use `@cascivo/vite-plugin` (`cascivoLayers`) to layer it.
5. Style with `--cascivo-*` tokens, not raw values.

This app's declared layer order (in `index.html`):

```css
@layer vendor, cascivo.reset, cascivo.base, cascivo.tokens, cascivo.component,
  cascivo.platform, cascivo.theme, cascivo.blocks, cascivo.example, cascivo.override;
```

### Worked example — nesting, not new layers

```css
@layer cascivo.override {
  .projectCard {
    /* Sub-elements nest inside the one block — no cascivo.card.status sublayer. */
    .statusBadge {
      color: var(--cascivo-color-text-subtle);
      .pulseDot {
        background: var(--cascivo-color-success);
      }
    }
  }
}
```

## Routing

If you add a router, keep `src/Shell.tsx` and delete `src/App.tsx` + `src/sections/`.

cascivo links come in **two kinds**, wired two different ways. Do not intercept
`onClick`, and do not hand-wrap nav items:

1. **Config-driven navs** (`SideNav`, `ShellHeader`, `Breadcrumb`, `Switcher`) render
   through a module singleton. Register your router's Link once, in `src/main.tsx`:
   `setLinkComponent(({ href, ...rest }: LinkComponentProps) => <Link to={href ?? '#'} {...rest} />)`
2. **Links in page content** use `asChild`:
   `<Link asChild><RouterLink to="/x">x</RouterLink></Link>`

Full recipe: https://cascivo.com/docs/using-with-a-router.md

## Types

The vocabulary types are on a subpath: `import type { Tone } from '@cascivo/react/types'`
(also `Progress`, `SpaceStep`). `Status.status` and `Badge.variant` use them, so a
`Record<MyState, Tone>` is the supported way to map domain states onto tones. **Never**
add `@cascivo/core` to this app's dependencies — it is transitive here.

More: cascivo's machine-readable guide is at https://cascivo.com/llms.txt.

## Server

The API contract is `src/api.ts` (`defineApi` from `@cascivo/app/api`); its handlers are
`worker/index.ts` (`createHandler`), and the app calls it through `createClient`. Add an
endpoint to the contract first, with a parser for its input and output: parse every payload
that crosses the network, never cast it. A streaming endpoint's handler is an async
generator. `wrangler.jsonc` routes only `/api/*` to the Worker.

## Pages

A page is a file in `src/routes/` with a default export: `c/[id].tsx` serves `/c/:id` and
receives `{ params }: RouteProps<'/c/:id'>`. Never edit `src/routes.gen.ts`. Link with
`href`s (SideNav items, `router.Link`); navigate from code with `router.navigate(path)`,
and build a path with `buildPath('/c/:id', { id })`, both from `@cascivo/app`.

## Sharing

To show the user a running version, run `npm run deploy:preview`.
It needs no Cloudflare account. Give the user both URLs it prints: the live one, and the
claim URL. The deployment is public, and it is deleted after 60 minutes unless the user
opens the claim URL and signs in.
