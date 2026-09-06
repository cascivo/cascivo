# Using cascivo with Ghost

**Status: tokens and themes only.** cascivo's design tokens and the twelve themes are plain
CSS and work in a Ghost theme. The **components do not** — and cannot, without changing what
a Ghost theme is. Read the next section before planning around them.

---

## What a Ghost theme can and cannot take

Ghost themes are [Handlebars templates](https://docs.ghost.org/themes/structure) (`.hbs`)
compiled by Ghost's own server, which sends publication content to the browser as static
HTML. There is no React renderer, no server-side JavaScript execution inside a theme, and no
bundler in the default workflow — you edit `.hbs` and `assets/`, zip, upload.

`@cascivo/react` ships React components. There is nothing in that pipeline that can mount
one, so there is no cascivo "Ghost theme" and no template that would produce one. This is a
runtime mismatch, not a gap in effort.

| | Works in a Ghost theme |
| --- | --- |
| `@cascivo/tokens` — the three-level custom-property system | ✅ plain CSS |
| `@cascivo/themes` — twelve themes, `data-theme` switching, dark mode | ✅ plain CSS |
| `@cascivo/react` — every component | ❌ React only |
| Signals, `@cascivo/core` primitives, the FSM layer | ❌ React only |

What you get is the **design system minus the component library**: one coherent color
system in `oklch`, a type and space scale, elevation, radii, motion tokens, and twelve
themes you switch with an attribute. You write the markup and the component CSS yourself,
against `var(--cascivo-*)` values instead of hard-coded ones.

If you want the components, the honest path is [headless Ghost](#headless-ghost) below.

---

## Installing the CSS

Ghost has no build step, and the shipped theme CSS uses **bare** `@import` specifiers
(`@import '@cascivo/tokens';`) that a browser cannot resolve. So flatten once on your
machine and commit the result into the theme.

### 1. Flatten

In a scratch directory (not the theme itself):

```sh
npm install @cascivo/themes esbuild
echo "@import '@cascivo/themes/light-dark.css';" > cascivo.css
npx esbuild cascivo.css --bundle --outfile=cascivo.flat.css
```

`light-dark.css` produces **~28 KB** unminified — tokens, the base layer, and the light and
dark themes, with every `@import` resolved and the cascade layer order intact. Add
`--minify` if you like. For all twelve themes use `@cascivo/themes/all.css` instead; for one
theme, import that theme's file (each self-imports the tokens it needs).

### 2. Drop it in

Copy the flattened file into the theme's asset folder:

```
your-theme/
├── assets/
│   └── css/
│       ├── cascivo.css      ← the flattened file
│       └── screen.css       ← your own theme CSS
├── default.hbs
├── index.hbs
└── post.hbs
```

### 3. Link it

In `default.hbs`, **before** your own stylesheet, and set the theme on `<html>`:

```hbs
<!DOCTYPE html>
<html lang="{{@site.locale}}" data-theme="light">
<head>
    {{!-- cascivo first: your own CSS is unlayered and will win over it --}}
    <link rel="stylesheet" href="{{asset "css/cascivo.css"}}">
    <link rel="stylesheet" href="{{asset "css/screen.css"}}">
    {{ghost_head}}
</head>
<body class="{{body_class}}">
    {{{body}}}
    {{ghost_foot}}
</body>
</html>
```

Then style against the tokens:

```css
.post-card {
  background: var(--cascivo-color-surface);
  color: var(--cascivo-color-text);
  border-radius: var(--cascivo-radius-lg);
  padding: var(--cascivo-space-6);
}
```

## Switching themes

Every theme is scoped to a `data-theme` attribute — there is no OS-preference media query in
the CSS, so nothing switches on its own. Set the attribute:

```hbs
<html data-theme="dark">
```

To follow the reader's OS setting, set it before first paint so there is no flash:

```html
<script>
  document.documentElement.dataset.theme =
    matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
</script>
```

`data-theme` works on **any** element, not just `<html>` — scope a single card or section to
a different theme by setting it there.

## Layering with your own CSS

cascivo ships everything inside `@layer` blocks, and **unlayered CSS beats every layer**
regardless of specificity. Your theme's own CSS is unlayered, so it already wins — which is
what you want. Two consequences worth knowing:

- You do not need `!important` to override cascivo. If you reach for it, something else is
  wrong.
- Ghost injects its own CSS through `{{ghost_head}}` (Portal, search, comments) and through
  Code Injection in the admin. That CSS is unlayered too, so it also beats every cascivo
  layer. `@layer cascivo.override` will **not** help you win against it — layers only order
  CSS that is itself in a layer. Raise specificity or scope the selector instead.

## Updating

Re-run the flatten step and replace `assets/css/cascivo.css`. Nothing else in the theme
changes — you are consuming custom properties, and the token names are stable across the 1.x
line.

---

## Headless Ghost

If the components are what you actually want, run Ghost headless: keep it as the editorial
backend and read the [Content API](https://docs.ghost.org/content-api) from a React front
end. That is not a special integration — it is the ordinary `react-vite` or `react-next`
setup with Ghost as the data source, so everything in
[`GETTING-STARTED.md`](./GETTING-STARTED.md) applies unchanged, and you get the whole
catalog.

The trade is Ghost's built-in theming, Portal, and the admin preview — you are building the
front end yourself.

```sh
npx cascivo create my-blog                     # Vite + React
npx cascivo create my-blog --framework astro   # or Astro, for content-heavy sites
```

Astro is often the better fit here: Ghost content is mostly static, and cascivo components
used with no client directive render to HTML with zero JavaScript. See
[`USING-WITH-ASTRO.md`](./USING-WITH-ASTRO.md).

---

## Verification status

- The flatten recipe is **verified**: `esbuild --bundle` over
  `@import '@cascivo/themes/light-dark.css'` resolves every bare specifier, emits ~28 KB,
  and preserves the canonical `@layer` order and both `[data-theme]` scopes.
- The Ghost side (template structure, `{{asset}}`, no build step, no server JS in themes)
  comes from [Ghost's own theme documentation](https://docs.ghost.org/themes/), not from a
  cascivo-built Ghost theme. There is no Ghost example app in this repo and no CI job
  exercising one — treat the `.hbs` snippets as a documented recipe, not a tested contract.
