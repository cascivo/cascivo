<!--
  Generated from docs/ — do not edit here; run `pnpm regen`.
  Canonical: https://cascivo.com/docs/compared-to-stylex.md
  registry v1.2.0 · generated 2026-09-08
-->

# cascivo compared to StyleX

StyleX is Meta's styling system: JavaScript style objects compiled to atomic CSS at build
time, shipped as the default at Facebook, Instagram, WhatsApp and Threads, and adopted in
2026 by Linear (from styled-components, over 1,000+ PRs) and Cursor (from Tailwind). It is
the most credible new answer to "how should a large app be styled", and it is worth
understanding before you pick either.

This page is a comparison, not a takedown. StyleX is good, and where it is better than
cascivo this page says so.

## The short version

**cascivo and StyleX agree on almost everything and disagree about the compiler.**

Both hold that styling should be resolved at build time, driven by typed design tokens,
predictable without specificity fights, and constrained enough that an agent cannot invent
a class name. StyleX reaches that destination by compiling JavaScript objects into atomic
CSS and polyfilling the cascade. cascivo starts there: it writes the CSS, uses real
`@layer`, and has no compiler to install.

If you want one sentence: **StyleX spends a Babel plugin to arrive at static CSS with
custom properties and cascade layers. cascivo just writes it.**

## Feature by feature

|                                            | cascivo                                                               | StyleX                                                                                |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Style runtime                              | None — plain CSS files                                                | None — compiled away                                                                  |
| Build step for styling                     | **None**                                                              | Babel plugin + bundler integration, required                                          |
| Cascade control                            | Real `@layer`, seven canonical layers                                 | Computed rule priority; `:not(#\#)` specificity polyfill where layers are unavailable |
| Token names                                | `--cascivo-color-accent` — flat, stable, typeable from memory         | Hashed at build (`defineVars`); needs an import                                       |
| Token checking                             | Lint rule, `satisfies` type, and CI audit, all from one generated set | Compiler error                                                                        |
| Styling at a distance                      | Prevented (hashed CSS Modules + published `data-cascivo-*` hooks)     | Prevented (selectors rejected by the compiler)                                        |
| Relational styling (parent hover, sibling) | Native `:has()` and `data-*` attributes                               | `stylex.when.*` + explicit markers (compiles to `:has()`)                             |
| Theming                                    | `data-theme` on any subtree; twelve themes ship                       | `createTheme()` on any subtree                                                        |
| Components                                 | A component library — accessible, tested, manifested                  | None — StyleX is only the styling layer                                               |
| DevTools                                   | Hashed CSS-Module class, one rule per element                         | Atomic classes (`x1abc x2def …`) plus `:not(#\#)`                                     |
| Dynamic styles at runtime                  | Any CSS custom property, set from JS                                  | Not available — everything must be statically analysable                              |
| Maturity                                   | 1.x, stable                                                           | 0.19.x — no 1.0 yet                                                                   |

Two rows deserve their own paragraph.

**Atomic CSS is solving a problem you may not have.** StyleX's atomic classes deduplicate
declarations across thousands of call sites in one bundle; Meta reports ~80% smaller CSS at
their scale. That is a real win at Meta's size. cascivo gets the same _shape_ of result from
a different mechanism — you install the components you use, so CSS grows with your component
count, not with how many times you render them.

**cascivo is not only a styling system.** StyleX is a way to write styles; you still choose
and build the components. cascivo ships the components, accessible and tested, with their
styles already written. Comparing them feature-for-feature on styling alone understates the
difference in what you get on day one — and overstates it if all you wanted was a way to
write CSS.

## Where StyleX is genuinely better

