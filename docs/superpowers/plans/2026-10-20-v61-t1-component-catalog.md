# v61 T1 — Protocol-Neutral Component Catalog + A2UI v0.9 Catalog Export — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `pnpm regen` emits a machine-readable catalog of every component `<CascivoView>` can render. It
comes as two files: a protocol-neutral `catalog.v1.json`, and an A2UI v0.9 custom catalog derived from it.
Both ship in `@cascivo/render`, and the A2UI file is also served from the docs site at its `catalogId`.

**Architecture:** A small parser turns each manifest prop's TypeScript `type` string into a type tree. A
classifier then sorts each prop into one of four kinds: **data** (described by a JSON Schema), **slot**
(ReactNode), **event** (an `on*` handler), or **omitted** (with a reason). A generator builds the neutral
catalog from those kinds. A projection maps the neutral catalog onto A2UI's verified v0.9 component format.
The same parser also fixes the lossy enum bug in `view.v1.json`, and feeds deep shape checks to `validateView`.

**Tech Stack:** Node `--experimental-strip-types` scripts (`node --test` for script tests), Vitest in
`packages/render`, JSON Schema draft 2020-12, ajv 8 (devDependency, tests only).

**Spec:** `docs/internal/ROADMAP-V61.md` § "T1 — Protocol-neutral catalog export".

## Global Constraints

- The A2UI target is **v0.9** (spec v0.9.1). The common-types base URL is
  `https://a2ui.org/specification/v0_9/common_types.json#/$defs/`, and the basic catalog is
  `https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json`. Both formats were verified against the
  live files on 2026-10-20.
- The cascivo A2UI `catalogId` (and `$id`) is the https URL of `cascivo.com/a2ui/v0_9/catalog.json`. The plan
  writes it without the scheme on purpose: `pnpm doc-urls:check` rejects cascivo.com links that don't resolve,
  and this one only resolves once Task 4 writes `apps/site/public/a2ui/v0_9/catalog.json`.
- The neutral catalog `$id` is
  `https://raw.githubusercontent.com/cascivo/cascivo/main/packages/render/schema/catalog.v1.json`. This
  matches the `view.v1.json` convention.
- The catalog covers exactly the names in `packages/render/src/component-names.ts` (74 today). For names
  shared by several registry entries, use the existing `TYPE_RANK` choice (component < block < chart <
  section < layout).
- Generated files are deterministic: keys are sorted, there are no timestamps, and the output is
  `JSON.stringify(x, null, 2) + '\n'`. `pnpm regen:check` must stay green.
- Parsed manifest data is bound as `unknown` or narrowed types. Never `as` the registry payload into the
  catalog types. Narrow first, then cast (CLAUDE.md security rule).
- Changing a published package means running `pnpm isolated:check` and `pnpm pack:check` as well as
  `pnpm ready`.
- No new runtime dependency in `@cascivo/render`. `ajv` is a devDependency only.

## Review Focus

1. **Bare identifiers treated as string literals.** `ReactNode`, `SortState` and `boolean | 'generating'` must
   never become `enum` members. This is the bug `view.v1.json` has today (`AiBadge.children` →
   `enum: ["ReactNode"]`). The test is in Task 1 (parser) and Task 5 (artifact).
2. **Prop names that collide with A2UI's reserved keys.** A cascivo prop named `id`, `component` or
   `accessibility` would clash with A2UI's `ComponentCommon`. It must be omitted from the A2UI projection with
   reason `reserved-name`, and must never silently override the common key. The test is in Task 4.
3. **Unresolvable required fields.** If a required field inside an object typedef can't be represented, the
   whole prop is omitted. Emitting a schema that no real value can satisfy is wrong. The test is in Task 2.
4. **Defaults the manifest writes as prose.** Defaults such as `md`, `'md'`, `"16rem"`, `[]` and `16 / 9`
   must be parsed relative to the prop's schema. A default that doesn't validate is dropped instead of
   emitted wrongly. The test is in Task 2.
5. **Valid existing ViewConfigs.** The deep shape checks must not reject configs that render correctly today.
   That covers every `examples`/playground config and every `TranslationRef` used as a string. The test is in
   Task 6.

---

## File structure

