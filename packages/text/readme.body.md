Machine mode for cascivo: serialize a rendered UI to Markdown, for agents that need to know
what a page **says** rather than what its source says. No CSS, no hydration, nothing to click.

> **Docs offline?** The full cascivo reference ships as an npm package — `npx -y @cascivo/docs`, no website needed.

## Install

```sh
pnpm add @cascivo/text
```

## Use

```ts
import { renderToStaticMarkup } from 'react-dom/server'
import { toMarkdown } from '@cascivo/text'

const doc = toMarkdown(renderToStaticMarkup(<Billing />))
```

```md
### Billing Active

Email [input = "ada@example.com"]

[checkbox: Email me a receipt = checked]

| Name | Plan |
| ---- | ---- |
| Ada  | Pro  |

[button: Save changes] [button: Cancel (disabled)]
```

## Four entry points

| Where the UI is                      | Use                                                                                            |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| A server or agent process, as HTML   | `toMarkdown(html, options?)`                                                                   |
| The browser, as a live DOM subtree   | `elementToMarkdown(element, options?)` — reads typed values, checked boxes, opened disclosures |
| A React tree you want shown as text  | `<TextView>` from `@cascivo/text/react`                                                        |
| A React tree shown _beside_ its text | `useLiveMarkdown(ref)` from `@cascivo/text/react`                                              |

## The one rule

**Machine mode is the accessibility tree, serialized.** Class names are build-time hashes and
mean nothing; the accessible layer is the part of a component's output that is specified,
tested and covered by semver.

A chart therefore serializes to a Markdown table with no chart-specific code in the
serializer — `@cascivo/charts` already renders that table for screen readers. And a component
that serializes to nothing is one that says nothing to assistive technology either.

## Options

| Option     | Default    | What it does                                                                                         |
| ---------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `annotate` | `true`     | Name the affordances and their state.                                                                |
| `links`    | `'inline'` | `'inline'` keeps standard Markdown links; `'footnote'` numbers them; `'strip'` keeps the label only. |
| `width`    | `0`        | Wrap column for plain paragraphs. Tables, fenced code and lists are never wrapped.                   |

Full guide, including what is kept and what is dropped:
[MACHINE-MODE.md](https://github.com/cascivo/cascivo/blob/main/docs/MACHINE-MODE.md).
