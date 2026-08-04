---
'@cascivo/core': minor
'@cascivo/react': minor
'@cascivo/charts': minor
'@cascivo/flow': minor
'@cascivo/editor': patch
---

Record each component's client-JavaScript cost in its manifest, and stop shipping `'use client'` from components that do not need it.

`ComponentMeta` and `BlockMeta` gain an optional `clientJs: 'none' | 'enhancement' | 'required'`:

- **`none`** — no client-only React API, no signal primitive, no DOM handler of its own. The
  server-rendered HTML is complete, and the component can render from a React Server
  Component without ever hydrating. Native-control wrappers land here even though they are
  interactive, because the platform supplies the interaction: `Slider` is an
  `<input type="range">`, `NativeSelect` a `<select>`, `Progress` a `<progress>`.
- **`enhancement`** — the server HTML is correct and **no content is unreachable** with JS
  off; client JS adds interaction on top.
- **`required`** — without client JS the component renders nothing useful, or a shell whose
  content is unreachable.

It flows into `registry.json` and each `llms/<name>.md` automatically, so an agent choosing
components can finally weigh their runtime cost. Nothing before this recorded it: an agent
reading the registry could not tell that `Badge` is free while `CommandMenu` brings a dialog,
a focus trap, a typeahead, and hydration.

**68 components are `none`, 11 `enhancement`, 24 `required`.** The remaining 101 are
deliberately left unclassified rather than guessed. `enhancement` versus `required` turns on
whether content is merely hidden or genuinely unreachable, which no static scan can decide —
a first mechanical pass cheerfully classified `Tabs`, `Carousel` and `Toast` as
`enhancement`, and all three are wrong. Absent means unclassified, not `required`.

`none` is derived from source and enforced in both directions by a new `client-js-parity`
guard (in `pnpm meta:check`): a manifest cannot claim `none` while using a client-only API,
and a clean component cannot understate itself as `enhancement`/`required` and quietly forfeit
the RSC win. The guard also fails a `none` component that ships `'use client'`.

**76 redundant `'use client'` directives were removed** across `@cascivo/react`'s components,
`@cascivo/charts` (`Kpi`, `Meter`, `Sparkline`, and six internal chrome modules) and
`@cascivo/flow` (`FlowBackground`, `FlowHandle`, `FlowPanel`). Those files use no
client-only React API at all. On the copy-paste path the CLI writes registry sources
verbatim, so the directive was landing in adopter projects and making purely static
components a client boundary for nothing.

No usage regresses. A Server Component passing `onClick` to `<Card>` already failed with the
directive present, because functions cannot cross the boundary in either direction.

The allowed-on-the-server API set was verified against React rather than assumed:
`forwardRef`, `memo`, `useId` and `use` **are** exported under the `react-server` condition;
`useState`, `useRef` and `createContext` are not.