| File | Responsibility |
|---|---|
| `scripts/schema/ts-type.ts` (new) | `parseTsType`: TS type string → `TsType` tree. Pure, no I/O. |
| `scripts/schema/catalog-model.ts` (new) | `classifyProp`, `toJsonSchema`, `parseDefault`, `buildCatalog`, plus the catalog types. Pure. |
| `scripts/schema/a2ui.ts` (new) | `toA2uiCatalog(catalog)`: neutral → A2UI v0.9. Pure. |
| `scripts/schema/generate-catalog.ts` (new) | I/O: reads registry and component names, then writes the three outputs. |
| `scripts/schema/*.test.ts` (new) | `node --test` unit tests for the three pure modules. |
| `scripts/schema/generate.ts` (modify) | Uses `toJsonSchema` for `view.v1.json` props and emits `shape` into `prop-schemas.ts`. |
| `packages/render/schema/catalog.v1.json` (generated) | The neutral catalog. |
| `packages/render/schema/a2ui/v0_9/catalog.json` (generated) | The A2UI catalog (published copy). |
| `apps/site/public/a2ui/v0_9/catalog.json` (generated) | The same bytes, served at the `catalogId` URL. |
| `packages/render/src/catalog.test.ts` (new) | Artifact tests, plus ajv instance tests against vendored A2UI common types. |
| `packages/render/src/__fixtures__/a2ui/v0_9/common_types.json` (new, vendored) | A copy of A2UI's common types for offline ajv tests (Apache-2.0, with a README for attribution). |
| `packages/render/src/validate.ts` (modify) | Checks `shape` deeply for object and array props. |
| `package.json`, `packages/render/package.json`, `pnpm-workspace.yaml` (modify) | Scripts, exports and the ajv devDependency. |

---

### Task 1: TS type-string parser

**Files:**
- Create: `scripts/schema/ts-type.ts`, `scripts/schema/ts-type.test.ts`
- Modify: `package.json` (add a `"schema:check": "node --experimental-strip-types --test scripts/schema/*.test.ts"`
  script, and add `&& pnpm schema:check` to `ready` straight after `pnpm regen:check`)

**Interfaces:**
- Produces:
  ```ts
  export type TsType =
    | { kind: 'primitive'; name: 'string' | 'number' | 'boolean' | 'null' | 'undefined' }
    | { kind: 'literal'; value: string | number | boolean }
    | { kind: 'union'; members: TsType[] }          // flattened, ≥2 members
    | { kind: 'array'; element: TsType }            // `T[]` and `Array<T>`
    | { kind: 'object'; fields: TsField[] }          // inline `{ a: T; b?: U }`, `;` or `,` separated
    | { kind: 'function' }                           // any `(…) => X`
    | { kind: 'ref'; name: string; args: TsType[] }  // `ReactNode`, `React.ReactNode`, `Column<Row>`, `Intl.NumberFormatOptions`
  export interface TsField { name: string; optional: boolean; type: TsType }
  /** null when the string is not in the supported subset (tuples, mapped/conditional types, …). */
  export function parseTsType(src: string): TsType | null
  ```

- [ ] **Step 1: Write the failing tests** in `ts-type.test.ts` (`node:test` + `node:assert/strict`), one `it`
  per case, using the shapes from the census of today's renderable props:
  - `'string'` → primitive string. `"'sm' | 'md'"` → union of two string literals.
    `'1|2|3|4|5|6|8|10|12'` → union of number literals.
  - **Regression:** `'ReactNode'` → `{kind:'ref', name:'ReactNode', args:[]}`, *not* a literal.
    `"boolean | 'generating'"` → union of a primitive boolean and the literal `'generating'`.
  - `'React.ReactNode'` → ref with name `React.ReactNode`. `'Column<Row>[]'` → array of
    `ref Column` with args `[ref Row]`.
  - `'{ label: string; href?: string }[]'` → array of an object with fields label (required) and href (optional).
  - `"({ label: string; value: string; icon?: ReactNode; disabled?: boolean } | { kind: 'separator' })[]"` →
    array of a union of two objects.
  - `'number | { base?: number; sm?: number }'` → union of number and object.
  - `'(row: Row) => ReactNode'` and `'() => void'` → `{kind:'function'}`.
  - `'React.MouseEventHandler<HTMLButtonElement>'` → ref (the classifier decides it is an event, not the parser).
  - `'string | false'`, `'number | null'` → unions of a primitive and a literal or null.
  - `'[number, number]'` and `'keyof T'` → `null`.
