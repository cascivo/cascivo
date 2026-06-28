# v55 — Templates & Marketplace: A Backend-Free, GitHub-Hosted Composition Layer on the Registry — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a **templates** system — curated, installable, community-contributable compositions (a working page +
its components + its fixtures) — and a **marketplace** to discover them, **without any backend, everything in GitHub**,
per the analysis in `docs/ROADMAP-V55.md`. The study confirmed that (1) it makes sense — a template is the durable
form of the page-compositions users already hand-assemble and that MCP `scaffold_view`/`create --sections` synthesize
on the fly; (2) it does **not** conflict with the registry **iff** templates are modeled as a registry item type
rather than a parallel system — the registry already carries multi-file items (`files[].target`), item composition
(`registryDependencies`), namespaces, a PR directory, and static-JSON-over-GitHub hosting; and (3) it can be fully
backend-free — templates are folders in GitHub repos, built to static JSON, hosted on raw/Pages, listed by PR, and
catalogued by a CI Action into a static `marketplace.json` rendered by a static gallery.

Governing thesis: **extend the registry, do not fork it.** A template is `RegistryItem` with `type: 'template'`, its
components in `registryDependencies`, its page/fixture source in `files`, and its gallery metadata in `meta`. There is
exactly **one transport, one resolver, one directory**. The marketplace is a *view* over registry indexes, not a second
registry. No server, no database, no runtime API, no new install protocol.

Deliver: **(T1)** a `template` item type + `TemplateMeta` schema + validation; **(T2)** CLI consumption — `add` a
template (resolve the component closure + copy page/fixture files), `create --template`, `view`; **(T3)** authoring +
publishing — a `template init` starter, template-aware `registry build`, `CONTRIBUTING-TEMPLATES.md`; **(T4)** the
marketplace directory + a CI-generated static `marketplace.json` + PR validation; **(T5)** a static gallery in
`apps/site` + MCP `list/get/add_template` + a `cascivo:add-template` skill; **(T6)** 3–5 first-party seed templates +
a verification/safety model. Every change reuses the existing registry/CLI/directory machinery. **Do not** add a
backend, a parallel distribution mechanism, monetization, remote execution, or runtime GitHub scraping.

Target state (verified after T6):

| Finding (severity)                                            | Today                                                              | Target                                                                                          |
| ------------------------------------------------------------ | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| M-1 No `template` item type (🔴)                             | `RegistryItemType` has no `template`                              | `'template'` in the union; `TemplateMeta` schema + validation                                    |
| M-2 No "install a whole page" unit (🔴)                      | `registryDependencies` + multi-file, but no page bundle           | a template bundles components (deps) + page/fixture files                                         |
| M-3 CLI can't install a template (🔴)                        | `add` does single item + deps                                     | `add` installs a template's closure + files; `create --template`; `view`                          |
| M-4 No authoring/publish loop (🟠)                           | registry guide is component-only                                  | `template init` starter + template-aware `registry build` + `CONTRIBUTING-TEMPLATES.md`           |
| M-5 No aggregate catalog (🟠)                                | directory lists registries only                                   | CI-generated static `marketplace.json`; PR-validated submission                                   |
| M-6 No gallery surface (🟠)                                  | none                                                              | static gallery in `apps/site` (screenshots, filters, copy-install, demo) — no backend calls       |
| M-7 No AI/skill discovery (🟠)                               | `scaffold_view`/`add_to_project`                                  | MCP `list/get/add_template`; `cascivo:add-template`; `design-page` can start from a template       |
| M-8 No seed templates (🟠)                                   | example-kit is internal                                           | 3–5 first-party templates published + listed + installing cleanly                                 |
| M-9 No template safety/verification (🟡)                     | `advisories`/`verified` for components                            | template review checklist + advisories propagation + `doctor`/`audit` over bundled source          |
| R-1 One transport/directory/resolver (✅ protect)            | registry is the single transport                                  | unchanged — templates ride it; no fork                                                            |
| Full gate (`pnpm ready`)                                     | green                                                             | green                                                                                            |

**Architecture & evidence (reproduced in-repo before planning):**

- **Registry types** (`packages/registry/src/types.ts`): `RegistryFile { url, target? }`, `RegistryItemType`
  (`component|layout|block|chart|section|theme|style` — **no `template`**, verified), `RegistryItem` (with
  `registryDependencies?: string[]`, `files: RegistryFile[]`, `meta?: unknown`, `advisories?`, `version`, `changelog`,
  `license`, `author`), `RegistryIndex`. The schema already has everything a template needs **except a `template`
  type and a `TemplateMeta` shape** — that is T1.
