# cascivo — Roadmap v61: A2UI Study — Be the Best Design System to Render Agent UI

**Last updated:** 2026-10-20
**Status:** 🟢 T1 shipped. T2 to plan.
**Builds on:** ROADMAP-V40 (OpenUI study: bounded vocabulary + prop conformance, shipped), `@cascivo/render`
(`ViewConfig` + `CascivoView`), `@cascivo/mcp` (`get_view_grammar`, `validate_view`), `@cascivo/data`
(`parseSSE`), `starters/cloudflare-agent`.

---

## Why this roadmap exists

The brief: study [A2UI](https://a2ui.org/#how-it-works) and decide whether cascivo should support it, so that
cascivo is as well prepared as possible for agent-generated UI through its JSON format.

**Headline:** yes, add it, **as an adapter, not as a replacement for `ViewConfig`**. A2UI is the protocol with
the most momentum for *declarative*, host-styled agent UI. It is Google-backed, Apache-2.0, has about 16.8k
stars, and runs in Gemini Enterprise, Opal, Flutter GenUI, CopilotKit and AG-UI. Its core idea is the same bet
cascivo already made: the agent emits data, and the client renders it from a catalog of trusted components it
owns. Where A2UI is stronger is the *wire protocol*: streaming, incremental updates, a reactive data model, and
actions sent back to the agent. Those are exactly the items V40 deferred ("streaming + interop"). The trigger
condition V40 set for revisiting them has now been met: an external standard with real consumers exists.

V40 deferred `openui.json` interop because "there's little to consume it". A2UI is the opposite case. Agents
already emit it, so a cascivo renderer has an audience on day one.

## What A2UI is (v0.9.1, current; v1.0 is a candidate)

Sources: [spec v0.9.1](https://a2ui.org/specification/v0.9.1-a2ui/),
[v0.9 evolution guide](https://a2ui.org/specification/v0.9-evolution-guide/),
[v1.0 evolution guide](https://a2ui.org/specification/v1.0-evolution-guide/),
[repo](https://github.com/a2ui-project/a2ui), formerly `google/A2UI`.

A stream (usually JSONL) of agent→renderer messages, each `{"version": "v0.9.1", <one key>}`:

```json
{"version":"v0.9.1","createSurface":{"surfaceId":"booking","catalogId":"https://…/catalog.json"}}
{"version":"v0.9.1","updateComponents":{"surfaceId":"booking","components":[
  {"id":"root","component":"Column","children":["title","guests","submit"]},
  {"id":"title","component":"Text","text":{"call":"formatString","args":{"value":"Table for ${/user/name}"}}},
  {"id":"guests","component":"Slider","value":{"path":"/booking/guests"},"min":1,"max":8},
  {"id":"submit","component":"Button","child":"submit_label","action":{"event":{"name":"book","context":{"guests":{"path":"/booking/guests"}}}}},
  {"id":"submit_label","component":"Text","text":"Book"}]}}
{"version":"v0.9.1","updateDataModel":{"surfaceId":"booking","path":"/booking/guests","value":2}}
{"version":"v0.9.1","deleteSurface":{"surfaceId":"booking"}}
```

The protocol has these parts:

- **Flat adjacency list.** Components carry an `id` and reference children by id (`children: [ids]`, `child: id`,
  or a template `{path, componentId}` for lists). The model can emit components in any order, and each one
  can be replaced on its own. Nothing renders until `id: "root"` exists.
- **Data model.** Each surface has a plain JSON object. Props are either literals or
  `{path: "/json/pointer"}` bindings. Inputs write back to the model through two-way binding.
  `updateDataModel` patches a path, and a `null` value deletes the entry.
- **Actions.** A component's `action.event` resolves its `context` against the data model. It then sends
  `{action: {name, surfaceId, sourceComponentId, timestamp, context}}` to the agent.
  Validation failures go back as `{error: {code, surfaceId, path}}`.
- **Catalogs.** The client advertises `supportedCatalogIds` and, optionally, `inlineCatalogs` (full custom
  catalog definitions with prop schemas) in transport metadata. The agent then picks a `catalogId` per
  surface. v1.0 changes this to per-component and adds `allowedParents`/`allowedChildren`.
- **Basic catalog.** Row, Column, List, Card, Tabs, Divider, Modal, Text, Image, Icon, Video, AudioPlayer,
  Button, CheckBox, TextField, DateTimeInput, ChoicePicker and Slider, plus client functions: validators
  (`required`, `email`, `regex`, …) and formatters (`formatString`, `formatNumber`, `formatDate`, …).
- **Transport-agnostic.** It needs ordered, reliable delivery and nothing more. A2A and AG-UI are stable
  bindings. There are also guides for running it over MCP.
- **Renderers.** The official ones are React (`@a2ui/react`), Lit, Angular and Flutter, all stable for
  v0.9.1. Vercel's json-render also renders A2UI catalogs.

**Risks:** churn. v0.8 → v0.9 was a total break: message names, component shape, data model and binding
syntax all changed. v1.0 renames things again. The README still says "early-stage public preview". There is
no independent security review, and no dedicated security section in the spec beyond "data, not code".

## Where A2UI sits in the landscape

The agent-UI standards live at different layers, and these layers compose rather than compete
([AG-UI docs](https://docs.ag-ui.com/concepts/generative-ui-specs),
[A2UI ecosystem](https://a2ui.org/introduction/agent-ui-ecosystem/)):

| Layer | Standard | Does a design system plug in? |
|---|---|---|
| Transport | AG-UI (CopilotKit), A2A | n/a (carries payloads) |
| Declarative payload | **A2UI**, json-render (Vercel), OpenUI Lang (Thesys), Open-JSON-UI (OpenAI) | **Yes**: the host owns the catalog |
| Iframe payload | MCP Apps (SEP-1865; used by ChatGPT, Claude, VS Code) | Only inside the iframe bundle |
| Code | AI SDK RSC `streamUI` (paused), CopilotKit/LangGraph components-as-tools | Yes, as code |

The declarative layer is still fragmented, but all of its formats share one shape: *an agent emits JSON
against a host-owned, schema-described component catalog*. So the durable investment for cascivo is a
**protocol-neutral, machine-readable catalog**, with a thin adapter per wire format. A2UI should be the first
adapter, because it has the most consumers and a stable React path.

## What cascivo already has

cascivo already has most of the hard parts:

| A2UI needs | cascivo today | Gap |
|---|---|---|
| Trusted component catalog | `componentNames` allow-list (74 renderable), `componentMap`, host `components` extras | No catalog id/version, no export in A2UI catalog format |
| Prop schemas | `view.v1.json` + generated `prop-schemas.ts` from `registry.json` | One monolithic `if/then` schema. It is lossy for non-literal TS types (e.g. `AiBadge.children` → `enum: ["ReactNode"]`), and `typeDefs` are unused. There are no per-component schemas |
| Payload validation | `validateView` (React-free subpath, did-you-mean hints, URL-scheme checks, prop conformance) | No size/depth/node limits, no id/cycle checks (a flat list needs them), and `$actions` names are unchecked |
| Prompt grammar for the model | MCP `get_view_grammar`, built from manifests | Emits `ViewConfig` grammar only |
| Data binding | `bind: {prop: "$data.a.b"}` (dot-path, read-only), `$state` (flat primitives, signal per key) | No JSON Pointer, no agent-writable model, no two-way binding, no list templates |
| Actions | `events: {onClick: "$actions.x"}` calls host JS with raw args | No structured `{name, context}` resolved from data |
| Streaming | `@cascivo/data` `parseSSE`; `config` can be a `Signal<ViewConfig>` | A swapped config resets all `$state`, and partial trees fail validation |
| Reactive store | `signal`/`computed`/`batch`/`createScope` in `@cascivo/core` | No path-keyed store; this is new but small |
| Agent demo | `starters/cloudflare-agent` (validate in Worker, re-validate in browser) | One-shot `ViewConfig` per tool call |

Why not move `ViewConfig` itself to A2UI's shape? `ViewConfig` is also an *authoring* format: `cascivo generate`
turns it into TSX, the playground edits it, published views store it, and nested trees are what humans and
codegen want. A2UI is a *wire* format: flat, streamed, patchable. Keep each format where it is strong, and
convert between them at the boundary.

## Recommendation

### T1 — Protocol-neutral catalog export (do first; highest value, lowest risk)

Generate a per-component catalog from `registry.json` in `pnpm regen`:
`packages/render/catalog/cascivo.catalog.json`, with one JSON Schema per renderable component (props,
required, defaults, enums, descriptions, `intent.whenToUse`, and the event props that map to actions).

- Fix the generator's lossy cases while doing this. Turn `typeDefs` into object/array schemas, and model
  `ReactNode`/children as slot declarations (single child, list, text) instead of a literal enum. This also
  strengthens `validateView` for complex props such as `DataTable.columns`, which today pass unchecked.
- From the same data, emit an **A2UI inline-catalog** document (`a2ui/catalog.v0_9.json`, with a stable
  `catalogId` URL served from the docs site). Every other declarative standard (json-render/OpenUI Zod
  catalogs, CopilotKit tool schemas) can be fed from this same source later, without touching components.
- This benefits cascivo even if A2UI fades. It is the "AI-first JSON format" made explicit and portable.

### T2 — `@cascivo/render/a2ui`: an A2UI v0.9.1 surface renderer

The new subpath exports two things. `createA2uiSurface()`, a React-free store that takes messages, validates
them and returns errors, is the part a Worker can run. `<A2uiSurface surface={…} onAction={…} />` renders it.

- **Store:** a `Map<id, Signal<Component>>` plus a data model addressed by JSON Pointer, with one signal per
  touched path, `batch` for each message, and `computed` for bindings. Updating one component or one data
  path re-renders only its subscribers. This fits cascivo's signal model well, arguably better than a
  generic renderer could.
- **Rendering:** resolve ids to elements lazily from `root`. Render missing children as `Skeleton`, which the
  spec calls placeholders, so progressive streaming works by construction. Expand template children per
  item with a relative pointer scope.
- **Two catalogs:**
  1. The **cascivo catalog** (from T1), where an agent targets real cascivo components.
  2. The **A2UI basic catalog, rendered with cascivo components**, so any A2UI agent written against the
     basic catalog looks native in a cascivo app with no changes on the agent side. Mapping:
     Row/Column → `Flex`, List → `List`, Card → `Card`, Tabs → `Tabs`, Divider → `Separator`, Modal → `Modal`,
     Text → `Text`/`Heading`, Image → `Image`, Button → `Button`, CheckBox → `Checkbox`,
     TextField → `Input`/`Textarea`, DateTimeInput → `DatePicker`/`TimePicker`,
     ChoicePicker → `Select`/`RadioCardGroup`, Slider → `Slider`. Icon needs an `@cascivo/icons` binding.
     Video/AudioPlayer have no renderable cascivo component yet; render them as a safe link or leave them out
     of the advertised catalog.
- **Functions:** implement the basic catalog's validators and formatters with `Intl` (and `@cascivo/i18n` for
  locale), never `eval`.
- **Hardening:** this is untrusted input crossing the network, so follow the CLAUDE.md rule. Messages are
  bound as `unknown` and parsed once (`parseA2uiMessage`). Reuse the URL-scheme and prop-conformance checks.
  Add a cap on components, depth, string length and data-model size; checks for id uniqueness, cycles and
  unknown component names; and a per-component event allow-list. Failures produce A2UI `error` messages
  instead of throwing.
- **Version pinning:** pin the subpath to `v0_9` (`@cascivo/render/a2ui/v0_9`), so v1.0 can land beside it.
  Do not build on the v1.0 candidate until it is stable.

**Open question to settle in the first plan task:** use the official `@a2ui/react` with cascivo as a custom
catalog, or own the renderer? Owning it is likely the better choice. It gives signal-granular updates, cascivo's
validator and security posture, and no extra runtime dependency for a package adopters copy. But check first
whether `@a2ui/react` exposes a clean component-override hook. If it does, also ship a small
`cascivo → @a2ui/react` catalog binding, which is cheap and helps teams already standardised on it.

**T2 prerequisites found during T1:**

1. 24 renderable manifests omit `children` although the component renders children. T1 infers an implicit
   slot from source; the principled fix is declaring `children` in those manifests.
2. Input/Textarea manifests declare no `value`/`onValueChange` (HTML passthrough), so A2UI two-way binding
   has nothing to bind until they do.

### T3 — Transport glue and the dogfood path

- Add `a2uiFromSSE(response)` and `a2uiFromJsonl(stream)` helpers on top of `@cascivo/data`'s `parseSSE`.
- Upgrade `starters/cloudflare-agent` to stream A2UI messages into an `A2uiSurface` and send `action`s back to
  the Durable Object. This is the first live-streaming product V40 said streaming was waiting for.
- Add an AG-UI example (CopilotKit) that renders A2UI events through cascivo, since that is the most common
  React integration path.

### T4 — MCP + docs

- Add MCP tools: `get_a2ui_catalog` (inline catalog, optionally scoped to a subset of components) and
  `validate_a2ui` (validates a message stream and returns errors with paths). Extend `get_view_grammar` with a
  `format: "a2ui"` prompt generated from the same manifests.
- Add a docs page: "Render A2UI with cascivo", covering the basic catalog vs the cascivo catalog, security, and
  versioning. Add `llms.txt` entries.

### Not now

- **Replacing `ViewConfig`** with A2UI. Reason: different jobs (see above).
- **json-render / OpenUI adapters.** Revisit when there is demand. T1's catalog makes each one a small adapter.
- **MCP Apps (iframe).** This is a separate track: a prebuilt iframe bundle that renders a catalog payload with
  cascivo CSS and tokens. It is worth a study of its own, because ChatGPT and Claude host it, but bringing
  your own catalog does not apply there.
- **v1.0 features** (`callRendererFunction`, mixed catalogs per surface). Wait for v1.0 to be stable.

## Unverified points to check during planning

- Whether the npm package names `@a2ui/react` and `@a2ui/web-core` are correct, and how extensible they are
  (the study read docs only, not the packages).
- The exact literal `action` message in v0.9.1. (The catalog-definition format was verified against
  `https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json` and `common_types.json` on 2026-10-20.)
- The release cadence and the v1.0 timeline.

## Decision log

| Date | Decision |
|---|---|
| 2026-10-20 | Proposed (awaiting maintainer decision): A2UI support as an adapter over existing manifests and validator; `ViewConfig` stays. Order: T1 → T2 → T3 → T4. Pin to v0.9.1. |
| 2026-10-20 | Approved by maintainer. T1 implementation plan written. |
| 2026-10-20 | T1 shipped: catalog.v1.json + A2UI v0.9 catalog + view.v1 fixes + deep shape validation |
