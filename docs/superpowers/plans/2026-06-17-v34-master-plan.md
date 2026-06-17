# v34 — Package Publishing: Changesets + npm Trusted Publishing — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a working, tokenless npm release pipeline for the monorepo. Decide the exact set of packages that ship, give each correct publish metadata, fix the changesets flow, and wire a GitHub Actions release workflow that publishes via **npm OIDC trusted publishing** (no `NPM_TOKEN`, automatic provenance). Zero behaviour changes to components or apps.

Target state (verified after T5):

| Metric                                                  | Target                          |
| ------------------------------------------------------- | ------------------------------- |
| Packages in the npm release set                         | 10 (Tier 1)                     |
| Tier‑1 packages with full publish metadata              | 10 / 10                         |
| Tier‑1 packages with a correct `files` allowlist        | 10 / 10                         |
| Root `LICENSE` file                                     | present                         |
| Stale `cascade` reference in changesets                 | removed                         |
| `@cascivo/ai` / `charts` / `render` publishable         | no (`private: true`)            |
| Release workflow secret `NPM_TOKEN`                     | removed                         |
| Trusted publishing (OIDC + provenance)                  | configured                      |
| `pnpm changeset status` lists only Tier‑1               | yes                             |
| `pnpm pack` tarballs free of `src`/test leaks (JS pkgs) | yes                             |
| Full CI gate (T5)                                       | passes                          |

**Architecture:** All work is confined to `package.json` files, `.changeset/`, `.github/workflows/`, and a new root `LICENSE`. No source files under `packages/*/src` or `apps/*` change except (a) the CLI rename rippling into the few files that reference the CLI package name, and (b) regenerated artifacts (`registry.json`, README) if metadata edits propagate. The publish graph is: Tier‑1 packages may only depend on Tier‑1 packages; `workspace:` specifiers are rewritten by `changeset publish` at pack time.

**Tech Stack:** changesets (`@changesets/cli` ^2.31.0, already installed), `changesets/action@v1`, pnpm 11.5.2 workspaces, `actions/setup-node` (Node 22) + `npm@latest` (≥ 11.5.1) for OIDC, vite+ (`vp`) for build/check/test. No new dependencies are required; the only possible additions are dev-only and only if a check needs them (avoid unless necessary).

---

## Tranche Overview

| Tranche | Title                              | Goal                                                                       |
| ------- | ---------------------------------- | -------------------------------------------------------------------------- |
| T1      | Release-set lockdown               | Confirm Tier 1; mark `ai`/`charts`/`render` private; verify dep closure     |
| T2      | Publish metadata + LICENSE         | Per-package publish fields + `files`; root `LICENSE`                         |
| T3      | Changesets correctness             | Fix stale changeset; apply CLI name decision; validate `changeset status`    |
| T4      | Trusted-publishing workflow        | Enable `release.yml`; npm upgrade; drop `NPM_TOKEN`; OIDC + provenance; docs  |
| T5      | Dry-run verification + gate        | `pnpm pack` audit; `changeset version` dry run; full CI gate                 |

---

## Files Created / Modified per Tranche

### T1 — Release-set lockdown

| Action | Path                                                            |
| ------ | -------------------------------------------------------------- |
| Modify | `packages/ai/package.json` (`private: true`)                   |
| Modify | `packages/charts/package.json` (`private: true`)              |
| Modify | `packages/render/package.json` (`private: true`)             |
| Verify | every Tier‑1 `package.json` dependency closure (no edits if clean) |

### T2 — Publish metadata + LICENSE

| Action | Path                                                            |
| ------ | -------------------------------------------------------------- |
| Create | `LICENSE`                                                      |
| Modify | `packages/core/package.json`                                  |
| Modify | `packages/tokens/package.json`                               |
| Modify | `packages/themes/package.json`                              |
| Modify | `packages/icons/package.json`                              |
| Modify | `packages/i18n/package.json`                              |
| Modify | `packages/storage/package.json`                          |
| Modify | `packages/react/package.json`                          |
| Modify | `packages/mcp/package.json`                          |
| Modify | `packages/registry/package.json`                  |
| Modify | `packages/cli/package.json`                      |
| Modify | root `package.json` (add `license`, `repository`, `author` to inherit/document) |

### T3 — Changesets correctness

| Action | Path                                                            |
| ------ | -------------------------------------------------------------- |
| Modify | `.changeset/initial-release.md`                               |
| Modify | `.changeset/config.json` (only if Tier‑2 handled via `ignore`) |
| Modify | `packages/cli/package.json` (name, bin — if rename chosen)    |
| Modify | files referencing the CLI package name (README, docs, dependents) — if rename chosen |

### T4 — Trusted-publishing workflow

| Action | Path                                                            |
| ------ | -------------------------------------------------------------- |
| Rename | `.github/workflows/release.yml.disabled` → `.github/workflows/release.yml` |
| Modify | `.github/workflows/release.yml` (npm upgrade, registry-url, drop `NPM_TOKEN`, provenance) |
| Create | `docs/RELEASING.md` (runbook: npmjs.com trusted-publisher setup + first-publish bootstrap) |

### T5 — Dry-run verification + gate

| Action | Path                                                            |
| ------ | -------------------------------------------------------------- |
| Verify | tarball contents per Tier‑1 package (`pnpm pack` / `npm pack --dry-run`) |
| Verify | `changeset version` dry run (reverted)                         |
| Verify | `registry.json`, README (regenerated via `pnpm regen`, no manual edits) |