- **JSON schemas** (`packages/registry/schema/`): `registry-item.v2.json`, `registry.v2.json`, `registries.v1.json`.
  T1 extends the item schema's `type` enum + adds a `TemplateMeta` definition; T4 extends the directory schema.
- **CLI** (`packages/cli/src/`): `index.ts` (commands: `create`, `init`, `add`, `list`, `update`, `search`, `view`,
  `theme`, `eject`, `generate`, `doctor`, `audit`, `registry build`). `utils/resolve.ts` parses addresses
  (`bare`/`github`/`namespace`/`url`) and resolves the **transitive `registryDependencies` closure** — T2 reuses this
  and adds a template branch. `commands/{add,create,view}.ts` are the touch points.
- **Directory** (`directory/registries.json` + `registries.v1.json`): `RegistryDirectoryEntry` (`namespace`, `name`,
  `registryUrl` with `{name}`, `verified?`, `homepage?`). Listed via PR + `CASCADE_REGISTRIES` env + config. T4 marks
  template-carrying registries and adds the aggregate index.
- **MCP** (`packages/mcp/src/server.ts`): `scaffold_view`, `scaffold_page` (deprecated), `add_to_project`,
  `create_app`. T5 adds `list_templates`/`get_template`/`add_template`.
- **Site** (`apps/site`): component docs + the v53 charts comparison. T5's gallery is a new static page reading a
  build-time `public/marketplace.json`.
- **Prior art** (`@cascivo/example-kit`, `apps/examples/deploy` — v21; `skills/cascivo:design-page`): the reference
  composition T6 productizes + the skill T5 extends.
- **CLAUDE.md constraints (binding on every tranche):** signals only in any new components (`useSignal`/`useComputed`/
  `useSignalEffect`/`useMachine`; **no** `useState`/`useEffect`/`useContext`/`useReducer`; `useRef` for DOM only);
  React example apps call `useSignals()` first; user-visible strings default from `@cascivo/i18n`; touch targets ≥44px
  under `pointer: coarse`; no off-scale `@media`/`@container` literals; **no new runtime dependency**; per-item docs
  derive from manifests and survive `pnpm regen` + the drift check.

**Tech Stack:** the existing `@cascivo/registry` (types + schema + build), the `cascivo` CLI (resolver + commands),
`directory/registries.json`, `@cascivo/mcp`, `apps/site` (Preact + cascivo), `skills/`, GitHub Actions for the CI
catalog. Static JSON over GitHub raw/Pages for transport. No backend, no database, **no new runtime dependency**.

---

## Tranche Overview

| Tranche | Title                                  | Goal                                                                                                                                                                                                                                                  |
| ------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1      | Template item type & schema            | Add `'template'` to `RegistryItemType`; define `TemplateMeta` (carried in `meta`): the page intent, `framework`, `category`, `screenshots[]`, `demoUrl`, and the role of each `files[]` entry (page vs fixture vs asset). Components are listed in `registryDependencies`. Extend `registry-item.v2.json` + registry validation; a `template` builds via `registry build`. **No new transport.** |
| T2      | CLI: consume templates                 | Teach `utils/resolve.ts` + `commands/add.ts` to detect `type:'template'`: resolve the `registryDependencies` component closure (existing logic), then copy the template's own `files` to their `target`s; record the template (name + version) in the lockfile. Add `cascivo create --template <spec>` (scaffold an app from a template) and `cascivo view <template>` (list its components + files before install). |
| T3      | Authoring & publishing (GitHub-only)   | `cascivo template init` — scaffold a `src/<name>/` folder + a `<name>.template.ts` manifest + a `cascivo-registry.json` entry. Template support in `cascivo registry build` (resolve + validate a template bundle → static JSON). `docs/CONTRIBUTING-TEMPLATES.md` mirroring `CONTRIBUTING-REGISTRY.md`: author → build → host (raw/Pages) → reference (`owner/repo/name`) → submit. |
| T4      | Marketplace directory & aggregate index | Extend `registries.v1.json` so an entry can flag `provides: ['component','template',…]`. A GitHub Action (`scripts/registry/build-marketplace.*`) fetches every listed registry index, filters `type:'template'`, bakes star counts (GitHub API, CI-time), and writes a static `apps/site/public/marketplace.json`. PR submission validated by CI (schema, reachability, ≥1 template, screenshots present, license set, no dup). |
| T5      | Gallery UI + AI discovery              | A static `apps/site` gallery page rendered from `public/marketplace.json` at build time: screenshot cards, category + tag filters, a copyable `cascivo add …` command, a demo link — **no runtime backend calls**. MCP `list_templates`/`get_template`/`add_template`. A `cascivo:add-template` skill; `cascivo:design-page` gains a "start from a template" path. |
| T6      | Seed templates + verification & safety | Publish 3–5 first-party templates (dashboard, landing, auth, settings, docs) derived from existing components + `@cascivo/example-kit`, seeding the marketplace and proving the schema end-to-end. A `verified` review checklist; advisories propagation through templates; `cascivo doctor`/`audit` runs over bundled template source in CI. |