- [ ] **Step 2:** Run `node --experimental-strip-types --test scripts/schema/ts-type.test.ts`. Expect it to fail
  because the module is not found.
- [ ] **Step 3: Implement `parseTsType`** as a recursive-descent parser over a small tokenizer (identifiers
  with dots, string/number literals, `| & ( ) [ ] { } < > ; , ? : =>`). Detect a function by a top-level `=>`
  after a parenthesised group. Treat `Array<T>` as an array.
- [ ] **Step 4:** Run the test again. Expect it to pass.
- [ ] **Step 5:** Commit: `feat(schema): parse manifest TS type strings into a type tree`.

### Task 2: Prop classifier, JSON-Schema mapping, defaults

**Files:**
- Create: `scripts/schema/catalog-model.ts`, `scripts/schema/catalog-model.test.ts`

**Interfaces:**
- Consumes: `parseTsType`, `TsType` (Task 1). `PropMeta`/`TypeDefMeta` shapes, re-declared locally as in
  `generate.ts`, because scripts don't import `@cascivo/core`.
- Produces:
  ```ts
  export type JsonSchema = Record<string, unknown>
  export interface ResolveContext {
    typeDefs: ReadonlyMap<string, TypeDefMeta>   // keyed by exact name AND by name without generics ('Column<Row>' and 'Column')
    typeParams: ReadonlySet<string>              // generic params found in typeDef names, e.g. 'Row' from 'Column<Row>'
  }
  export type PropClass =
    | { kind: 'data'; schema: JsonSchema }
    | { kind: 'slot'; arity: 'one' | 'many' }
    | { kind: 'event' }
    | { kind: 'omitted'; reason: 'function' | 'unresolved-type' | 'unparseable' }
  export function toJsonSchema(t: TsType, ctx: ResolveContext, inData: boolean): JsonSchema | null
  export function classifyProp(prop: PropMeta, ctx: ResolveContext): PropClass
  export function parseDefault(raw: string, schema: JsonSchema): { value: unknown } | undefined
  export function contextFor(typeDefs: readonly TypeDefMeta[] | undefined): ResolveContext
  ```

**Rules** (these are the decisions the implementer cannot make alone):
- `toJsonSchema`:
  - A primitive maps to `{type}`. `undefined` members are dropped from unions.
  - All-string literals map to `{type:'string', enum}`, and all-number literals to `{type:'number', enum}`.
    `true | false` maps to `{type:'boolean'}`.
  - Any other union maps to `{anyOf:[…]}`, with literal members grouped by type.
  - An object maps to `{type:'object', properties, required?, additionalProperties:false}`. Drop optional fields
    that can't be represented. If a *required* field can't be represented, return `null` (Review Focus 3).
  - An array maps to `{type:'array', items}`.
  - A ref resolves through `ctx.typeDefs` to the typedef's fields, with the typedef `description` on the
    schema. A `ctx.typeParams` member maps to `{type:'object'}`. A ReactNode or ReactElement ref maps to
    `{type:'string'}` **only when `inData`**, and `null` otherwise. Any other ref maps to `null`.
  - A function maps to `null`.
  - Field `description`s are copied from `TypeFieldMeta`.
- `classifyProp` checks in this order:
  1. If the type is unparseable, the prop is omitted as `unparseable`.
  2. If the type is a function, or a ref whose name ends with `EventHandler`, the prop is an event when its name
     matches `/^on[A-Z]/`. Otherwise it is omitted as `function`.
  3. If the type is a ReactNode/ReactElement ref, or a union that contains one, the prop is a slot. Its arity is
     `many` when the prop is named `children`, and `one` otherwise.
  4. If `toJsonSchema(t, ctx, true)` is not null, the prop is data, with `description` and the parsed `default`
     attached.
  5. Anything left is omitted as `unresolved-type`.
