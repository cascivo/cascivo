The **registry schema v2** for the cascivo ecosystem: TypeScript types, validation, the static registry build, and a shadcn-interop projection. If a tool reads or writes `registry.json`, this package defines what "valid" means.

Consumers in this repo: the `cascivo` CLI (`add`, `view`, `search`, `update`, `template init`, `registry build`), the registry generation pipeline (`scripts/registry/generate.ts`, which emits the root `registry.json` + per-item payloads), and the docs site. Third-party registries use it to build and validate their own indexes.

## Exports

**Types** — `RegistryIndex` (the `registry.json` shape: `schemaVersion: 2` + `items`), `RegistryItem` (one entry: `name`, `type`, `version`, `files`, `dependencies`, `registryDependencies`, `tags`, optional `advisories`/`meta`), `RegistryItemType` (`component | layout | block | chart | section | theme | style | template`), plus template metadata (`TemplateMeta`, `TemplateScreenshot`, `TemplateFileRole`) and directory/marketplace types.

**Validation**

```ts
import { validateIndex, validateItem } from '@cascivo/registry'

const result = validateIndex(JSON.parse(raw)) // { valid, errors: [{ path, message }] }
```

`validateItem` checks a single entry; `validateIndex` the whole index. `parseLegacyRegistry` upgrades the pre-v2 flat format (`{ version, components }`) into a v2 `RegistryIndex`.

**Static build** — `buildRegistry(index, outDir)` writes a hostable registry: a sorted `registry.json` (examples stripped from the index for size) plus one JSON payload per item. This is what `cascivo registry build` runs under the hood, so anyone can serve a registry from a static file host.

**Templates** — `isTemplateItem`, `asTemplateMeta`, `validateTemplate` for `type: 'template'` entries (whole-page compositions riding the normal registry transport), and `projectTemplate`/`buildCatalog` to project them into the marketplace catalog.

**Advisories** — `matchAdvisories` matches an item's advisories (`severity`, `affectedVersions`, `fixedIn`) against an installed version, so clients can warn on install/update.

**Directory** — `validateDirectory` for the multi-registry directory format (namespace → registry URL) behind `cascivo search --registry @ns` and the MCP `list_registries` tool.

## shadcn registry interop

In addition to cascivo's own registry, the build emits a **shadcn-registry-compatible** projection (`toShadcnItem`, `writeShadcnRegistry`) so the shadcn CLI can install a cascivo component directly:

```sh
npx shadcn add https://<host>/r/shadcn/button.json
```

Each `r/shadcn/<name>.json` is a shadcn `registry:component` item with the source files inlined as `content`. This is purely additive — `npx cascivo add` and cascivo's own `registry.json` schema are unchanged.

**CSS-native caveat:** cascivo components are `.tsx` + `.module.css` and rely on the `@cascivo/core` peer plus a `@cascivo/themes` stylesheet import — there is no Tailwind config or `cssVars` block to merge. After adding a component via the shadcn CLI, install `@cascivo/core` and import a theme (e.g. `@cascivo/themes/light.css`).
