# UI SDK analysis (2026-11)

> Sources (read 2026-11-13): ui-sdk.dev `/docs/core/changelog/introducing-ui-sdk`, `/docs/core`,
> `/docs/core/kernel/define-a-primitive`, `/docs/agents`, `/docs/agents/connect-an-agent/{webmcp,permissions,reference}`.
> UI SDK is in beta, from vercel-labs. Benchmark figures are reported by the vendor.

## Summary

UI SDK (`@ui-sdk/core` plus React/Vue/Svelte/Solid/Web adapters) is **not** generative UI: the
model does not write UI. It has two halves.

1. **A behaviour kernel for agents that write components.** `definePrimitive({ name, options,
   state, api, slots, agent })` is one framework-agnostic definition, and adapters render it as
   Radix-style unstyled parts. Each slot declares a `role` and a `focus` model (`roving`,
   `tab-stop`, `active-descendant`, `native`), and TypeScript rejects ARIA attributes that role
   does not allow. Options use string "kinds", not Zod. A testing kit checks keyboard, focus and
   ARIA.
2. **A runtime bridge for agents that operate the UI.** Mounted components register themselves.
   - `agent.snapshot()` returns a semantic list, not DOM or pixels, e.g.
     `{ref:"c1", component:"input", label, value, actions:["setValue","clear"]}`. It holds at most 100 entries.
   - `agent.act({steps:[{ref|label, action, args}]})` calls the component's `api` directly, with
     no simulated keys. It returns `changes`, `appeared` and `gone`.
   - `query()` finds components; `subscribe()` streams settled changes.
   - An `allow(step)` gate decides each action.
   - Markup marks: `data-agent-confirm` (needs a person), `data-agent-hidden`, `data-agent-secret` (redacted).
   - Change details carry `source: "agent"` and can be cancelled.
   - The same three tools (snapshot/act/query) are registered through **WebMCP**
     (`document.modelContext.registerTool`), so an in-page agent and a browser agent share them.
   - Vendor benchmark against browser tools: 5 tool calls instead of 16, 6.8k characters read
     instead of 39.8k, 16 s instead of 41 s, about half the cost.

There is no streaming, no wire protocol for remote agents and no component schema facing the model.

## How it changes UI development

- **Agent operability becomes a component contract**, like a11y. A component exposes its
  intent (actions, value and label) as a typed surface. The DOM and pixels are no longer what an
  agent reads. Browser-automation agents, which take screenshots and click, become the fallback.
- **WebMCP makes the page itself an MCP server.** Design systems that register tools natively
  avoid a Playwright layer between the agent and the UI.
- **Human and agent input share one path.** Validation lives in change callbacks, provenance
  (`source`) travels with each change, and the human approval gate is declarative markup.
  Handlers on key or pointer events are bypassed by agents, so they are not a safe place for invariants.
- **Coding agents get a type-checked kernel.** ARIA mistakes become compile errors instead of
  review comments.

## Mapping

| UI SDK idea | cascivo today | Fit |
|---|---|---|
| Behaviour kernel (`definePrimitive`, multi-framework) | `@cascivo/core`: signals, micro-FSM, `useRovingFocus`, `useTypeahead`, `FocusScope`, `DismissableLayer`. React only, by design | **Skip.** It conflicts with React-only, owned code and the CSS-native approach |
| Type-enforced ARIA per role | Manifest `accessibility` {role, keyboard, apgPattern}; `apg`/`primitives:check` gates; host ESLint | **Partial.** Gates cover it after the fact; more type-level checking would cost too much |
| Semantic snapshot (no DOM, no pixels) | `@cascivo/text` `from-dom.ts`: live a11y tree → Markdown (read-only, prose, no refs) | **Strong.** Add a structured JSON snapshot with stable refs and actions (WP1) |
| Typed actions that call the component API | `$actions` in render; A2UI `onAction` + `gesture.ts` (trusted-gesture check), `two-way.ts` | **Strong for render/A2UI.** The data model is already the API (WP3) |
| `agent` key on a primitive (actions, closed, secret) | Manifest `props`, `states`, `intent`; no agent section | **Strong.** Add an `agent` section to `.meta.ts` and generate it (WP2) |
| `allow` gate, `data-agent-confirm/hidden/secret` | `ToolCall` approval `actions`; AI-RULES "model URLs untrusted"; A2UI limits | **Strong.** WP1 handles the marks, WP3 the gate |
| WebMCP tool registration | MCP server (`packages/mcp`) serves the authoring side only (registry, scaffold, validate) | **Strong.** It adds the runtime side (WP3) |
| Change provenance `source:"agent"` + `cancel()` | `onValueChange(value)` only | **Defer.** It would change every handler signature. Revisit after WP3 proves demand |
| Skills + per-package Markdown for agents | `skills/*`, `llms.txt`, `llms/<component>.md`, AI-RULES, docspack | **Already ahead** |
| Generative UI (model emits UI) | ViewConfig + `validateView`, A2UI v0.9 streaming with skeletons, `.cv` → HTML | **Already ahead.** UI SDK has none |
| Source-to-DOM mapping (`data-review-loc`) | none | Low value for owned code; skip |