- `parseDefault` decides by schema type:
  - boolean: accept `'true'` or `'false'`.
  - number: `Number(raw)` must be finite.
  - string or enum: strip one pair of surrounding `'` or `"`, and the result must be in the `enum` if one exists.
  - array or object: `JSON.parse`.
  - Anything that doesn't validate against the schema's `type`/`enum` returns `undefined` (Review Focus 4).

- [ ] **Step 1: Write the failing tests:**
  - `Button.variant` (string enum) is data with an enum and `default: 'primary'`, parsed from manifest `primary`.
  - `children: ReactNode` is a slot with arity `many`. `icon: ReactNode` is a slot with arity `one`.
    `ShellHeaderBrand | ReactNode` is a slot with arity `one`.
  - `onClick: React.MouseEventHandler<HTMLButtonElement>` is an event. `getRowId: (row: Row) => string` is
    omitted as `function`.
  - `DataTable.columns: Column<Row>[]`, with the real `Column<Row>` typedef (fields `key`, `header`,
    `sortable`, and `render` as a function), gives
    `{type:'array', items:{type:'object', properties:{key, header, sortable}, required:['key','header'], additionalProperties:false}}`.
    `render` is dropped because it is optional.
  - `rows: Row[]` maps to `{type:'array', items:{type:'object'}}`.
  - `labels: PaginationLabels` with no typedef is omitted as `unresolved-type`.
  - A required function field in a typedef makes the prop omitted (Review Focus 3).
  - Defaults:
    - `parseDefault('md', enumSchema)` gives `{value:'md'}`, and so does `parseDefault("'md'", …)`.
    - `parseDefault('16 / 9', {type:'number'})` gives `undefined`.
    - `parseDefault('[]', {type:'array'})` gives `{value: []}`.
    - `parseDefault('huge', enumSchema)` gives `undefined`.
- [ ] **Step 2:** Run `node --experimental-strip-types --test scripts/schema/catalog-model.test.ts`. Expect it
  to fail.
- [ ] **Step 3:** Implement the functions above in `catalog-model.ts`.
- [ ] **Step 4:** Run the tests. Expect them to pass.
- [ ] **Step 5:** Commit: `feat(schema): classify manifest props into data/slot/event with JSON Schemas`.

### Task 3: Neutral catalog generator

**Files:**
- Modify: `scripts/schema/catalog-model.ts` (add `buildCatalog` and the types)
- Create: `scripts/schema/generate-catalog.ts`, `packages/render/src/catalog.test.ts`
- Modify: `package.json` → `"schema:generate": "node scripts/schema/generate.ts && node scripts/schema/generate-catalog.ts"`
- Generated: `packages/render/schema/catalog.v1.json`

**Interfaces:**
- Consumes: `classifyProp`, `contextFor` (Task 2). `componentNames` is imported directly from
  `packages/render/src/component-names.ts`, which has no dependencies, so Node can strip-types it.
- Produces:
  ```ts
  export interface CatalogComponent {
    description: string
    category: string
    parent?: string                          // sub-components only
    intent?: { whenToUse?: unknown; whenNotToUse?: unknown }   // copied verbatim from meta.intent
    props: { type: 'object'; properties: Record<string, JsonSchema>; required?: string[]; additionalProperties: false }
    slots: Record<string, { arity: 'one' | 'many'; required: boolean; description?: string }>
    events: Record<string, { description?: string }>
    omitted: Record<string, { type: string; reason: string }>
  }
  export interface Catalog { $id: string; version: 1; components: Record<string, CatalogComponent> }
  export const SUBCOMPONENT_PARENT: Readonly<Record<string, string>>
  //  = { CardContent:'Card', CardFooter:'Card', CardHeader:'Card', CardTitle:'Card', GridItem:'Grid', ListItem:'List', RadioCardGroup:'RadioCard' }
  export function buildCatalog(registry: unknown, renderable: ReadonlySet<string>): Catalog
  ```
- Rules:
  - `buildCatalog` narrows `registry` itself: it checks `components` is an array and each `meta.name`/`props`
    has the expected shape, and throws with the offending path otherwise.
  - A renderable name with no registry entry must be in `SUBCOMPONENT_PARENT`. Its entry is
    `description: 'Part of <Parent>.'`, `category` taken from the parent, empty props, and
    `slots.children = {arity:'many', required:false}`. A name that is neither throws, so a new sub-component
    added to `componentMap` fails regen loudly.
  - A prop that is required and has no default goes into `props.required` or `slots[n].required`.

