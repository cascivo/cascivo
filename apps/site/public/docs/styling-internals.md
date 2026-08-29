<!--
  Generated from docs/ — do not edit here; run `pnpm regen`.
  Canonical: https://cascivo.com/docs/styling-internals.md
  registry v1.0.0 · generated 2026-08-26
-->

# Styling a component's internals

cascivo components ship CSS Modules, so their inner elements carry **hashed** class names
(`_navWrapper_1r5fv_83`). Those hashes change on every build — they are not a selector you
can target.

That leaves a real gap. Some things genuinely need reaching from the outside: pinning a
sidebar's width, giving a dialog body different rhythm, colouring one bar in a chart. Before
this page existed, adopters solved it with structural selectors:

```css
/* An adopter actually shipped this to stop AppShell's sidebar shrinking. */
div:has(> div > nav[aria-label='Main']) {
  flex-shrink: 0;
}
```

That works until the internal nesting changes, at which point it silently stops working.

So cascivo publishes **stable style hooks**: `data-cascivo-*` attributes on the structural
elements you are most likely to need. They are **public API** — covered by semver, listed in
each component's manifest (and therefore in `registry.json`, the `llms/*.md` files and the
docs site), and checked in CI by the `style-hooks` parity guard so an attribute cannot be
renamed or dropped without the manifest changing too.

## Using a hook

Put your rule in `@layer cascivo.override` — the top layer, so it beats everything cascivo
ships without a specificity fight:

```css
@layer cascivo.override {
  [data-cascivo-appshell-nav] {
    inline-size: 22rem;
  }
}
```

Unlayered CSS also wins (all unlayered author CSS beats every layer), but using the layer
keeps your intent explicit and survives later refactors of your own stylesheet.

## The hooks

| Attribute                    | Component  | Element                                                                                                    |
| ---------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `data-cascivo-appshell-nav`  | `AppShell` | the sidebar wrapper — the flex item that owns the sidebar's width                                          |
| `data-cascivo-appshell-main` | `AppShell` | the `<main>` scroll container                                                                              |
| `data-cascivo-modal-body`    | `Modal`    | the scrollable content region between header and footer                                                    |
| `data-cascivo-modal-footer`  | `Modal`    | the right-aligned action row (rendered only when `footer` is passed)                                       |
| `data-cascivo-drawer-body`   | `Drawer`   | the scrollable content region                                                                              |
| `data-cascivo-sheet-body`    | `Sheet`    | the scrollable content region                                                                              |
| `data-cascivo-logo`          | `Logo`     | the lockup wrapper, valued with the active variant (`mark`, `mark-accent`, `horizontal`, `stacked`, `nav`) |

## Prefer a token, then a prop, then a hook

A hook is the third choice, not the first:

1. **A component token.** Most spacing and colour is already a custom property you can
   re-point — `--cascivo-dialog-body-gap`, `--cascivo-shell-aside-inline-size`,
   `--cascivo-button-bg`. Set it on any ancestor and it cascades. See
   [`TOKENS.md`](/docs/tokens.md).
2. **A prop.** If the component exposes one (`size`, `footer`, `padding`), use it — props
   are typed and survive everything.
3. **A style hook**, for the layout facts neither of the above reaches.

If you need a hook that isn't listed, [open an issue](https://github.com/cascivo/cascivo/issues).
Adding one is cheap; discovering after the fact that everyone is depending on a hashed class
name is not.

## What is _not_ a contract

Everything else about a component's internals: the hashed class names, the element nesting,
the tag names, and any `data-testid` (those exist for cascivo's own tests and can change
freely). Selectors built on those will break, quietly, on a patch release.
