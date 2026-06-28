# cascivo — Roadmap v55: Templates & Marketplace — A Backend-Free, GitHub-Hosted Composition Layer on the Registry

**Last updated:** 2026-06-28
**Status:** 🟡 Planned (not shipped) — per the task that produced it (study the idea, decide if it makes sense, decide
whether it conflicts with the registry, design a backend-free GitHub-only shape; **do not implement**). The tranche
docs carry the task-by-task steps for when implementation begins.
**Plan documents:** `docs/superpowers/plans/2026-06-28-v55-master-plan.md` + tranches 1–6
**Builds on:** the existing registry transport (`packages/registry/src/types.ts` — `RegistryItem`/`RegistryIndex`,
multi-file `files[]` with `target`, `registryDependencies` for item composition, `meta`, `advisories`), the CLI
resolver + dependency closure (`packages/cli/src/utils/resolve.ts`, `commands/{add,create,view}.ts`), the third-party
registry directory (`directory/registries.json` + `packages/registry/schema/registries.v1.json`), the contributor loop
(`docs/CONTRIBUTING-REGISTRY.md`), the MCP server (`packages/mcp/src/server.ts`), the docs/marketing site
(`apps/site`), the skills (`skills/cascivo:design-page`, `skills/cascivo:add`), and the v21 internal reference infra
(`@cascivo/example-kit`, `apps/examples/deploy`).

> **Source of this roadmap.** A request to evaluate, then design, a **templates / marketplace** system that external
> users can contribute to — ideally **without any backend, everything in GitHub**. The job was first to *decide
> whether it makes sense and whether it conflicts with the existing registry idea*, and only then to design the
> shape. The conclusion below is **yes, it makes sense — as a thin composition + discovery layer built *on* the
> registry, not beside it.** A template that bundles a page, its components, and its fixtures is exactly the unit
> users keep hand-assembling today; the registry already carries everything needed to ship one (multi-file items,
> cross-item `registryDependencies`, namespaces, a PR-based directory, static-JSON-over-GitHub hosting). The risk is
> not "too little registry" — it is **building a second, parallel distribution system** that fragments discovery and
> doubles the surface. v55 is the design that adds templates *as a registry item type* and a marketplace *as a
> build-time-generated static index*, so there is exactly one transport, one directory, one resolver.

---

## The three questions this roadmap had to answer first

### Q1 — Does a templates/marketplace system make sense for cascivo?

**Yes, conditionally.** cascivo's whole thesis is *owned, copy-paste code* — users adopt source, not a dependency.
Today that unit is a **single component** (`cascivo add button`). But the thing users actually build is a **page or a
flow**: a dashboard (AppShell + cards + charts + a data table), an auth screen, a settings page, a marketing landing.
Every one of those is a *recurring composition* of existing components + a layout + some fixture data. The MCP
`scaffold_view`/`scaffold_page` tools and the `cascivo create --sections` flag already prove the demand exists — they
synthesize these compositions on the fly. A **template** is the durable, shareable, reviewable form of the same thing:
"here is a working page, copy it, own it." That is a natural extension of the copy-paste model, not a departure from
it.

It also unlocks the **community / external-contributor** dimension cascivo has otherwise only touched for components.
The registry already lets anyone publish components (`docs/CONTRIBUTING-REGISTRY.md`); templates are the higher-value,
more-shareable artifact (a whole dashboard is worth more to a newcomer than one button) and the most natural thing for
the community to contribute. So it makes sense **both** as a product feature (faster start) **and** as an ecosystem
play (the marketplace is what gives third-party authors a reason to publish).