- [ ] **Step 1: Write the failing artifact tests** in `catalog.test.ts` (Vitest; reads the JSON like
  `schema.test.ts` does):
  - `$id` equals the Global Constraints URL, and `version === 1`.
  - `Object.keys(components)` sorted equals `[...componentNames].sort()`.
  - `components.Button.slots.children.arity === 'many'`, `'onClick' in components.Button.events`, and
    `components.Button.props.properties.variant.enum` contains `'primary'`.
  - `components.DataTable.props.properties.columns.items.required` deep-equals `['key','header']`.
  - `components.CardHeader.parent === 'Card'`.
  - Review Focus 1: no `enum` anywhere in the file (walk it recursively) contains a member matching
    `/^(React\.)?React(Node|Element)$|^boolean$|^string$|^number$/`.
  - Every prop in every renderable manifest appears in exactly one of `props.properties`, `slots`, `events`
    or `omitted`. Nothing is lost silently.
- [ ] **Step 2:** Run `vp run @cascivo/render#test`. Expect it to fail because the file is missing.
- [ ] **Step 3:** Implement `buildCatalog` and `generate-catalog.ts`. The generator writes the file (with
  sorted keys) and prints a coverage line: `components N · data N · slots N · events N · omitted N (by reason)`.
- [ ] **Step 4:** Run `pnpm schema:generate`, then `vp run @cascivo/render#test`, then
  `pnpm schema:check` and `pnpm regen:check`. Expect all to pass. Run `pnpm schema:generate` a second time
  and check `git diff --exit-code packages/render/schema` is clean (determinism).
- [ ] **Step 5:** Commit the scripts, the test and the generated JSON:
  `feat(render): generate a protocol-neutral component catalog (catalog.v1.json)`.

### Task 4: A2UI v0.9 projection

**Files:**
- Create: `scripts/schema/a2ui.ts`, `scripts/schema/a2ui.test.ts`,
  `packages/render/src/__fixtures__/a2ui/v0_9/common_types.json` (download
  `https://a2ui.org/specification/v0_9/common_types.json` verbatim), and
  `packages/render/src/__fixtures__/a2ui/README.md` (source URL, retrieval date, Apache-2.0 attribution)
- Modify: `scripts/schema/generate-catalog.ts` (also write the two A2UI outputs, byte-identical),
  `packages/render/src/catalog.test.ts`, `packages/render/package.json` (devDependency `"ajv": "catalog:"`),
  `pnpm-workspace.yaml` (catalog `ajv: ^8.20.0`)
- Generated: `packages/render/schema/a2ui/v0_9/catalog.json`, `apps/site/public/a2ui/v0_9/catalog.json`

**Interfaces:**
- Consumes: `Catalog` (Task 3).
- Produces: `export function toA2uiCatalog(catalog: Catalog): JsonSchema`,
  `export const A2UI_CATALOG_ID` (the https URL from the Global Constraints), and
  `export const A2UI_RESERVED = new Set(['id', 'component', 'accessibility'])`.

**Mapping.** `C` is the common-types base URL from the Global Constraints. This mirrors the basic catalog's
own component shape:

| Neutral | A2UI property schema |
|---|---|
| data `{type:'string'}` | `{$ref: C+'DynamicString'}` |
| data `{type:'number'}` | `{$ref: C+'DynamicNumber'}` |
| data `{type:'boolean'}` | `{$ref: C+'DynamicBoolean'}` |
| data string `enum` | unchanged (literal, as the basic catalog does for `variant`/`justify`) |
| data `{type:'array', items:{type:'string'}}` | `{$ref: C+'DynamicStringList'}` |
| any other data | `{anyOf: [<schema>, {$ref: C+'DataBinding'}]}` |
| slot `many` / `one` | `{$ref: C+'ChildList'}` / `{$ref: C+'ComponentId'}` |
| event | `{$ref: C+'Action'}` |

`description` and `default` sit beside the `$ref`, as in the basic catalog.

Each component is
`{type:'object', allOf:[{$ref: C+'ComponentCommon'}, {type:'object', description, properties:{component:{const:Name}, …}, required:['component', …]}], unevaluatedProperties:false}`.

