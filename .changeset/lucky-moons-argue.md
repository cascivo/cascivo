---
'@cascivo/text': minor
---

Machine mode — render a cascivo UI as a Markdown document.

New package `@cascivo/text`: `toMarkdown(html)` for a server or agent process,
`elementToMarkdown(element)` for a live DOM subtree (reading typed values, checked boxes and
opened disclosures), and `<TextView>` from `@cascivo/text/react` to show a React tree as its
own text — or `useLiveMarkdown(ref)`, the hook it is built on, to show a UI beside its text.
`@cascivo/render/text` gains `viewToMarkdown(config)` for the JSON view format.

The serializer reads the accessibility tree — semantic elements, ARIA roles and states,
accessible names — because class names are build-time hashes that mean nothing. A chart
therefore serializes to a Markdown table with no chart-specific code, since `@cascivo/charts`
already renders that table for screen readers.

cascivo.com's landing page carries a live demo of it: the document panel is the serializer
running in the visitor's browser against the DOM of the UI panel beside it.

See `docs/MACHINE-MODE.md`.