The one honest caveat — and the reason the answer is *conditional* — is **scope discipline** (CLAUDE.md "Simplicity
First"). A full marketplace with accounts, ratings, payments, and a hosted backend would betray the project's
zero-backend, GitHub-native posture. The design only makes sense if it stays backend-free (Q3). If it cannot, it
should not ship.

### Q2 — Does it conflict with the registry idea?

**No — if and only if templates are modeled as a registry item type, not a parallel system.** This is the central
design decision of v55.

The registry is cascivo's **transport + distribution + discovery** layer. It already has, today, every primitive a
template needs:

| Template needs…                                  | Registry already provides                                                                 |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Bundle several components                        | `registryDependencies: string[]` — transitive item closure, resolved by the CLI today      |
| Ship page + fixture source files to set paths    | `files: { url, target }[]` — items already ship multi-file with explicit targets           |
| A typed kind                                      | `RegistryItemType` — already an open union (`component\|layout\|block\|chart\|section\|…`)  |
| Versioning, changelog, license, author           | `version` / `changelog` / `license` / `author` on every `RegistryItem`                     |
| Be published by anyone, hosted anywhere          | static JSON over GitHub raw / Pages; `owner/repo/name` + `@ns/name` + URL resolution        |
| Be listed for discovery                          | `directory/registries.json` (`registries.v1.json`) + PR-based submission + CI validation    |
| Carry security advisories                         | `advisories[]` on `RegistryItem`                                                            |

So the **conflict only arises if the marketplace invents its own** schema, hosting, resolver, or directory. It
**does not conflict — it composes** if a template is just `RegistryItem` with `type: 'template'`, a `TemplateMeta`
in `meta`, its components in `registryDependencies`, and its page/fixture source in `files`. Same transport, same
`cascivo add`, same directory, same `registry build`. The marketplace is then **a view over the registry**, not a
second registry.

The decision is therefore: **extend, don't fork.** v55 adds a `template` type (T1), teaches the existing resolver to
install a template's closure (T2), reuses the existing publish loop (T3) and directory (T4), and adds a discovery
*surface* — a gallery generated from registry indexes (T5). No new distribution mechanism is introduced anywhere.

### Q3 — How could it look in practice, backend-free, everything in GitHub?

Every moving part maps to a static file or a GitHub-native primitive — no server, no database, no runtime API:

1. **A template is a folder in a GitHub repo** — `src/<template>/` with page source, a CSS module, optional fixtures,
   and a `<template>.template.ts` manifest — plus an entry in `cascivo-registry.json`. Identical authoring ergonomics
   to a component registry today.
2. **Publishing = `cascivo registry build` → commit `public/r/*.json` → push.** The built artifacts are plain static
   JSON addressable at `raw.githubusercontent.com/owner/repo/main/r/<template>.json` or via GitHub Pages
   (`owner.github.io/repo/r/...`). No host beyond GitHub.
3. **Installing = `cascivo add owner/repo/<template>`.** The CLI resolves the JSON, walks `registryDependencies` to
   pull every component, then writes the template's own `files` to their `target`s. Pure client-side file copy — the
   existing `add` machinery (Q2) with one new branch for the page/fixture files.
4. **The directory is a JSON file edited by PR.** `directory/registries.json` already lists third-party registries;
   a registry that contains templates is listed the same way. CI (a GitHub Action) validates schema + reachability +
   that screenshots/license exist. Merge = listed.
5. **The "marketplace index" is generated in CI, committed as a static file.** A scheduled/triggered GitHub Action
   fetches every listed registry's index, filters `type: 'template'`, and writes an aggregated `marketplace.json` to
   `apps/site/public`. The catalog is a build artifact, not a live query.
6. **The gallery is a static page** in `apps/site`, rendered from `marketplace.json` at build time — cards with
   screenshots (hosted in the author's repo / Pages), category + tag filters, a copyable `cascivo add …` command, and
   a link to a live demo (the author's GitHub Pages deploy). No client→server calls.
7. **Social proof is a link, not a scrape** — GitHub stars / issues / the source repo are linked; nothing is fetched
   at the user's runtime. (Star counts, if shown, are baked into `marketplace.json` at CI time via the GitHub API.)
8. **Verification is a maintainer PR review** flipping `"verified": true` in the directory entry — same trust model the
   registry already uses; unverified templates show with a warning.

The net shape: **GitHub repos hold templates, GitHub raw/Pages serves them, GitHub PRs list them, a GitHub Action
bakes the catalog, and a static page renders it.** Zero backend, consistent with how `@cascivo/charts`, the registry,
and the directory already work.

---

## Why this roadmap exists

cascivo can install a *component* but not a *composition*. The gap is visible in three existing-but-partial surfaces:

- **`@cascivo/example-kit` + `apps/examples/deploy` (v21)** is a beautiful reference dashboard — but it is *internal*
  infrastructure (a private workspace package), not something a user can install or a third party can publish.
- **MCP `scaffold_view` / `scaffold_page` + `cascivo create --sections`** synthesize page compositions from a
  description — proving users want pages, not just parts — but the output is *generated each time*, not a curated,
  reviewable, shareable, versioned artifact.
- **The registry + `directory/registries.json`** already let third parties publish and be listed — but only
  *components*; there is no unit that says "install this whole working page and its parts."

A template is the missing durable unit that ties these together: a curated composition, installable through the
registry, contributable by the community, discoverable in a gallery. And because the registry already carries the hard
parts (multi-file items, item composition, namespaces, a PR directory, static hosting), the work is **mostly schema +
a resolver branch + a generated gallery**, not a new platform.

---

## The findings, verified against today's code

Legend: ✅ already present (reuse) · ⚠️ partial / adjacent · ❌ genuine gap. "Verified state" reflects a read of
`main` at 2026-06-28.

| #   | Finding (severity)                                                       | Verified state today                                                                                                                       | Tranche |
| --- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| M-1 | No `template` item type (🔴)                                            | ❌ `RegistryItemType` is `component\|layout\|block\|chart\|section\|theme\|style` (`packages/registry/src/types.ts`) — no `template`.       | T1      |
| M-2 | No multi-component "install a whole page" unit (🔴)                     | ⚠️ `registryDependencies` resolves an item closure (`utils/resolve.ts`), and `files[].target` ships multi-file — but nothing bundles a *page + its components + fixtures* as one installable. | T1/T2   |
| M-3 | CLI can't install a template (🔴)                                       | ❌ `cascivo add` resolves a single item + its deps; there is no template branch (copy page/fixture `files`, record the template). No `create --template`. | T2      |
| M-4 | No template authoring/publish loop (🟠)                                 | ⚠️ `docs/CONTRIBUTING-REGISTRY.md` + `cascivo registry build` cover *components*; no template starter, no template-aware build, no contributor guide. | T3      |
| M-5 | Directory lists registries, not templates; no aggregate catalog (🟠)   | ⚠️ `directory/registries.json` lists registries (`registries.v1.json`); there is no generated, filterable templates catalog (`marketplace.json`). | T4      |
| M-6 | No marketplace/gallery surface (🟠)                                     | ❌ `apps/site` has component docs + the charts comparison; no templates gallery (screenshots, category filter, copy-install, demo link).    | T5      |
| M-7 | No template discovery for AI/skills (🟠)                                | ⚠️ MCP has `scaffold_view`/`add_to_project`; no `list_templates`/`get_template`/`add_template`; `cascivo:design-page` can't start from a template. | T5      |
| M-8 | No first-party templates to seed/validate the schema (🟠)              | ⚠️ `@cascivo/example-kit`/`apps/examples/deploy` exist but aren't published templates; nothing exercises the end-to-end loop.              | T6      |
| M-9 | No template-specific safety/verification model (🟡)                    | ✅ `advisories[]` + `verified` exist for components; ⚠️ no template review checklist, no `doctor`/`audit` over bundled template source.      | T6      |
| R-1 | Registry transport, namespaces, directory, hosting (✅ reuse)          | ✅ static JSON over GitHub raw/Pages; `owner/repo/name`+`@ns/name`+URL; PR directory + CI. **The foundation — do not fork it.**             | all     |

**Net:** the headline work is **M-1/M-2/M-3** — a `template` type and a CLI that installs the whole composition.
Everything else (M-4 publish, M-5 catalog, M-6 gallery, M-7 AI, M-8 seed) is **a layer over the existing registry**,
and **R-1 is the lead to protect: one transport, one directory, one resolver.**

---

## Tranche map

| Tranche | Theme                                                                                                                                                                                                                                |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1      | **Template item type & schema** — add `'template'` to `RegistryItemType`; define a `TemplateMeta` (carried in `meta`): bundled components via `registryDependencies`, page/fixture source via `files[].target`, screenshots, framework, category, demo URL. Update the JSON schemas + registry validation. No new transport. (M-1/M-2) |
| T2      | **CLI: consume templates** — teach the resolver/`add` to detect `type:'template'`, resolve the component closure (existing logic), copy page+fixture `files` to targets, and record the template in the lockfile; add `cascivo create --template <spec>` and `cascivo view` of a template. (M-3) |
| T3      | **Authoring & publishing (GitHub-only)** — a `cascivo template init` starter, template support in `cascivo registry build`, and `docs/CONTRIBUTING-TEMPLATES.md` mirroring the registry guide — the full backend-free loop (author in a repo, build static JSON, host on raw/Pages, reference by `owner/repo/name`). (M-4) |
| T4      | **Marketplace directory & aggregate index** — extend the directory so a registry advertises it carries templates; a CI Action fetches listed indexes, filters `type:'template'`, and commits a static `marketplace.json`; PR submission + CI validation (schema, reachability, screenshots, license). (M-5) |
| T5      | **Gallery UI + AI discovery** — a static gallery page in `apps/site` rendered from `marketplace.json` (screenshot cards, category/tag filter, copy-install, demo link); MCP `list_templates`/`get_template`/`add_template`; a `cascivo:add-template` skill (and `cascivo:design-page` can start from a template). (M-6/M-7) |
| T6      | **Seed templates + verification & safety** — ship 3–5 first-party templates (dashboard, landing, auth, settings, docs) built from existing components + example-kit to seed the marketplace and prove the schema end-to-end; the `verified` review checklist; advisories propagation; `cascivo doctor`/`audit` over bundled template source. (M-8/M-9) |

Ordering rationale: **T1 first** — the schema is the contract everything else reads. **T2** makes templates
*consumable* (the user-visible payoff) before any authoring/marketplace machinery. **T3** opens *authoring/publishing*
(third parties can now ship). **T4** makes them *listed* (the catalog). **T5** makes them *discoverable* (gallery + AI).
**T6** *seeds and secures* the marketplace with first-party templates + a verification model. T1→T2→T3 are the critical
path; T4/T5 layer discovery; T6 validates the whole loop.

---

## Out of scope

- **A backend / database / hosted API.** No accounts, no server-side search, no ratings store, no payments. The
  catalog is a CI-generated static file; everything is GitHub raw/Pages + PRs (Q3). If a feature needs a server, it is
  out of scope for v55.
- **A second/parallel distribution mechanism.** Templates ride the **existing** registry transport, resolver, and
  directory. v55 adds **no** new install protocol, manifest format, or hosting model beyond the registry's. (Decision
  1 / Q2.)
- **Monetization / paid templates / a "store".** Explicitly deferred (as v11 deferred a blocks marketplace). v55 is a
  free, open, community catalog.
- **Remote code execution / runtime template rendering.** Templates are **owned, copy-paste source** like every other
  cascivo artifact — installed and reviewed by the user, never executed remotely.
- **Scraping GitHub at the user's runtime.** Any social signal (stars, issues) is baked into `marketplace.json` at CI
  time or shown as a plain link; the gallery makes no live API calls.
- **Replacing `@cascivo/example-kit` / `apps/examples/*`.** Those stay internal reference infra; T6 *derives*
  first-party templates from them, it does not delete or relocate them.
- **Auto-merging third-party templates.** New templates / new registries are PR-reviewed (the registry's existing
  tiered trust model). Only first-party doc/catalog regeneration is automated.

---

## Definition of done (verified after T6)

- `RegistryItemType` includes `'template'`; a `TemplateMeta` schema is defined and validated; the JSON schemas accept a
  template item; `registry build` builds one.
- `cascivo add owner/repo/<template>` installs the full component closure **and** the template's page/fixture files to
  their targets, recording the template in the lockfile; `cascivo create --template <spec>` scaffolds a new app from a
  template; `cascivo view` previews a template's contents.
- `docs/CONTRIBUTING-TEMPLATES.md` documents the complete GitHub-only authoring → build → host → reference → submit
  loop; a `cascivo template init` starter exists.
- `directory/registries.json` (or a sibling) marks registries that carry templates; a CI Action produces a static
  `marketplace.json`; PR submission is schema- + reachability- + screenshot- + license-validated.
- A static gallery in `apps/site` renders the catalog (screenshots, category/tag filter, copy-install, demo link) with
  **no runtime backend calls**; MCP exposes `list_templates`/`get_template`/`add_template`; a `cascivo:add-template`
  skill exists.
- 3–5 first-party templates ship, are listed, install cleanly end-to-end, and pass `cascivo doctor`; a `verified`
  review checklist + advisories propagation are documented.
- `pnpm ready` green; no new runtime dependency in any published package; the registry remains the single transport.

---

## Notes

- This roadmap is **Planned, not Shipped** — per the task that produced it (decide if it makes sense, decide if it
  conflicts with the registry, design a backend-free GitHub shape; do not implement). The tranche docs carry the
  task-by-task steps for when implementation begins.
- The governing decision — **templates are a registry item type; the marketplace is a static view over the registry** —
  is what keeps this additive instead of a second platform. Every tranche is checked against "did we just fork the
  registry?" The answer must stay *no*.
- The verification figures (the `RegistryItemType` union, the absence of a `template` type / `marketplace.json` /
  gallery / template CLI branch) are point-in-time reads of `main` at 2026-06-28 and should be re-confirmed at
  implementation start.
- Nearest prior art in-repo: **v21** (`@cascivo/example-kit` + `apps/examples/deploy`) is the reference composition
  this work productizes; **v11** deferred a "blocks marketplace" — v55 picks up that thread but stays free + backend-free.
</content>
</invoke>