The top level is:
- `$schema` (draft 2020-12), `$id` and `catalogId` (both `A2UI_CATALOG_ID`)
- `title: 'cascivo A2UI catalog'`, plus a `description`
- `components`
- `functions`: each of the 14 basic function names
  (`required, regex, length, numeric, email, formatString, formatNumber, formatCurrency, formatDate, pluralize, openUrl, and, or, not`)
  as `{$ref: '<basic catalog URL>#/functions/<name>'}`
- `$defs.anyComponent`: `{oneOf: [{$ref:'#/components/<Name>'} …]}`

Props whose name is in `A2UI_RESERVED` are left out, and listed under `x-cascivo-omitted` on that component
with reason `reserved-name` (Review Focus 2).

- [ ] **Step 1: Write the failing tests:**
  - `a2ui.test.ts`, on a hand-built two-component `Catalog`:
    - The mapping-table rows each produce the expected `$ref`.
    - A prop named `id` is absent from `properties` and present in `x-cascivo-omitted` as `reserved-name`.
    - `required` starts with `'component'`.
  - `catalog.test.ts`, with ajv `Ajv2020({strict:false})` plus `addSchema(common_types fixture)`. Compile the
    real generated `components.Button`, `components.Input` and `components.DataTable`, then assert:
    - `{id:'b', component:'Button', children:['t'], onClick:{event:{name:'go'}}}` is **valid**.
    - Adding `foo: 1` is **invalid** (`unevaluatedProperties`).
    - Input `value: {path:'/form/name'}` is **valid**.
    - DataTable `columns: [{key:'a', header:'A'}]` and `columns: {path:'/cols'}` are both **valid**, and
      `columns: [{header:'A'}]` is **invalid** (missing `key`).
    - The packaged and site copies are byte-identical, and `catalogId === $id === A2UI_CATALOG_ID`.
- [ ] **Step 2:** Run `pnpm schema:check` and `vp run @cascivo/render#test`. Expect both to fail.
- [ ] **Step 3:** Implement `toA2uiCatalog`, and write both outputs from `generate-catalog.ts`. Run `pnpm install`
  for ajv.
- [ ] **Step 4:** Run `pnpm schema:generate`, `pnpm schema:check`, `vp run @cascivo/render#test` and
  `pnpm regen:check`. Expect all to pass.
- [ ] **Step 5:** Commit: `feat(render): A2UI v0.9 custom catalog derived from the component catalog`.

### Task 5: Fix the lossy `view.v1.json` prop schemas

**Files:**
- Modify: `scripts/schema/generate.ts` (delete `parseUnionLiterals`/`propTypeToSchema`, and use
  `parseTsType` + `toJsonSchema(t, contextFor(meta.typeDefs), true)` for each prop, keeping the schema only
  when `classifyProp(...).kind === 'data'`), `packages/render/src/schema.test.ts`
- Generated: `packages/render/schema/view.v1.json`

- [ ] **Step 1: Write the failing regression test** in `schema.test.ts`:
  - The `AiBadge` branch's `then.properties.props.properties.children` is undefined, so it no longer has
    `enum: ['ReactNode']`.
  - The recursive enum walk from Task 3 finds no TS type names in `view.v1.json`.
  - The `DataTable` branch constrains `columns.items.required` to `['key','header']`.
- [ ] **Step 2:** Run `vp run @cascivo/render#test`. Expect it to fail on the AiBadge assertion.
- [ ] **Step 3:** Make the change in `generate.ts`, then run `pnpm schema:generate`.
- [ ] **Step 4:** Run `vp run @cascivo/render#test`, `pnpm regen:check`, and
  `vp run @cascivo/json-playground#build`. Expect all to pass. Also confirm `apps/examples/json-playground/src/example-config.ts`
  still validates against the new schema with ajv: add one `it` for this to `schema.test.ts`.
- [ ] **Step 5:** Commit: `fix(schema): stop emitting TS type names as enum values in view.v1.json`.

### Task 6: Deep shape checks in `validateView`