---

## Key Decisions

### Decision 1 — CLI package name: rename to unscoped `cascivo` (recommended)

CLAUDE.md and the README promise `npx cascivo init / add / list / update`. `npx cascivo` resolves to a registry package literally named `cascivo`; the current package is `@cascivo/cli` (bin `cascivo`), so `npx cascivo` would fail to fetch. Two options:

- **(A, recommended) Rename the publishable package to `cascivo`** (unscoped). Keep `bin: { "cascivo": "..." }`. This makes the documented UX correct and is the only zero-friction path for first-time users. Ripples: update the package `name`, the `@cascivo/cli` dependency edges (the CLI is depended on by nothing internal — verify), the changeset entry, and README/docs references.
- **(B) Keep `@cascivo/cli`** and update all docs to `npx @cascivo/cli`. Lower churn now, worse first-run UX, contradicts existing copy.

The plan executes **(A)**. If the maintainer prefers (B), only T3's rename steps change; everything else is identical. Unscoped names are not auto-public/private — `publishConfig.access: "public"` still applies and the unscoped name must be available on npm (verify in T3).

### Decision 2 — License: MIT (recommended)

Permissive, expected for a shadcn/Carbon-class design system, and compatible with the copy-paste distribution model (users own component source). T2 creates a root `LICENSE` (MIT, copyright holder = the maintainer/org) and sets `"license": "MIT"` on every Tier‑1 package. If a different license is chosen, only the `LICENSE` body and the `license` SPDX string change.

### Decision 3 — Tier‑2 packages: `private: true` (recommended) over changesets `ignore`

`@cascivo/ai`, `@cascivo/charts`, `@cascivo/render` are not part of the documented v1 npm surface and have no stable external API. Setting `private: true` is a single source of truth: changesets skips private packages (`privatePackages.version: false` is already set), `changeset publish` refuses them, and `pnpm pack` won't tar them — while apps in the workspace can still import them. The alternative (`ignore` array in `.changeset/config.json`) leaves them `private: false` and publishable by a stray `npm publish`. Use `private: true`.

> Note: `@cascivo/charts` is `0.0.1` and consumed by the landing page. Marking it private does **not** break the workspace import — only npm publishing. Confirmed by T1's build check.

### Decision 4 — `@cascivo/registry`: publish it (recommended)

The CLI depends on `@cascivo/registry` (`workspace:^`). At publish time changesets rewrites that to a real version range, so `registry` must exist on npm. Bundling it into the CLI (vp pack, then drop the dep) is possible but adds build complexity and a second source of truth for registry data. Publishing it keeps versions in lockstep via `updateInternalDependencies: "patch"`. Publish it.

### Decision 5 — `files` allowlist per package

- **JS/TS packages** (`core`, `icons`, `i18n`, `storage`, `react`, `mcp`, `registry`): `files: ["dist"]` — only built output ships; `src`, tests, tsconfig stay out of the tarball.
- **CLI**: `files: ["dist", "bin"]` — the `bin/cascivo.mjs` shim plus built `dist`. (Verify the bin shim path resolves post-publish; T5 confirms via tarball audit.)
- **CSS-only packages** (`tokens`, `themes`): `files: ["src"]` (already set) — they ship raw CSS; their `exports` point at `./src/*.css`. No build artifact, no change beyond metadata.

### Decision 6 — Provenance & npm version

Trusted publishing auto-enables provenance on npm ≥ 11.5.1, but `changeset publish` shells out to whatever `npm` is on `PATH`. The workflow therefore (a) `npm install -g npm@latest`, and (b) sets `NPM_CONFIG_PROVENANCE: true` + `publishConfig.provenance: true` as explicit belt-and-suspenders so provenance is attached even if a future npm changes defaults.

### Decision 7 — First-publish bootstrap

All ten names are unpublished. npm trusted-publisher configuration may require a package to exist first. T4's runbook documents both paths: (1) configure the trusted publisher pre-publish if npm allows it for the org, else (2) a one-time bootstrap publish per package using a short-lived **granular automation token** (scoped to publish, deleted immediately after), then attach the trusted publisher and run all subsequent releases tokenless. The workflow itself never contains a token.

---

## Cross-Tranche Rules

1. `pnpm exec vp check` must pass after each tranche before committing.
2. No behaviour changes to any component, layout, chart, app, or skill. This sprint touches only `package.json`, `.changeset/`, `.github/workflows/`, `LICENSE`, `docs/RELEASING.md`, and CLI-name ripples.
3. Tier‑1 packages may depend (in `dependencies`/`peerDependencies`) only on other Tier‑1 packages or third-party packages — never on a private package. Private packages may appear only in `devDependencies` (e.g. `@cascivo/react` dev-depends on `@cascivo/components`, which is bundled at build).
4. No `NPM_TOKEN` (or any long-lived publish token) is committed to a workflow or `.npmrc`.
5. Keep the drift gate green: after metadata edits run `pnpm regen && pnpm exec vp check --fix && git diff --exit-code`; commit regenerated artifacts if they changed.
6. Preserve existing `exports`, `types`, `bin`, `sideEffects`, and build scripts — only add the missing publish fields; do not restructure working exports maps.
7. Versions stay `0.0.0` in source; the **changeset** drives the first bump (minor → `0.1.0`). Do not hand-edit `version` fields.
</content>