**Verdict:** cascivo already covers the "model writes UI" direction better than UI SDK. The idea
worth taking is the reverse direction: **agents operate a running cascivo UI through a structured
snapshot, typed actions, a mandatory gate and WebMCP**, reusing `@cascivo/text`, the manifests
and the A2UI store. Do not copy the multi-framework kernel.

## Work packages

Ranked by value divided by effort. The packages touch no files in common and can land in any order.
WP2's generated `agent` data is optional input for WP1 and WP3. Neither needs it to ship: both
infer actions from roles or the data model.

### WP1: `@cascivo/text` agent snapshot (high value, low effort)

- **Goal:** `snapshot(root)` returns a JSON list of operable nodes:
  `{ref, role, label, value?, checked?, expanded?, disabled?, options?, actions[]}`.
  - Refs must not change across calls: use a `WeakMap<Element, string>`.
  - Actions are inferred from the role: `textbox` → `setValue`/`clear`, `button` → `press`, `combobox`/`listbox` → `select`, `dialog` → `close`.
  - Honour `data-agent-hidden` (skip the subtree) and `data-agent-secret` (`"[redacted]"`, also
    password/OTP/card fields), and surface `data-agent-confirm` as `confirm`.
  - Cap the output at 200 nodes and report `truncated`.
  - Read-only: no act.
- **Files:**
  - new `packages/text/src/snapshot.ts` and `packages/text/src/snapshot.test.ts`
  - `packages/text/src/index.ts` (export)
  - `docs/MACHINE-MODE.md` (section "Structured snapshot")
- **Acceptance:**
  - Tests: a form with a text field, a select, a secret input and a hidden region.
  - Refs are identical across two calls and a re-render.
  - The secret value never appears in the output, the hidden subtree is absent, the cap is enforced.
  - `pnpm ready`, `pnpm isolated:check`, `pnpm pack:check` pass (published package).

### WP2: manifest `agent` section (medium value, low–medium effort)

- **Goal:** `.meta.ts` gets an optional `agent: { actions: {name, prop, args}[], secret?, confirm? }`
  that maps actions to existing props, e.g. `setValue` → `onValueChange`, `open` → `open`/`onOpenChange`.
  - It is generated into `registry.json` and `llms/<component>.md`.
  - A check requires each `prop` named in `agent` to exist in `props[]`.
  - Seed six components: input, select, checkbox, switch, dialog, tabs.
- **Files:**
  - the manifest type (`packages/registry/src/` meta types, plus `validate.ts` `parseItem`)
  - `scripts/registry/generate.ts`
  - the six `packages/components/src/<name>/<name>.meta.ts`
  - new `scripts/checks/agent-manifest.test.ts`
  - regenerated `registry.json` (via `pnpm regen`)
- **Acceptance:**
  - The new check fails when an action points at a missing prop.
  - `parseItem` rejects a malformed `agent` section (a test with an untrusted payload).
  - `registry.json` shows the section for all six components; `pnpm ready` is clean after regen.

### WP3: WebMCP bridge for rendered views (high value, medium effort)

- **Goal:** `registerViewTools(store, { allow })` in `@cascivo/render` registers
  `view_snapshot` / `view_act` on `document.modelContext` for an A2UI surface. It does nothing
  when WebMCP is absent.
  - `view_act` steps: `setValue` (a JSON pointer into the data model, through the existing `two-way.ts` path) and `action` (dispatch a component action through the same path as `onAction`).
  - `allow` is **required**: without it the function throws, so there is no default-open mode.
  - Steps run in order and stop at the first failure. The result is `{ok, error?, changes}`.
  - Payloads are bound as `unknown` and parsed once at the boundary (CLAUDE.md security rule);
    `DEFAULT_A2UI_LIMITS` apply.
- **Files:**
  - new `packages/render/src/a2ui/webmcp.ts` and `webmcp.test.ts`
  - `packages/render/src/a2ui-v0_9.ts` (export)
  - `docs/AI-RULES.md` (section "Letting an agent operate a view")
- **Acceptance:**
  - Tests with a stubbed `document.modelContext`: the tools are registered.
  - A missing `allow` throws, and `allow → false` leaves the data model unchanged.
  - A bad pointer or an unknown action gives `ok:false` with the step index.
  - A payload over the limits is rejected; with no WebMCP, nothing happens.
  - `pnpm ready`, `pnpm isolated:check`, `pnpm pack:check` pass.

### Deferred

- Change provenance (`details.source`) on every `onValueChange`: an API change across all
  components. Decide after WP3 shows real agent traffic.
- An adapter from `@cascivo/text` snapshot to WebMCP for arbitrary (non-render) React apps: compose WP1 and WP3 once both land.
