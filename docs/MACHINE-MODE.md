# Machine mode

Render a cascivo UI as a Markdown document — no CSS, no hydration, no interactivity. One
package, `@cascivo/text`, with three entry points depending on where the UI is.

```sh
pnpm add @cascivo/text
```

## The one rule

**Machine mode is the accessibility tree, serialized.** Every decision the serializer makes
reads what a screen reader reads: semantic elements, ARIA roles and states, accessible names.

That is not a stylistic choice, it is the only signal available. cascivo ships CSS Modules,
so class names are build-time hashes (`_badge_1r5fv_83`) that mean nothing and change on
every build. The accessible layer is the one part of a component's output that is specified,
tested (`apg:check`, `rtl:check`, the `enhancement-renders` sweep) and covered by semver.

Two consequences follow, and both are deliberate:

- **A component that serializes to nothing says nothing to assistive technology either.**
  Machine mode inherits the catalog's accessibility work — and inherits its gaps as visible
  bugs rather than silent ones.
- **You get charts for free.** `@cascivo/charts` already renders a visually-hidden data table
  beside every chart for screen readers, so a chart serializes to a Markdown table with no
  chart-specific code in the serializer at all.

## Server or agent: HTML in, Markdown out

```ts
import { renderToStaticMarkup } from 'react-dom/server'
import { toMarkdown } from '@cascivo/text'

const doc = toMarkdown(renderToStaticMarkup(<Dashboard />))
```

`@cascivo/react`'s `node` export condition resolves to the CSS-free twin, so this runs in a
bare Node process with no bundler and no stylesheet.

## In the browser: the live DOM, with what people have actually done to it

```ts
import { elementToMarkdown } from '@cascivo/text'

const doc = elementToMarkdown(document.querySelector('main')!)
```

This reads control *properties*, not attributes — the value someone typed, the box they
checked, the disclosure they opened. An HTML string only ever carries the state the UI was
rendered with.

## As a component

```tsx
import { TextView } from '@cascivo/text/react'

<TextView>
  <Dashboard />
</TextView>
```

The children render into a container that is `display:none`, `inert` and `aria-hidden`, and
the Markdown is shown instead. They render at all because that is where the state lives — a
`<TextView>` that serialized React elements would know what a form was given, never what
someone typed into it. There is one DOM tree, not two: no duplicated `useId()` values, no
second copy of the page competing for a screen reader's attention.

The document follows the live DOM, so it tracks typing, toggling and structural changes.

## From a `ViewConfig`

The JSON view runtime exposes `viewToMarkdown(config, { data })`, which turns a `ViewConfig`
into the same document its `<CascadeView>` would produce on screen. It renders the real
components and serializes their output rather than walking `ComponentNode`s, so it cannot
drift from what the components actually render.

That runtime is internal to the monorepo today and is not published to npm, so this entry
point is available to the docs, MCP and playground surfaces rather than to an installed app.
The other three work anywhere.

## What the document looks like

Affordances are named in one grammar — `[kind: name = value (state)]`:

```md
# Billing

[nav: Breadcrumb]

1. [Home](/)
2. Billing

Email [input = "ada@example.com"]
[checkbox: Remember me = checked]
[select: Plan = Pro]

[tab: Overview (selected)]
[tab: Usage]

| Name | Plan |
| --- | --- |
| Ada | Pro |

[button: Save changes] [button: Cancel (disabled)]
```

Set `annotate: false` for a pure reading document: affordances drop out, a button keeps its
label (those words are part of the page), a text field contributes nothing.

## What is kept, and what is dropped

| Kept | Dropped |
| ---- | ------- |
| Visually-hidden (`sr-only`) content — this is where a chart's data table lives | `aria-hidden`, `inert`, `hidden`, `display:none` subtrees |
| Collapsed disclosures, closed menus and dialogs, annotated with their state | `<script>`, `<style>`, `<canvas>` (decorative by contract) |
| ARIA states that a reader needs: `disabled`, `selected`, `expanded`, `current`, `invalid` | `data-state` at rest: `idle`, `default`, `active`, `inactive`, `on`, `off` |
| `data-state` values CSS pseudo-classes cannot express: `loading`, `error`, `open` | Decorative images (`alt=""`) and unnamed SVG |

Collapsed content is expanded on purpose. A human can click to reveal; a document cannot, and
a reader that silently drops half a page is worse than one that says which part was
collapsed.

## What it will not claim

`Modal` opens by calling `showModal()`, so an **open** modal's server HTML carries no `open`
attribute — nothing distinguishes it from a closed one. Machine mode prints no state there
rather than printing `(closed)`: a false statement about the UI is worse than a missing one,
because an agent cannot tell it from a true one. In the browser the property is readable, so
`elementToMarkdown` and `<TextView>` do report it.

## Options

| Option | Default | What it does |
| ------ | ------- | ------------ |
| `annotate` | `true` | Name the affordances and their state. |
| `links` | `'inline'` | `'inline'` keeps standard Markdown links; `'footnote'` numbers them and lists the URLs at the end; `'strip'` keeps the label only. |
| `width` | `0` | Wrap column for plain paragraphs. Tables, fenced code and lists are never wrapped. |

## Limits

- `toMarkdown` expects a renderer's output — well-formed, every non-void element closed. It
  does not implement implicit close tags (`<p>a<p>b`). For hand-written HTML, parse it with a
  real parser and pass the DOM to `elementToMarkdown`.
- Spacing that exists only in CSS (`gap` between two boxes) is not readable from markup, so
  an element boundary is treated as a word boundary — guarded against the case where it is
  not one (`<span>12</span><span>%</span>` stays `12%`).
- An SVG with no data table serializes to its accessible name and description, because that
  is genuinely all it offers a reader.
