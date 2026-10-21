# v61 T2 — A2UI v0.9 Surface Renderer (`@cascivo/render/a2ui/v0_9`) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A cascivo app renders a stream of A2UI v0.9 messages from any agent and sends the user's actions back. The
agent may target either the cascivo catalog (real cascivo components) or the A2UI basic catalog (drawn with cascivo
components).

**Architecture:** There are two layers. A **React-free store** (`createA2uiStore`) parses each untrusted message once,
validates it against a *catalog spec*, and keeps per-surface state in signals: one signal per component id, and a JSON
data model with one cached `computed` per path. Because state lives in signals, an update to one component or one
data path re-renders only the nodes that read it. A **React layer** (`<A2uiSurface>`) renders a surface from its
`root` component. Each node is resolved through a *render catalog*: the cascivo catalog is generic over `componentMap`,
and the basic catalog uses hand-written adapters. The React layer also resolves literals, bindings and function calls,
wires two-way binding, and builds `action` messages. There is no runtime dependency beyond what `@cascivo/render`
already has.

**Tech Stack:** TypeScript strict, `@cascivo/core` signals (`signal`, `computed`, `batch`, `useSignals`), React ≥ 18,
`@cascivo/react` components, `@cascivo/i18n`, Vitest + @testing-library/react + jsdom, ajv (dev only, already present).