Ordering rationale: **T1 first** — the schema is the contract every later tranche reads. **T2** delivers the
user-visible payoff (install a whole page) before any marketplace machinery. **T3** lets third parties author/publish.
**T4** lists them (the catalog). **T5** makes them discoverable (gallery + AI). **T6** seeds + secures. T1→T2→T3 is the
critical path; T4/T5 are the discovery layer; T6 validates the loop end-to-end.

---

## Files Created / Modified per Tranche

### T1 — Template item type & schema

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `packages/registry/src/types.ts` (add `'template'` to `RegistryItemType`; add a `TemplateMeta` interface) |
| Modify | `packages/registry/schema/registry-item.v2.json` (extend the `type` enum; add a `TemplateMeta` definition) |
| Create | `packages/registry/src/template.ts` (TemplateMeta type guard + validation) + `template.test.ts` |
| Modify | `packages/registry/src/index.ts` (export the template types + validator) |

### T2 — CLI: consume templates

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `packages/cli/src/utils/resolve.ts` (recognize `type:'template'`; return the closure + the template's own files) |
| Modify | `packages/cli/src/commands/add.ts` (template branch: install closure, copy page/fixture files to targets, record in lockfile) + tests |
| Modify | `packages/cli/src/commands/{create,view}.ts` (`create --template <spec>`; `view` lists template contents) + tests |
| Modify | `packages/cli/README.md` (document the template flags) |

### T3 — Authoring & publishing (GitHub-only)

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `packages/cli/src/commands/template-init.ts` (`cascivo template init`) + tests |
| Modify | `packages/cli/src/commands/registry-build.ts` (resolve + validate a template bundle → static JSON) + tests |
| Create | `docs/CONTRIBUTING-TEMPLATES.md` (the full GitHub-only loop) |
| Create | `apps/examples/template-starter/` (a copy-paste starting point: a minimal template repo) |

### T4 — Marketplace directory & aggregate index

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `packages/registry/schema/registries.v1.json` (+ `directory/registries.json`) — add a `provides` facet |
| Create | `scripts/registry/build-marketplace.ts` (fetch listed indexes → filter `template` → bake stars → write `marketplace.json`) + tests |
| Create | `.github/workflows/marketplace.yml` (run the builder; validate directory PRs) |
| Create | `scripts/registry/validate-directory.ts` (schema + reachability + ≥1 template + screenshots + license + dedupe) + tests |

### T5 — Gallery UI + AI discovery

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `apps/site/src/pages/MarketplacePage.tsx` (static gallery from `public/marketplace.json`) + `marketplace.module.css` |
| Modify | `apps/site` routing/nav to add the gallery; `public/marketplace.json` wired as a build input |
| Modify | `packages/mcp/src/server.ts` (+ `templates.ts`) — `list_templates`/`get_template`/`add_template` tools + tests |
| Create | `skills/cascivo-add-template/SKILL.md`; Modify `skills/cascivo-design-page/SKILL.md` (start-from-template path) |

### T6 — Seed templates + verification & safety

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `templates/{dashboard,landing,auth,settings,docs}/` (page source + fixtures + `*.template.ts` + screenshots) |
| Create | `templates/cascivo-registry.json` (first-party template index) + built `public/r/*.json` |
| Modify | `directory/registries.json` (first-party entry advertises `provides: [...,'template']`) |
| Modify | `.github/workflows/marketplace.yml` (run `cascivo doctor`/`audit` over template source); `docs/CONTRIBUTING-TEMPLATES.md` (verification checklist) |
| Modify | `docs/ROADMAP-V55.md` → Status: Shipped + an implementation log |

---

## Key Decisions

### Decision 1 — A template is a registry item type; the marketplace is a view over the registry (firm)

The single most important decision. **A template is `RegistryItem` with `type:'template'`, its components in
`registryDependencies`, its page/fixture source in `files`, and gallery metadata in `meta` (`TemplateMeta`).** There is
**one** transport, resolver, directory, and publish loop — the registry's. The marketplace is a *generated static view*
(`marketplace.json` + a gallery) over registry indexes. **Rejected:** a standalone template manifest format, a separate
install protocol, or a second directory — that forks the registry, fragments discovery, and doubles the maintenance
surface (the explicit anti-goal, per ROADMAP-V55 Q2).

### Decision 2 — Components ride `registryDependencies`; never inline component source into a template (firm)

A template **references** its components by registry name (`registryDependencies`) and ships only its *own* novel files
(the page, fixtures, layout glue). **Decision: installing a template resolves the component closure through the existing
`utils/resolve.ts` logic, then copies the template's page/fixture files.** **Rejected:** inlining component source into
the template bundle — it would duplicate/stale-fork component code, break `cascivo update`, and defeat the owned-code
single-source model.

### Decision 3 — Everything backend-free; the catalog is a CI-built static file (firm)

**Decision: no server, no database, no runtime API.** Templates are GitHub repos → static JSON on raw/Pages; the
directory is a PR-edited JSON; `marketplace.json` is produced by a GitHub Action and committed; the gallery renders it
at build time; social signals are baked at CI-time or shown as links. **Rejected:** a hosted search/index service or
runtime GitHub API calls from the gallery (introduces a backend, betrays the GitHub-native posture — ROADMAP-V55 Q3).

### Decision 4 — Templates are owned, copy-paste source; no remote execution (firm)

**Decision: a template installs as files the user owns and reviews, exactly like a component.** No template is ever
executed remotely, and the gallery hosts only static metadata + author-hosted screenshots/demos. **Rejected:** live
template previews that run third-party code in cascivo's surfaces (a security and trust liability).

### Decision 5 — Tiered trust: PR review + `verified`, not auto-merge (firm)

**Decision: new templates / new registries are PR-reviewed; `"verified": true` is a maintainer flag after a security +
a11y + house-rules review (the registry's existing model). CI validates schema/reachability/screenshots/license, and
runs `cascivo doctor`/`audit` over bundled source; only first-party doc/catalog regeneration auto-merges.**
**Rejected:** auto-listing arbitrary third-party templates (supply-chain risk).

### Decision 6 — Free + open; defer monetization (recommended)

**Decision: v55 is a free, open community catalog.** Paid templates / a store are deferred (as v11 deferred a blocks
marketplace). **Rejected:** building payment/licensing infrastructure now (needs a backend, out of scope per Decision
3; premature).

### Decision 7 — First-party templates derive from example-kit; don't relocate it (recommended)

**Decision: T6's seed templates are *built from* existing components + `@cascivo/example-kit` patterns, published as
the first entries in the marketplace.** `@cascivo/example-kit` / `apps/examples/*` stay as internal reference infra.
**Rejected:** converting the internal example apps directly into the public template format (couples internal dev infra
to the public catalog's lifecycle).

---

## Cross-Tranche Rules

1. `pnpm exec vp check` after each tranche; `pnpm ready` green before any push; `pnpm ready:ci` before the final push
   if build config or workspace deps changed.
2. **One transport, never a fork.** Every tranche is checked against "did we just create a second registry/resolver/
   directory/install protocol?" The answer must stay **no** (Decision 1). Templates reuse `RegistryItem`,
   `utils/resolve.ts`, `cascivo add`, `registry build`, and `directory/registries.json`.
3. **No backend.** No server, database, or runtime API anywhere; the catalog is a CI-generated static file; the gallery
   makes no runtime backend calls (Decision 3).
4. **No new runtime dependency** in any published package; the CI catalog builder may use the toolchain's existing
   fetch + the GitHub API (CI-time only).
5. **Owned-code + safety.** Templates install as reviewable files; no remote execution; third-party templates are
   PR-reviewed; CI runs `doctor`/`audit` over bundled source (Decisions 4–5).
6. **Signals, not hooks** in any new/seed components (per CLAUDE.md): `useSignal`/`useComputed`/`useSignalEffect`/
   `useMachine`/`useRef`-for-DOM only; React example apps call `useSignals()` first; no
   `useState`/`useEffect`/`useContext`/`useReducer`.
7. **i18n + a11y + responsive** on every new UI (the gallery, `create --template` output, seed templates): strings
   default from `@cascivo/i18n`; WCAG 2.2 AA; ≥44px coarse targets; no off-scale `@media`/`@container` literals; mobile
   sweep at 320/360/390/414.
8. **Single source of truth for docs.** Template + catalog docs derive from manifests / `marketplace.json`; after
   `pnpm regen` the drift check (`git diff --exit-code`) is clean; the registry/CLI/MCP all read the same schema.
9. **Out-of-scope stays out.** No backend/database/API; no parallel distribution mechanism; no monetization/store; no
   remote execution; no runtime GitHub scraping; no auto-merge of third-party templates; `@cascivo/example-kit`/
   `apps/examples/*` are not relocated.
</content>