**Colocation.** In StyleX a component is one file: markup and styles in the same module, in
the same language. In cascivo a component is two — `button.tsx` and `button.module.css`.
That is a real ergonomic difference, and it is fair to say cascivo does not have what StyleX
has here. See [Colocation](#colocation-the-honest-tradeoff) below for why the trade is made
that way on purpose.

**One kind of thing to learn.** If your team has decided styles should be JavaScript
objects, StyleX is a coherent, well-designed way to do that, and cascivo's answer ("write
CSS") is not what you asked for.

**Meta's scale is proven.** StyleX runs Facebook and Instagram. That is a level of
production evidence cascivo does not have.

## Colocation — the honest tradeoff

cascivo splits a component into two files. This is deliberate, but it is not free, and it is
worth being straight about both halves.

**What the split costs.** Two files to open instead of one. Two files in a diff. An agent
editing a component has to hold both in context, and a change that touches markup and style
together touches two places.

**What the split buys.**

- **The second file is CSS.** Not a CSS-shaped object dialect — actual CSS, which every
  developer, every tool, and every model already knows. There is no API surface to learn
  between you and the platform: `:has()`, `@container`, `@layer`, `color-mix()` and
  anything that ships next year all work the day the browser supports them, with no
  compiler release in between.
- **It is why there is no build step.** A CSS file is already the artifact. Colocating
  styles into the component means compiling them back out, and that compiler is the thing
  cascivo does not want to own or ask you to install.
- **The structure/style split is the point, not a side effect.** Markup stays semantic and
  readable as markup. You are not reading JSX through a layer of styling objects to find
  the DOM.
- **It survives copy-paste.** `cascivo add button` copies both files into your project and
  they keep working, with no plugin in your bundler and nothing to configure.

**What we are not claiming.** We are not claiming two files is nicer than one. It is a price
paid for having no compiler, and if colocation matters more to you than that, StyleX is
making the other trade honestly and you should take it.

## Where cascivo is better

**No compiler, and therefore no compiler risk.** StyleX requires a Babel plugin and a
bundler integration, and everything it can express is bounded by what that compiler
supports. cascivo's styles are CSS files, so the ceiling is the browser's, and the setup
cost is an import.

**Token names an agent can type.** StyleX's `defineVars` generates collision-free hashed
custom-property names — excellent for isolation, and impossible to write from memory. Every
reference needs the right import resolved through the compiler. cascivo's names are flat and
stable (`--cascivo-color-accent`), so an agent can produce a correct override in a file with
no imports at all, and a human can read one in DevTools.

**The cascade is real, not polyfilled.** StyleX computes numeric priorities and emits
`@layer` — or, where it cannot, `:not(#\#)` selectors that make DevTools nearly unreadable.
cascivo declares one canonical layer order and lets the browser do it. Your override goes in
`cascivo.override` and wins, and you can see why in DevTools.

**Enforcement without a build.** StyleX's strongest argument is that a wrong token is a
compiler error. cascivo reaches the same place from a generated name set that a lint rule,
a `satisfies` type and the CI audit all read:

```tsx
// Editor: cascivo/token-values warns.
// CI:     cascivo audit --ai fails with unknown-token.
// Types:  `satisfies CascivoTokenStyle` is a compile error.
<div style={{ '--cascivo-color-acent': 'red' }} />
```

That third line is the part that needed building, and it exists because the failure is
otherwise completely silent — CSS drops an unknown custom property without a word.

**Relational styling is just CSS.** `stylex.when.ancestor(':hover')` plus a marker element
is a well-designed workaround for a compiler that will not let you write a selector.
cascivo targets browsers where `:has()` ships, so the parent-hover case is one line of CSS
and no marker.

**You get components.** Accessible, tested, manifested, themed, with an MCP server and
per-component docs generated from the same manifests. StyleX is the styling layer only.

## Which should you pick

**Pick StyleX** if you are building your own component library from scratch, your team wants
styles as JavaScript objects, you are at a scale where atomic deduplication measurably
matters, and you are happy to own a Babel plugin.

**Pick cascivo** if you want accessible components today, you would rather write CSS than
a CSS-shaped dialect, you want to add a design system to an app without adding a build step,
and you want the token and override contracts checked in your editor and your CI.

**They can coexist.** cascivo ships CSS in named layers and touches nothing global beyond
its own reset. If you already use StyleX, add `cascivo` to your layer order above
`cascivo.blocks` and the two cascade predictably — the same recipe as
[USING-WITH-TAILWIND.md](/docs/using-with-tailwind.md).

## Coming from StyleX — a translation table

| StyleX                                    | cascivo                                                                     |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| `stylex.create({ … })`                    | a `.module.css` file in `@layer cascivo.component`                          |
| `stylex.props(styles.a, styles.b)`        | `className={cn(styles.a, styles.b)}`                                        |
| `stylex.defineVars({ … })`                | `--cascivo-*` custom properties (or your own, in your layer)                |
| `stylex.createTheme(vars, { … })`         | `[data-theme="…"]` on any element — see [THEMING.md](/docs/theming.md)      |
| `StyleXStyles<{ width, height }>` prop    | component props + tokens; `data-cascivo-*` hooks for internals              |
| `stylex.when.ancestor(':hover')` + marker | `.parent:hover .child`, or `:has()`                                         |
| The compiler rejects an unknown token     | `cascivo/token-values`, `satisfies CascivoTokenStyle`, `cascivo audit --ai` |
| Last style wins                           | `@layer` order wins — `cascivo.override` beats everything cascivo ships     |

## See also

- [AI-RULES.md](/docs/ai-rules.md) — the layer contract, the override ladder, and the
  no-styling-at-a-distance principle.
- [STYLING-INTERNALS.md](/docs/styling-internals.md) — the `data-cascivo-*` hooks.
- [TOKENS.md](/docs/tokens.md) — the full token catalog.
- [CSS-LAYERS-PITFALL.md](/docs/css-layers-pitfall.md) — running cascivo's layers next to
  another system's.