**Spec:** `docs/internal/ROADMAP-V61.md` § "T2 — `@cascivo/render/a2ui`" (including "T2 prerequisites found during
T1"). The A2UI v0.9 wire facts below were verified on 2026-10-21 against the raw schema files
`https://a2ui.org/specification/v0_9/{server_to_client,client_to_server,client_capabilities,client_data_model,common_types}.json`
and `…/catalogs/basic/catalog.json`.

## Decision: own renderer, not `@a2ui/react`

The roadmap left one question open, and it is settled. `@a2ui/react` 0.14.0 is Apache-2.0 and extensible. But it
depends on `@a2ui/web_core`, which pulls in `lit`, `@lit/context`, `zod` and its own `@preact/signals-core` store.
Since 0.13 it also renders the basic catalog as custom elements inside `display: contents` wrappers. That would add
a second reactivity system, a large dependency tree in owned code, and markup cascivo doesn't control. cascivo writes
its own thin processor from the published schemas instead. No `cascivo → @a2ui/react` binding ships in T2.

## Global Constraints

- **Wire version.** Emit `"version": "v0.9"`, the schema's `const`. Accept both `"v0.9"` and `"v0.9.1"` on input,
  because the spec prose examples use `v0.9.1`.
- **Catalog ids.** The cascivo catalog id is the T1 constant `A2UI_CATALOG_ID` (the https URL of
  `cascivo.com/a2ui/v0_9/catalog.json`). The basic catalog id is
  `https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json`.
- **No new runtime dependency.** No `@a2ui/*`, `zod`, `ajv` or `@cascivo/data` in `dependencies`.
  `@cascivo/render/a2ui/v0_9` is a new subpath of the published package. It is version-pinned, as the roadmap
  requires, so a v1.0 renderer can land beside it as `./a2ui/v1_0`.
- **Reactivity rules (CLAUDE.md).** Use signals from `@cascivo/core`. Never use `useState`, `useEffect`,
  `useContext`, `useReducer` or `useLayoutEffect`. `useRef` is only for DOM refs or always-current callbacks. Library
  source calls `useSignals()` before reading `.value` in render, because packages/render has no signals transform.
- **Untrusted input (CLAUDE.md).** Every message, component and data-model value is bound as `unknown` and narrowed
  once at the store boundary. Never apply `as` to a payload. URL props are checked with the existing `isSafeUrl` both
  at validation (literals) and at render (values bound from the data model).
- **Spec behaviours to implement exactly:**
  - Nothing renders until a component with `id: "root"` exists.
  - Components may arrive in any order. A missing child renders a placeholder.
  - `updateDataModel` with no `path` (or `/`) replaces the whole model.
  - `updateDataModel` with no `value`, or `value: null`, deletes the key. On an array index, delete sets the slot to
    `undefined` and keeps the length.
  - `surfaceId` and `catalogId` are fixed after `createSurface`. A second `createSurface` for a live id is an error.
  - The `action` message carries `name, surfaceId, sourceComponentId, timestamp (ISO 8601), context`. `context` is
    always present and is `{}` when empty.
  - The `error` message is either `{code:'VALIDATION_FAILED', surfaceId, path, message}`, where `path` is a JSON
    pointer like `/components/0/text`, or `{code:<other>, surfaceId, message}`.
  - A relative path (no leading `/`) only resolves inside a template scope.
- **Limits (defaults, overridable through options):** at most 16 surfaces per store, 1,000 components per surface,
  render depth 64, 10,000 JSON nodes per incoming data value, 256 characters per component id, and 256 characters per
  `regex` pattern.
- **Bundle.** `audit:bundle` measures render's whole `dist`. Raise `'@cascivo/render'` in
  `scripts/quality/bundle-check.ts` from 16 to 24, with a comment: "includes the opt-in `./a2ui/v0_9` subpath; importers
  of `.` don't load it". The `a2ui` chunk itself must stay ≤ 8 KB gzip (Task 9 measures it).
- **Commands.** Generated files are formatted by `vp check --fix`. `pnpm regen:check` stays green. The full `pnpm ready`,
  `pnpm isolated:check` and `pnpm pack:check` run in Task 9. Per-task gates are: `vp run @cascivo/render#test`,
  `vp run @cascivo/render#check`, `pnpm schema:check`, and `pnpm exec vp check --fix` on touched files.

## Review Focus

1. **Prototype-polluting paths.** `updateDataModel` or a bound input write to `/__proto__/x`, `/constructor/prototype/y`
   or `/a/__proto__` must be rejected with an error, and `Object.prototype` must be untouched. Test in Task 3.
2. **Cyclic or self-referencing children.** `a.children=['b']` with `b.children=['a']`, or `root.child='root'`, must
   render each id once on the current path, stop at the repeat with no stack overflow, and report one `RENDER_ERROR`.
   Test in Task 7.
3. **Unsafe URLs from the data model.** Image `url` bound to `{path:'/u'}` with `/u` = `"javascript:alert(1)"` (also
   `" java\tscript:…"`) must render no `src`/`href`. Test in Task 7.
4. **Out-of-order or orphan messages.** `updateComponents` before `createSurface` gives `SURFACE_NOT_FOUND` and no crash.
   Components that arrive before `root` stay invisible, then everything appears in one render once `root` arrives. A
   delete followed by a create of the same id starts from fresh state. Tests in Task 5 and Task 7.
5. **Hostile function input.** A `regex` with a 10,000-character or catastrophic pattern (`(a+)+$`) is capped or
   rejected by length and returns `false` without throwing. `formatString` with unbalanced `${` is rendered literally.
   Unknown functions give `UNKNOWN_FUNCTION`. Tests in Task 6.

---

## File structure

| File | Responsibility |
|---|---|
| `packages/components/src/**/*.meta.ts` (modify) | Task 1 prerequisites: declare `children` and the value/handler props. |
| `scripts/schema/generate-catalog.ts`, `catalog-model.ts` (modify) | Replace children inference with a drift gate, and emit runtime slot/event data. |
| `packages/render/src/a2ui-catalog-data.ts` (generated) | `a2uiComponents`: slots and events per renderable component, used at runtime. |
| `packages/render/src/prop-check.ts` (new) | Validator internals shared by `validate.ts` and A2UI. React-free. |
| `packages/render/src/node-props.ts` (new) | Prop helpers shared by `cascivo-view.tsx` and A2UI (`resolvePropValue`, `coerceEventValue`, `isTranslationRef`). |
| `packages/render/src/a2ui/pointer.ts` | JSON-pointer parse, resolve, get, and immutable set/delete. |
| `packages/render/src/a2ui/data-model.ts` | The signal-backed data model. |
| `packages/render/src/a2ui/messages.ts` | Wire types, `parseServerMessage`, and the client message builders. |
| `packages/render/src/a2ui/catalog-spec.ts` | The `A2uiCatalogSpec` interface and `cascivoCatalogSpec`. React-free. |
| `packages/render/src/a2ui/basic-spec.ts` | `basicCatalogSpec`, a hand table checked against the vendored basic catalog. React-free. |
| `packages/render/src/a2ui/functions.ts` | The 14 basic functions, `formatString`, and `resolveDynamic`. |
| `packages/render/src/a2ui/store.ts` | `createA2uiStore`: surfaces, apply, limits, capabilities. React-free. |
| `packages/render/src/a2ui/two-way.ts` | The `TWO_WAY` table. |
| `packages/render/src/a2ui/surface.tsx` | `<A2uiSurface>`, `A2uiNode`, the adapter input, and `cascivoCatalog`. |
| `packages/render/src/a2ui/basic-catalog.tsx` | `basicCatalog`: the basic-component adapters. |
| `packages/render/src/a2ui-v0_9.ts` | The public entry (`@cascivo/render/a2ui/v0_9`). |
| `packages/render/src/__fixtures__/a2ui/v0_9/basic_catalog.json` (vendored) | Basic catalog for the Task 5 parity test. |
| `packages/render/src/a2ui/*.test.ts(x)` | Tests, one file per module. |

---

### Task 1: Manifest prerequisites + children drift gate

**Files:**
- Modify: the `.meta.ts` of each of the 19 components whose `catalog.v1.json` `slots.children.implicit === true`:
  Accordion, Alert, AvatarGroup, Badge, Blockquote, Button, Card, Code, Columns, Grid, Heading, Kbd, Link, List, Modal,
  Status, Tabs, Tag, Text. Add `children: ReactNode` (required false, with a short description).
- Modify these manifests (verify every type against the component source before writing it):
  - `input.meta.ts`, `textarea.meta.ts`: add `value: string`, `defaultValue: string`, and
    `onChange: React.ChangeEventHandler<…>`.
  - `select.meta.ts`: add `value: string`, `defaultValue: string`, `onChange`.
  - `slider.meta.ts`: add `onChange`.
  - `radio-card` (the group's manifest): add `value: string`, `defaultValue: string`,
    `onValueChange: (value: string) => void`.
- Modify `scripts/schema/catalog-model.ts` and `generate-catalog.ts`. Remove the `implicit` slot inference and the
  `implicit` field, and update the T1 tests that asserted it (Button implicit, Toast/Radio absent stay valid). In its place add the gate
  `assertChildrenDeclared(name: string, manifestHasChildren: boolean, sourceUsesChildren: boolean | null): void`, which
  throws `"<Name>: renders children but its manifest does not declare \`children\` — add it to <file>.meta.ts"`. Keep
  `componentUsesChildren` and `NO_DECLARATION` as its inputs.
- Generate `packages/render/src/a2ui-catalog-data.ts` from `generate-catalog.ts`:
  ```ts
  // generated — do not edit (scripts/schema/generate-catalog.ts)
  export interface A2uiSlotInfo { readonly arity: 'one' | 'many'; readonly text?: true }
  export interface A2uiComponentInfo { readonly slots: Readonly<Record<string, A2uiSlotInfo>>; readonly events: readonly string[] }
  export const a2uiComponents: Readonly<Record<string, A2uiComponentInfo>>
  ```
  It covers renderable components only, with keys sorted.
- Tests: `scripts/schema/catalog-model.test.ts`, `packages/render/src/catalog.test.ts`.

- [ ] **Step 1: Failing tests.**
  - The gate throws for `('Button', false, true)` with the message above. It is a no-op for `(_, true, true)`,
    `(_, false, false)` and `(_, false, null)`.
  - The catalog has no `implicit` key anywhere.
  - `components.Input.props.properties.value.type === 'string'` and `'onChange' in components.Input.events`. The same
    holds for Textarea and Select, and `RadioCardGroup.events` includes `onValueChange`.
  - `a2uiComponents.Button.slots.children` deep-equals `{arity:'many', text:true}`, and `a2uiComponents.Button.events`
    includes `'onClick'`.
- [ ] **Step 2:** Run `pnpm schema:check` and `vp run @cascivo/render#test`. Expect failures.
- [ ] **Step 3:** Edit the manifests, then the generator. Run `pnpm regen`, which re-emits the registry, llms and the
  catalogs. Commit everything it changes.
- [ ] **Step 4:** Run `pnpm schema:check`, `vp run @cascivo/render#test`, `vp run @cascivo/components#test` and
  `pnpm regen:check`. Expect all to pass. Also run `pnpm lint:host-eslint`, because manifest edits feed adopter-facing
  docs.
- [ ] **Step 5:** Commit: `feat(components): declare children and value handlers in manifests; children drift gate`.

### Task 2: Share validator and prop internals

**Files:**
- Create `packages/render/src/prop-check.ts`, moving from `validate.ts` without changing behaviour:
  - `URL_KEYS`, `isSafeUrl(url: string): boolean`, and
    `checkUrls(value: unknown, key: string, path: string, errors: ValidationError[]): void`;
  - `checkShape(value, shape, path, errors, label)`, with `label` now required;
  - `closestName(name, candidates)`;
  - a new `checkPropValue(prop: PropSchema, value: unknown, path: string, label: string, errors: ValidationError[]): void`,
    which is the enum/primitives/shape part of `validateProps`.
- Create `packages/render/src/node-props.ts`, moving from `cascivo-view.tsx`: `isTranslationRef`,
  `resolvePropValue`, `coerceEventValue`, `getPath`.
- Modify `validate.ts` and `cascivo-view.tsx` to import from the new files. `./validate` must stay React-free.

- [ ] **Step 1:** Add `packages/render/src/prop-check.test.ts` with direct unit tests: `isSafeUrl` passes `'/a'` and
  `'https://x'`, and fails `' java\tscript:x'` and `'data:text/html,x'`. `checkPropValue` reports one error for an
  out-of-enum value.
- [ ] **Step 2:** Run `vp run @cascivo/render#test`. Expect it to fail because the module is missing.
- [ ] **Step 3:** Move the code.
- [ ] **Step 4:** Run `vp run @cascivo/render#test` (all existing tests stay green and unchanged) and
  `vp run @cascivo/render#check`. Run `vp run @cascivo/render#build`, then confirm the validate entry still imports no React:
  `grep -lE "from ?['\"]react" packages/render/dist/validate*.js` prints nothing.
- [ ] **Step 5:** Commit: `refactor(render): share validator and prop helpers for a second renderer`.

### Task 3: JSON pointer + data model

**Files:** create `packages/render/src/a2ui/pointer.ts`, `data-model.ts`, and their tests.

**Interfaces (produces):**
```ts
export class A2uiPathError extends Error {}
/** `/a/b` stays absolute; `b` inside scope `/items/0` → `/items/0/b`; relative with empty scope → A2uiPathError. */
export function resolvePath(path: string, scope: string): string
export function parsePointer(path: string): string[]        // RFC 6901 unescape (~1 → /, ~0 → ~); '' and '/' → []
export function getAt(root: unknown, segments: readonly string[]): unknown
/** Immutable upsert/delete with structural sharing; `value === undefined` deletes. */
export function setAt(root: unknown, segments: readonly string[], value: unknown): unknown
export interface DataModel {
  readonly root: ReadonlySignal<unknown>
  read(path: string): ReadonlySignal<unknown>               // absolute path; cached computed per path
  write(path: string, value: unknown): void                 // undefined | null → delete; '' or '/' → replace
  snapshot(): unknown
}
export function createDataModel(initial?: unknown, limits?: { maxNodes: number }): DataModel
```
**Rules:**
- `parsePointer` throws `A2uiPathError` for any segment equal to `__proto__`, `prototype` or `constructor`.
- An array segment must match `/^(0|[1-9]\d*)$/`.
- `setAt` on an array: an index below the length replaces the slot, an index equal to the length appends, and anything
  greater throws. Delete on an array index sets `undefined` and keeps the length.
- Missing intermediate containers are created as plain objects (`Object.create(null)` is not allowed, because values
  must serialise as normal JSON objects).
- `write` counts the nodes of the incoming value and throws `A2uiPathError('limit')` above `maxNodes` (default 10,000).
- `read(path)` returns the same signal instance for the same path. It only notifies when `getAt` changes by `===`,
  which structural sharing guarantees for untouched branches.

- [ ] **Step 1: Failing tests.**
  - `resolvePath('name', '/users/0') === '/users/0/name'`, and `resolvePath('/x', '/users/0') === '/x'`.
  - `parsePointer('/a~1b/c~0d')` deep-equals `['a/b', 'c~d']`.
  - `setAt({a:{b:1}, c:{}}, ['a','b'], 2)` keeps `.c` identical (`===`).
  - `setAt([1,2], ['1'], undefined)` gives `[1, undefined]` with length 2.
  - `setAt([1], ['3'], 0)` throws.
  - **Review Focus 1:** each of `'/__proto__/x'`, `'/constructor/prototype/y'` and `'/a/__proto__'` throws through
    both `parsePointer` and `DataModel.write`, and afterwards `({} as Record<string, unknown>).x === undefined`.
  - A `read('/a/b')` subscriber (`effect` counting runs) does not re-run on `write('/c', 1)`, but does on
    `write('/a/b', 3)`.
  - `write('/', {z:1})` replaces the model.
  - `write('/a', null)` deletes `a`.
  - The 10,001-node limit throws.
- [ ] **Step 2:** Run `vp run @cascivo/render#test`. Expect it to fail.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run the tests. Expect them to pass.
- [ ] **Step 5:** Commit: `feat(render): A2UI JSON-pointer data model on signals`.

### Task 4: Wire messages + catalog specs

**Files:**
- Create `packages/render/src/a2ui/messages.ts`, `catalog-spec.ts`, `basic-spec.ts`, and their tests.
- Vendor `packages/render/src/__fixtures__/a2ui/v0_9/basic_catalog.json` from the basic catalog URL. Add an entry in
  the existing `__fixtures__/a2ui/README.md`.

**Interfaces (produces):**
```ts
// messages.ts
export const A2UI_VERSION = 'v0.9'
export const BASIC_CATALOG_ID = 'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json'
export const A2UI_CATALOG_ID: string   // runtime copy of the T1 constant (scripts/schema/a2ui.ts is build-only)
export interface A2uiComponent { readonly id: string; readonly component: string; readonly props: Readonly<Record<string, unknown>> } // props = all keys but id/component
export type A2uiServerMessage =
  | { kind: 'createSurface'; surfaceId: string; catalogId: string; theme?: Readonly<Record<string, unknown>>; sendDataModel: boolean }
  | { kind: 'updateComponents'; surfaceId: string; components: readonly unknown[] }      // items narrowed by the store
  | { kind: 'updateDataModel'; surfaceId: string; path: string; value: unknown }          // path defaults to '/'
  | { kind: 'deleteSurface'; surfaceId: string }
export interface A2uiErrorMessage { version: 'v0.9'; error: { code: string; surfaceId: string; message: string; path?: string } }
export interface A2uiActionMessage { version: 'v0.9'; action: { name: string; surfaceId: string; sourceComponentId: string; timestamp: string; context: Record<string, unknown> } }
export function parseServerMessage(raw: unknown): { ok: true; message: A2uiServerMessage } | { ok: false; error: A2uiErrorMessage }
export function parseComponent(raw: unknown, index: number, surfaceId: string, maxIdLength: number): { ok: true; component: A2uiComponent } | { ok: false; error: A2uiErrorMessage }
export function errorMessage(code: string, surfaceId: string, message: string, path?: string): A2uiErrorMessage
export function actionMessage(input: { name: string; surfaceId: string; sourceComponentId: string; context: Record<string, unknown>; now?: Date }): A2uiActionMessage
// catalog-spec.ts
export interface A2uiIssue { readonly prop: string; readonly message: string }  // prop '' = component-level
export interface A2uiCatalogSpec { readonly id: string; has(component: string): boolean; validate(c: A2uiComponent): readonly A2uiIssue[] }
export const cascivoCatalogSpec: A2uiCatalogSpec   // id = A2UI_CATALOG_ID
// basic-spec.ts
export const basicCatalogSpec: A2uiCatalogSpec     // id = BASIC_CATALOG_ID
```
**Rules:**
- **`parseServerMessage`:**
  - Requires a plain object with `version` equal to `'v0.9'` or `'v0.9.1'` and exactly one of the four keys.
  - Anything else gives `INVALID_MESSAGE`, using the `surfaceId` when one can be read and `''` otherwise.
  - Field types are checked per the S2C schema. `updateComponents.components` must be a non-empty array.
- **`parseComponent`:**
  - Requires a non-empty string `id` of at most `maxIdLength` characters and a string `component`.
  - On failure the error is `VALIDATION_FAILED` with path `/components/<index>/id` or `/components/<index>/component`.
- **Common keys.** Both specs accept the common keys `accessibility` (`{label?, description?}` DynamicStrings),
  `checks` (array of `{condition, message}`), and `weight` (number, basic only). Anything else must be a known
  prop/slot/event, or the issue is `Unknown property "x". Did you mean "y"?`, using `closestName`.
- **Value shapes, used by both specs:**
  - A **Dynamic** value is a literal, `{path: string}` with no other keys, or `{call: string, args?: object,
    returnType?: string}`.
  - A **ChildList** is a `string[]` or `{componentId: string, path: string}`.
  - A **text slot** accepts a ChildList or a DynamicString.
  - An **Action** is `{event: {name: string, context?: object}}` or `{functionCall: {call, args?}}`, both without
    extra keys.
- **`cascivoCatalogSpec`:**
  - `has` uses `componentNames`.
  - Data props come from `propSchemas[name]`. A literal is checked with `checkPropValue` and `checkUrls`; a binding or
    call is accepted at validation time.
  - Slots and events come from `a2uiComponents[name]`.
  - A required data prop must be present as a literal, a binding or a call.
- **`basicCatalogSpec`:**
  - A compact hand table of the 18 basic components: prop name, value kind (`dynString | dynNumber | dynBool |
    dynStringList | childList | componentId | action | enum:[…] | literal`) and required flags, plus `checks` on the
    Checkable components.
  - The table must agree with the vendored fixture (test below).

- [ ] **Step 1: Failing tests.**
  - `parseServerMessage` accepts all four messages in both version spellings and rejects:
    - a missing version;
    - two message keys in one envelope;
    - `components: []`;
    - a non-object payload.
    Each rejection carries the right `surfaceId`.
  - `A2UI_CATALOG_ID` equals `catalogId` in `packages/render/schema/a2ui/v0_9/catalog.json` (read the file in the test),
    so the runtime copy can't drift from the generated catalog.
  - `actionMessage({…, now: new Date(0)})` gives `timestamp: '1970-01-01T00:00:00.000Z'` and `context: {}` when none
    is given.
  - The cascivo spec:
    - accepts `{id:'b', component:'Button', children:'Save', onClick:{event:{name:'save'}}}`;
    - rejects `variant:'huge'` (prop `variant`);
    - rejects `href:'javascript:x'` on Link;
    - rejects `foo:1` with a suggestion;
    - rejects `component:'Nope'` with prop `''`.
  - **Basic parity:** for every component in the fixture, the hand table's prop names and required list equal the
    fixture's (read with `node:fs` + JSON). The `ComponentCommon`/`CatalogComponentCommon` keys are handled as common.
- [ ] **Step 2:** Run `vp run @cascivo/render#test`. Expect it to fail.
- [ ] **Step 3:** Implement. Narrow everything; never apply `as` to input.
- [ ] **Step 4:** Run the tests. Expect them to pass.
- [ ] **Step 5:** Commit: `feat(render): A2UI wire parsing and catalog specs (cascivo + basic)`.

### Task 5: The surface store

**Files:** create `packages/render/src/a2ui/store.ts` and `store.test.ts`.

**Interfaces:**
- Consumes `createDataModel`, `parseServerMessage`, `parseComponent`, `errorMessage` and `A2uiCatalogSpec`.
- Produces:
  ```ts
  export interface A2uiLimits { maxSurfaces: number; maxComponents: number; maxIdLength: number; maxDataNodes: number; maxRenderDepth: number }
  export const DEFAULT_A2UI_LIMITS: A2uiLimits   // 16, 1000, 256, 10000, 64
  export interface A2uiSurfaceState {
    readonly id: string; readonly catalogId: string; readonly sendDataModel: boolean
    readonly theme: Readonly<Record<string, unknown>> | undefined
    readonly data: DataModel
    component(id: string): ReadonlySignal<A2uiComponent | undefined>   // stable instance per id
    readonly hasRoot: ReadonlySignal<boolean>
  }
  export interface A2uiStore {
    apply(raw: unknown): A2uiErrorMessage[]                 // never throws
    readonly surfaceIds: ReadonlySignal<readonly string[]>
    surface(id: string): A2uiSurfaceState | undefined
    capabilities(): { 'v0.9': { supportedCatalogIds: string[] } }
    clientDataModel(): { version: 'v0.9'; surfaces: Record<string, unknown> } | undefined  // only sendDataModel surfaces; undefined if none
    readonly limits: A2uiLimits
  }
  export function createA2uiStore(options: { catalogs: readonly A2uiCatalogSpec[]; limits?: Partial<A2uiLimits> }): A2uiStore
  ```
- **Error codes:** `INVALID_MESSAGE`, `SURFACE_EXISTS`, `SURFACE_NOT_FOUND`, `UNSUPPORTED_CATALOG`, `LIMIT_EXCEEDED`,
  `VALIDATION_FAILED` (with path), `INVALID_PATH` (data-model `A2uiPathError`). Later tasks add the render-time
  codes `UNKNOWN_FUNCTION` (Task 6), `RENDER_ERROR` (Task 7) and `UNSUPPORTED_COMPONENT` (Task 8), which are
  reported through `onError`, not returned by `apply`.
- **`updateComponents`:**
  - Applies each valid component inside one `batch`. An invalid component is not stored and yields one
    `VALIDATION_FAILED` per issue, at path `/components/<i>/<prop>`, or `/components/<i>` when the prop is `''`.
  - An id that is already present replaces that component.
  - Exceeding `maxComponents` stops at the limit with `LIMIT_EXCEEDED`.
- **`deleteSurface`** drops all state, so re-creating the surface starts fresh.

- [ ] **Step 1: Failing tests** (use a tiny fake `A2uiCatalogSpec` plus `cascivoCatalogSpec`):
  - The create → components → data → delete lifecycle.
  - **Review Focus 4:** `updateComponents` with no surface gives `SURFACE_NOT_FOUND`. `hasRoot` is false until a
    `root` arrives in a later message, then true.
  - A second `createSurface` on a live id gives `SURFACE_EXISTS`, and the original catalogId is unchanged.
  - An unknown catalogId gives `UNSUPPORTED_CATALOG`.
  - The 17th surface gives `LIMIT_EXCEEDED`.
  - An invalid component in a batch of three stores the other two and reports one error at `/components/1/variant`.
  - `component('x')` returns the same signal before and after `x` arrives, and its value is updated.
  - `capabilities()` lists both ids in options order.
  - `clientDataModel()` includes only surfaces created with `sendDataModel: true`.
  - A data write with a `__proto__` path gives `INVALID_PATH`.
  - `apply(42)` gives `INVALID_MESSAGE` and does not throw.
- [ ] **Step 2:** Run `vp run @cascivo/render#test`. Expect it to fail.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run the tests. Expect them to pass.
- [ ] **Step 5:** Commit: `feat(render): React-free A2UI surface store`.

### Task 6: Functions and dynamic-value resolution

**Files:** create `packages/render/src/a2ui/functions.ts` and `functions.test.ts`.

**Interfaces (produces):**
```ts
export interface ResolveContext { data: DataModel; scope: string; locale: string; openUrl: (url: string) => void; report: (e: A2uiErrorMessage) => void; surfaceId: string }
export function resolveDynamic(value: unknown, ctx: ResolveContext): unknown          // literal → itself; {path} → data.read(resolvePath(...)).value; {call} → callFunction
export function callFunction(call: string, args: Readonly<Record<string, unknown>>, ctx: ResolveContext): unknown
export function formatString(template: string, ctx: ResolveContext): string
export const BASIC_FUNCTIONS: readonly string[]   // the 14 names
```
**Semantics (from the basic catalog):**
- **Validators:**
  - `required`: the value is not null/undefined/`''`/`[]`.
  - `regex`: first `isSafeRegexPattern(pattern)`, an exported, unit-tested pure function. It rejects patterns over
    256 characters, backreferences (`\1`–`\9`, `\k<`), and nested quantifiers: a group containing `+`, `*` or `{`
    that is itself followed by `+`, `*` or `{`. JS has no linear-time regex engine, so the dangerous shapes are
    refused before they run. A rejected pattern, a value over 10,000 characters, or a pattern that fails
    `new RegExp(pattern, 'u')` (in try/catch) returns `false` and reports `VALIDATION_FAILED` for path
    `/args/pattern`.
  - `length`: string length within `min`/`max`.
  - `numeric`: a finite number within `min`/`max`.
  - `email`: the WHATWG `input[type=email]` pattern.
  - `and`/`or`/`not`: on booleans.
- **Formatters:**
  - `formatNumber`/`formatCurrency` use `Intl.NumberFormat(locale, {minimumFractionDigits: decimals,
    maximumFractionDigits: decimals, useGrouping: grouping ?? true, style, currency})`.
  - `formatDate(value, format)` implements the TR35 tokens `yy yyyy M MM MMM MMMM d dd E EEEE h hh H HH mm ss a`, with
    month and day names from `Intl.DateTimeFormat(locale)`. Quoted literals pass through. Unknown letters pass through.
  - `pluralize` uses `Intl.PluralRules(locale)`, choosing the category if it is provided and `other` otherwise.
- **`openUrl`** calls `ctx.openUrl(url)` only if `isSafeUrl(url)`. Otherwise it reports `VALIDATION_FAILED` for path
  `/args/url`.
- **`formatString`:**
  - `${/abs/path}` and `${rel/path}` resolve through `resolveDynamic`.
  - `${fn(name:value, …)}` uses named args. An arg is a quoted string, a number, `true`/`false`, or a nested `${…}`.
  - `\${` stays literal.
  - null/undefined becomes `''`, and objects/arrays become `JSON.stringify`.
  - An unbalanced `${` is emitted literally.
  - A hand-written scanner, never `eval` or `Function`.
- **Unknown function** names report `UNKNOWN_FUNCTION` and resolve to `undefined`.
- **Locale** defaults to `currentLocale()` from `@cascivo/i18n` when the caller passes `''`.

- [ ] **Step 1: Failing tests:**
  - every function, with at least one true and one false (or formatted) case;
  - `formatString('Hi ${/user/name}!')` with the model `{user:{name:'Ada'}}` gives `'Hi Ada!'`;
  - a nested call `'${formatNumber(value:${/n}, decimals:2)}'` with `n=3` gives `'3.00'` (locale `en`);
  - `'\${x}'` gives the literal `'${x}'`;
  - `formatDate` with the fixed date `2026-01-16T14:30:00Z` (UTC, locale `en`): `'MMM dd, yyyy'` gives
    `'Jan 16, 2026'` and `'h:mm a'` gives `'2:30 PM'`;
  - `pluralize(1, {one:'item', other:'items'})` gives `'item'`;
  - **Review Focus 5:** `isSafeRegexPattern` is false for `'(a+)+$'`, `'(a*)*'`, `'(a|aa){2,}'` and `'(\\w)\\1'`, and
    true for `'^[a-z]+$'` and `'\\d{3}-\\d{4}'`. `regex` with `'(a+)+$'` on 30 `a`s plus `!` returns `false`
    immediately, without running the pattern. A 300-character pattern gives `false`; `'${unclosed'` is literal; an
    unknown function gives `UNKNOWN_FUNCTION`.
- [ ] **Step 2:** Run `vp run @cascivo/render#test`. Expect it to fail.
- [ ] **Step 3:** Implement. Make `formatDate` use UTC getters when the test passes `timeZone: 'UTC'` via the
  internal `ctx` override, so the test is deterministic. Keep that option internal.
- [ ] **Step 4:** Run the tests. Expect them to pass.
- [ ] **Step 5:** Commit: `feat(render): A2UI basic functions and formatString`.

### Task 7: `<A2uiSurface>` and the cascivo render catalog

**Files:** create `packages/render/src/a2ui/two-way.ts`, `surface.tsx` and `surface.test.tsx`.

**Interfaces:**
- Consumes `A2uiStore`, `resolveDynamic`, `callFunction`, `actionMessage`, `a2uiComponents`, `propSchemas`,
  `componentMap`, `isSafeUrl`/`URL_KEYS` and `coerceEventValue`.
- Produces:
  ```ts
  export const TWO_WAY: Readonly<Record<string, { prop: string; event: string }>>
  // Input/Textarea/Select: value↔onChange; Slider: value↔onChange (number); Checkbox: checked↔onChange; Toggle: checked↔onValueChange;
  // DatePicker/TimePicker/NumberInput/Tabs/Search/Combobox/Accordion/RadioCardGroup: value↔onValueChange;
  // CheckboxCard: checked↔onCheckedChange; Pagination: page↔onPageChange; Modal: open↔onClose (writes false)
  export interface AdapterInput {
    readonly component: A2uiComponent
    prop(name: string): unknown                          // resolved value; URL keys pass isSafeUrl or are undefined
    children(ids: readonly string[]): ReactNode[]       // renders other nodes; placeholder when missing. Call at most ONCE per adapter render, while the adapter runs; place each returned node once
    slot(name: string): ReactNode                        // ChildList / ComponentId / text per the value's shape
    writer(prop: string): ((value: unknown) => void) | undefined    // set when prop is bound {path}
    action(prop: string): (() => void) | undefined                 // Action → dispatch
    failingChecks(): readonly string[]                   // messages of checks whose condition is false
  }
  export type A2uiAdapter = (input: AdapterInput) => ReactNode
  export interface A2uiRenderCatalog { readonly id: string; adapter(component: string): A2uiAdapter | undefined }
  export const cascivoCatalog: A2uiRenderCatalog
  export interface A2uiSurfaceProps {
    store: A2uiStore; surfaceId: string; catalogs: readonly A2uiRenderCatalog[]
    onAction?: (message: A2uiActionMessage, metadata: { a2uiClientDataModel?: ReturnType<A2uiStore['clientDataModel']> }) => void
    onError?: (message: A2uiErrorMessage) => void
    openUrl?: (url: string) => void; locale?: string; fallback?: ReactNode
  }
  export function A2uiSurface(props: A2uiSurfaceProps): ReactNode
  ```
- **Rendering rules:**
  - Each component renders through an internal `A2uiNode({id, scope, ancestors})` that calls `useSignals()`.
  - Before `hasRoot` the surface renders `fallback ?? null`.
  - A missing component renders `<Skeleton />` from `@cascivo/react`.
  - An id already in `ancestors`, or depth above `maxRenderDepth`, renders `null` and calls `onError` once per id with
    `RENDER_ERROR`.
  - A template child list iterates the array at `resolvePath(path, scope)` and renders `componentId` with scope
    `${abs}/${i}`.
- **`cascivoCatalog` (the generic adapter):**
  - Data props pass their resolved values.
  - Slots go through `slot`.
  - Event props whose value is an Action become handlers.
  - For a `TWO_WAY` component with its prop bound, the event handler writes `coerceEventValue(arg)` to the bound path
    first. Slider coerces to a number via `Number(...)`, Modal writes `false`. Then it dispatches the Action, if any.
  - `checks`: a failing check on Button sets `disabled: true`. On a component whose `propSchemas` has `error`, the
    first failing message goes into `error`.
  - `accessibility.label` goes into `ariaLabel` when the component declares it.
- **Actions:**
  - An `{event}` Action resolves each `context` value with `resolveDynamic` at dispatch time.
  - It calls `onAction(actionMessage(...), {a2uiClientDataModel: store.clientDataModel()})`, adding the key only when
    the surface has `sendDataModel`.
  - A `{functionCall}` Action calls `callFunction`.

- [ ] **Step 1: Failing tests** (render with @testing-library; the store has `cascivoCatalogSpec`):
  - **Hello world:** `Text` root with `children: 'Hello'` renders "Hello".
  - **Binding:** `Text` with `children: {path:'/greeting'}` updates when `updateDataModel` changes `/greeting`. A
    sibling node's render count stays the same; count with a test-only spy component registered through a test catalog.
  - **Two-way binding:** typing into `Input` bound to `/form/name` updates a `Text` bound to the same path. A Button
    `onClick` Action with `context:{name:{path:'/form/name'}}` calls `onAction` with
    `action.context.name === 'typed value'` and `version: 'v0.9'`.
  - **Template:** a `List` with children `{componentId:'row', path:'/items'}` and a row `Text` bound to relative
    `name` renders one row per item.
  - **Progressive rendering:** components sent before `root` render nothing, then all appear once `root` arrives. A
    missing child id renders a Skeleton.
  - **Review Focus 2:** `a↔b` cycle and `root.children=['root']`: no throw, and exactly one `RENDER_ERROR` per
    repeated id.
  - **Review Focus 3:** Image `src` and Link `href` bound to `javascript:alert(1)` and `" java\tscript:x"` render with
    no `src`/`href` attribute.
  - **`checks`:** a Button with a failing `required` check is disabled. An Input with a failing check shows the
    message as its error.
- [ ] **Step 2:** Run `vp run @cascivo/render#test`. Expect it to fail.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `vp run @cascivo/render#test` and `vp run @cascivo/render#check`. Expect both to pass.
- [ ] **Step 5:** Commit: `feat(render): <A2uiSurface> with the cascivo catalog`.

### Task 8: The basic catalog, drawn with cascivo

**Files:**
- Create `packages/render/src/a2ui/basic-catalog.tsx` and `basic-catalog.test.tsx`.
- Modify `packages/i18n/src/builtin.ts`, plus its `de` catalog, adding `cascade.a2ui.openMedia` ("Open media" /
  "Medien öffnen").

**Interfaces:** consumes `AdapterInput` and `A2uiAdapter`. Produces `export const basicCatalog: A2uiRenderCatalog`
(id `BASIC_CATALOG_ID`).

**Mapping (decided; implement exactly):**

| Basic | cascivo rendering |
|---|---|
| Text `text`, `variant` | `h1`–`h5` → `Heading level={n}`; `caption` → `Text size="sm" muted`; `body`/none → `Text`. The text is rendered verbatim, with no Markdown in T2. |
| Image `url`, `description`, `fit`, `variant` | `Image src alt` (`fit`/`variant` ignored) |
| Icon `name` | renders nothing; reports `UNSUPPORTED_COMPONENT` once per surface |
| Video / AudioPlayer `url`, `description` | `Link href={url} external` with text `description ?? t(builtin.a2ui.openMedia)` |
| Row / Column `children`, `justify`, `align` | `Flex direction="horizontal"/"vertical"`; justify `start/center/end` same, `spaceBetween|spaceAround|spaceEvenly` → `between`, `stretch` → `start`; align same names; `weight` ignored |
| List `children`, `direction`, `align` | `Flex` with `direction` (default vertical) |
| Card `child` | `Card` with the child |
| Tabs `tabs:[{title, child}]` | `Tabs` + `TabsList`/`TabsTrigger`/`TabsContent` from `@cascivo/react`; value `tab-<i>`; title through `resolveDynamic` |
| Modal `trigger`, `content` | a local `signal(false)` open state; trigger child rendered inside a wrapper that opens on click (if the trigger renders a `Button`, its click opens); `Modal open onClose` holding `content` |
| Divider `axis` | `Separator orientation` |
| Button `child`, `action`, `variant` | `Button`; `primary` → `primary`, `default` → `secondary`, `borderless` → `ghost`; failing checks → `disabled` |
| TextField `label`, `value`, `variant`, `validationRegexp` | `shortText` → `Input`, `longText` → `Textarea`, `obscured` → `Input type="password"`, `number` → `NumberInput` (writes `String(n)`); a failing check or regexp → `error` |
| CheckBox `label`, `value` | `Checkbox label checked` (two-way) |
| ChoicePicker `options`, `value`, `variant`, `label` | `mutuallyExclusive` → `Select` (value `value[0]`, writes `[v]`); `multipleSelection` → one `Checkbox` per option in a vertical `Flex` (writes the selected list) |
| Slider `value`, `min`, `max`, `label` | `Slider` (two-way, number) |
| DateTimeInput `value`, `enableDate`, `enableTime`, `min`, `max`, `label` | date only → `DatePicker`; time only → `TimePicker`; both → both in a horizontal `Flex`, value combined as `YYYY-MM-DDTHH:mm` |

- [ ] **Step 1: Failing tests:**
  - **End-to-end:** the spec's restaurant-booking-style JSONL fixture (write it in the test: `createSurface` on the
    basic catalog, a `Column` root with a `Text` h2, a `TextField`, a `DateTimeInput` and a `Button`) renders a heading,
    an input, a date picker and a button.
  - Typing and then clicking emits one `action` whose context has the typed value.
  - One test per mapping row asserting the rendered cascivo element: by role, or by the component's root class from
    its CSS module (use the existing test pattern).
  - Icon reports `UNSUPPORTED_COMPONENT` once. Video renders a link with the localized text.
- [ ] **Step 2:** Run `vp run @cascivo/render#test`. Expect it to fail.
- [ ] **Step 3:** Implement. Run `pnpm i18n:check` for the new key.
- [ ] **Step 4:** Run `vp run @cascivo/render#test`, `vp run @cascivo/render#check` and `pnpm i18n:check`. Expect all to
  pass.
- [ ] **Step 5:** Commit: `feat(render): A2UI basic catalog drawn with cascivo components`.

### Task 9: Public entry, packaging, docs, release gates

**Files:**
- Create `packages/render/src/a2ui-v0_9.ts`, exporting:
  - `createA2uiStore`, `A2uiSurface`, `cascivoCatalog`, `basicCatalog`, `cascivoCatalogSpec`, `basicCatalogSpec`;
  - `defaultCatalogs = [cascivoCatalog, basicCatalog]` and `defaultCatalogSpecs = [cascivoCatalogSpec, basicCatalogSpec]`;
  - `A2UI_VERSION`, `BASIC_CATALOG_ID`, `A2UI_CATALOG_ID`, `DEFAULT_A2UI_LIMITS`, `parseServerMessage`;
  - the types `A2uiStore`, `A2uiSurfaceProps`, `A2uiActionMessage`, `A2uiErrorMessage`, `A2uiComponent`,
    `A2uiRenderCatalog`, `A2uiAdapter`, `AdapterInput`, `A2uiCatalogSpec`, `A2uiLimits`.
  - `'use client'` at the top.
- Modify `packages/render/vite.config.ts` (add entry `'a2ui-v0_9': './src/a2ui-v0_9.ts'`) and
  `packages/render/package.json` (export `./a2ui/v0_9` → `dist/a2ui-v0_9.{js,d.ts}`, with `{types, import, default}`).
- Modify `packages/render/scripts/flatten-types.mjs` `ENTRIES` (add `{name:'a2ui-v0_9', src:'src/a2ui-v0_9.ts'}`).
- Modify `apps/site/vite.config.ts`: add the alias `'@cascivo/render/a2ui/v0_9'` → `packages/render/src/a2ui-v0_9.ts`
  **above** `'@cascivo/render'`.
- Modify `scripts/checks/isolated-install.test.ts`: import `createA2uiStore` and `A2uiSurface` from
  `@cascivo/render/a2ui/v0_9`.
- Modify `scripts/quality/bundle-check.ts`: budget 16 → 24 with the Global Constraints comment.
- Run `pnpm api:snapshot` and commit the change.
- Modify `packages/render/readme.body.md`: add a "Render A2UI" section with a 15-line usage example (store + surface +
  `onAction` + feeding messages), the two catalogs, security notes and limits.
- Add a changeset: `@cascivo/render` minor.
- Modify `docs/internal/ROADMAP-V61.md`: status T2 shipped, a decision-log row, the `@a2ui/react` decision, and mark the
  two T1 prerequisites done.
- Add one `docs/HEADLESS.md`-style catalogue entry only if `scripts/checks/primitive-docs.test.ts` requires it for new
  exports (check).

- [ ] **Step 1: Failing test** in `catalog.test.ts`: the `./a2ui/v0_9` export key exists and maps to `dist/a2ui-v0_9.js`
  and `dist/a2ui-v0_9.d.ts`. Also a smoke test importing `./a2ui-v0_9` to check every export listed above is defined.
- [ ] **Step 2:** Run `vp run @cascivo/render#test`. Expect it to fail.
- [ ] **Step 3:** Make the changes above.
- [ ] **Step 4:** Run `pnpm ready`, `pnpm isolated:check` and `pnpm pack:check`. All must pass. Then:
  - Report the gzip size of `packages/render/dist/a2ui-v0_9.js` and the chunks only it imports, which must be ≤ 8 KB,
    and the `audit:bundle` render total.
  - Confirm `pnpm --filter @cascivo/render pack --dry-run` lists `dist/a2ui-v0_9.js` and `dist/a2ui-v0_9.d.ts`.
- [ ] **Step 5:** Commit everything `regen`/`--fix` changed: `feat(render): ship @cascivo/render/a2ui/v0_9`.

---

## Out of scope (T3/T4 and later)

- **Transports.** SSE/JSONL helpers, the A2A metadata envelope and the AG-UI example are T3. The store takes already
  parsed objects.
- **MCP tools** (`get_a2ui_catalog`, `validate_a2ui`) are T4.
- **v1.0 features.** No v1.0 features, no Markdown in `Text`, no `Icon` rendering, no `weight` layout, and no inline
  catalogs (the store only knows the catalogs passed at creation).