**Files:**
- Modify: `scripts/schema/generate.ts` (emit `shape?: JsonSchema` on a `PropSchema` when the data schema is an
  object, an array or an `anyOf`), `packages/render/src/validate.ts`,
  `packages/render/src/validate.conformance.test.ts`
- Generated: `packages/render/src/prop-schemas.ts`

**Interfaces:**
- Produces, in the generated `prop-schemas.ts` header: `export type ShapeSchema = Record<string, unknown>` and
  `shape?: ShapeSchema` on `PropSchema`. In `validate.ts` (not exported):
  `function checkShape(value: unknown, shape: ShapeSchema, path: string, errors: ValidationError[]): void`.
  It supports `type` (object/array/string/number/boolean), `enum`, `properties`, `required`,
  `additionalProperties:false`, `items` and `anyOf` (an `anyOf` passes if any branch produces no errors). It
  ignores every other keyword. A `TranslationRef` passes wherever `type:'string'` is expected. Error messages
  follow the existing style: path `${path}.props.${key}[i].field` and
  `Invalid value … for "<key>[i].<field>" — <reason>.`
- `validateProps` calls `checkShape` when `prop.shape` is set and the value is not a `TranslationRef`. Bound
  and event props stay skipped.

- [ ] **Step 1: Write the failing tests** in `validate.conformance.test.ts`:
  - `DataTable` with `columns: [{header:'A'}]` gives exactly one error, whose path ends in
    `.props.columns[0].key`.
  - `columns: [{key:'a', header:'A', bogus:1}]` gives an error on `bogus`.
  - `columns: [{key:'a', header:{$t:'cols.a'}}]` gives no errors.
  - Review Focus 5: every config under `apps/examples/json-playground/src/` and every `examples`/fixture
    ViewConfig already used in `cascivo-view.test.tsx` still validates with zero errors. Loop over them in one
    `it.each`.
- [ ] **Step 2:** Run `vp run @cascivo/render#test`. Expect it to fail.
- [ ] **Step 3:** Implement the generator change and `checkShape`, then run `pnpm schema:generate`.
- [ ] **Step 4:** Run `vp run @cascivo/render#test`, then `vp run -r test` (the MCP and CLI tests consume
  `@cascivo/render`). Expect both to pass.
- [ ] **Step 5:** Commit: `feat(render): validate object/array prop shapes from manifest typeDefs`.

### Task 7: Publish surface, docs, release gates

**Files:**
- Modify: `packages/render/package.json` exports: add
  `"./schema/catalog.v1.json": "./schema/catalog.v1.json"` and
  `"./schema/a2ui/v0_9/catalog.json": "./schema/a2ui/v0_9/catalog.json"`. `files` already includes `schema`.
- Modify: `packages/render/README.md`. Add a "Component catalog" section covering the two files, the four prop
  kinds, the A2UI `catalogId`, and a note that rendering A2UI is T2 and not yet shipped.
- Modify: `docs/internal/ROADMAP-V61.md`. Set Status to "T1 shipped". Add a decision-log row for the ship date.
- Create: `.changeset/<name>.md` for `@cascivo/render` (minor): "Generated component catalog + A2UI v0.9
  catalog; deep prop-shape validation".

- [ ] **Step 1: Write the failing test** in `catalog.test.ts`. Read `packages/render/package.json` and assert
  both export keys exist and map to files that exist on disk.
- [ ] **Step 2:** Run `vp run @cascivo/render#test`. Expect it to fail.
- [ ] **Step 3:** Add the exports, the README section, the changeset and the roadmap status.
- [ ] **Step 4:** Run `pnpm ready`, then `pnpm isolated:check`, then `pnpm pack:check`. All must pass. Then
  confirm the packed tarball contains both catalog files:
  `pnpm --filter @cascivo/render pack --dry-run | grep catalog`.
- [ ] **Step 5:** Commit everything that `regen` or `--fix` changed:
  `feat(render): export component + A2UI catalogs; docs and changeset`.

---

## Out of scope (later tranches)

- Rendering A2UI messages and the surface store (T2), transports (T3), and MCP tools (T4).
- `Icon`, `Video` and `AudioPlayer` coverage, and the basic-catalog → cascivo mapping (T2).
- Implementing the 14 basic functions. T1 only *declares* them by `$ref`, which commits T2 to implementing them.
