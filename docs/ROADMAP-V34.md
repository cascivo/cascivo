# cascivo — Roadmap v34: Package Publishing — Changesets + npm Trusted Publishing

**Last updated:** 2026-06-17
**Status:** 🚧 Planning
**Plan documents:** `docs/superpowers/plans/2026-06-17-v34-master-plan.md` + tranches 1–5

---

## Vision

Every package in the monorepo is still `0.0.0` and unpublished. Changesets is _scaffolded_ (config, `changeset` / `version-packages` / `release` scripts, a `release.yml.disabled` workflow) but it has never run, the one staged changeset names a package that no longer exists (`cascade`), and the disabled workflow publishes with a long-lived `NPM_TOKEN`.

v34 turns this into a **working, tokenless release pipeline**: decide exactly which packages ship to npm, give each one correct publish metadata, make the changesets flow correct, and wire a GitHub Actions release workflow that publishes via **npm OIDC trusted publishing** (no `NPM_TOKEN` secret, automatic provenance). No component or app behaviour changes — this is release infrastructure only.

---

## Current State (what exists today)

| Area             | State                                                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Changesets CLI   | Installed (`@changesets/cli` ^2.31.0), `.changeset/config.json` present (`access: public`, base `main`)                                        |
| Root scripts     | `changeset`, `version-packages` (`changeset version && pnpm install`), `release` (`vp run -r build && changeset publish`)                      |
| Staged changeset | `.changeset/initial-release.md` — **stale**: lists `cascade` (does not exist) instead of `@cascivo/cli`, omits `i18n` / `storage` / `registry` |
| Release workflow | `.github/workflows/release.yml.disabled` — uses `changesets/action@v1` with **`NPM_TOKEN`** (not trusted publishing)                           |
| CI workflow      | `.github/workflows/ci.yml` — PR gate only (`push: main` commented out)                                                                         |
| Package metadata | **No** package has `repository`, `license`, `author`, `homepage`, `bugs`, `keywords`, or `publishConfig`; most lack a `files` allowlist        |
| LICENSE file     | **Missing** at repo root                                                                                                                       |
| Versions         | Every package is `0.0.0` except `@cascivo/charts` / `@cascivo/search` (`0.0.1`)                                                                |

---

## Package inventory & publish disposition

Sixteen packages. Three are already `private: true` (correct — copy-paste / internal). Thirteen are `private: false`, but not all should ship in v1.

### Tier 1 — Release set (publish to npm)

| Package                               | Why it ships                                  | `files` today | Action                                                     |
| ------------------------------------- | --------------------------------------------- | ------------- | ---------------------------------------------------------- |
| `@cascivo/core`                       | Signal/FSM runtime — foundation of everything | _(none)_      | add `files: ["dist"]` + metadata                           |
| `@cascivo/tokens`                     | CSS design tokens                             | `["src"]` ✓   | metadata only                                              |
| `@cascivo/themes`                     | Three+ first-party themes (CSS)               | `["src"]` ✓   | metadata only                                              |
| `@cascivo/icons`                      | SVG icon components                           | _(none)_      | add `files: ["dist"]` + metadata                           |
| `@cascivo/i18n`                       | Runtime **dependency of `@cascivo/react`**    | _(none)_      | add `files: ["dist"]` + metadata                           |
| `@cascivo/storage`                    | Persisted signals — documented public package | _(none)_      | add `files: ["dist"]` + metadata                           |
| `@cascivo/react`                      | Prebuilt component distribution               | `["dist"]` ✓  | metadata only                                              |
| `@cascivo/mcp`                        | MCP server (bin: `cascade-mcp`)               | `["dist"]` ✓  | metadata only                                              |
| `@cascivo/registry`                   | Runtime **dependency of the CLI**             | _(none)_      | add `files: ["dist"]` + metadata                           |
| CLI (`@cascivo/cli` → see Decision 1) | `npx cascivo init / add / list / update`      | _(none)_      | add `files: ["dist","bin"]` + metadata + **name decision** |

### Tier 2 — Hold (mark `private: true` until ready)

| Package           | Current      | Rationale                                                                 |
| ----------------- | ------------ | ------------------------------------------------------------------------- |
| `@cascivo/ai`     | public 0.0.0 | AI layer is still scaffolding; not part of the documented v1 npm surface  |
| `@cascivo/charts` | public 0.0.1 | Consumed only internally (landing/docs); not yet a stable public API      |
| `@cascivo/render` | public 0.0.0 | Internal rendering helper (depends on react+i18n+core); no external story |

Marking these `private: true` keeps them usable inside the workspace (apps still import them) while excluding them from versioning/publishing. Equivalent alternative: add them to `ignore` in `.changeset/config.json`. **Recommendation: `private: true`** (single source of truth, prevents accidental publish).

### Tier 3 — Already private (no change)

`@cascivo/components` (copy-paste registry), `@cascivo/layouts` (copy-paste), `@cascivo/search` (internal).

---

## Dependency closure (why i18n / storage / registry must ship)

```
@cascivo/react  ──▶ @cascivo/core, @cascivo/i18n        # i18n must publish
@cascivo/i18n   ──▶ @cascivo/core
@cascivo/themes ──▶ @cascivo/tokens
@cascivo/cli    ──▶ @cascivo/registry                   # registry must publish (or be bundled)
@cascivo/storage──▶ @cascivo/core
```

`workspace:^` / `workspace:*` specifiers are rewritten to real version ranges by `changeset publish` at pack time, so every published package's `dependencies` must themselves be published. A Tier‑1 package may **not** depend (in `dependencies`/`peerDependencies`) on a Tier‑2/Tier‑3 package — T1 verifies this invariant.

---

## npm Trusted Publishing — what it requires

Trusted publishing replaces the `NPM_TOKEN` secret with short-lived OIDC credentials minted by GitHub Actions, and turns on provenance automatically.

1. **npm ≥ 11.5.1** in the runner. `actions/setup-node` (Node 22) bundles npm 10.x, so the workflow must `npm install -g npm@latest` before publishing.
2. **Workflow permissions:** `id-token: write` (mint OIDC), `contents: write` (changesets tags/commits), `pull-requests: write` (the "Version Packages" PR).
3. **No `NPM_TOKEN`.** Remove it from the workflow env entirely.
4. **`registry-url`** on `actions/setup-node` (`https://registry.npmjs.org`) so the runner `.npmrc` points at npm.
5. **Per-package config on npmjs.com:** each package's _Trusted Publisher_ must name `cascivo/cascivo`, workflow `release.yml`, and (optionally) an environment. This is a one-time manual step documented in T4.
6. **First-publish bootstrap:** these names have never been published. If npm requires a package to exist before a trusted publisher can be attached, do a one-time bootstrap publish with a short-lived **granular automation token**, then switch to fully tokenless. T4 documents both paths.

`changeset publish` shells out to `npm publish` per package; with npm ≥ 11.5.1 + OIDC present it mints the token and attaches provenance automatically. `publishConfig.provenance: true` + `NPM_CONFIG_PROVENANCE: true` are added as belt-and-suspenders.

---

## Workstreams

| #   | Workstream                  | Tranche | Summary                                                                                                             |
| --- | --------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------- |
| A   | Release-set lockdown        | T1      | Confirm Tier 1; mark `ai`/`charts`/`render` private; verify dep closure                                             |
| B   | Publish metadata + LICENSE  | T2      | `repository`/`license`/`author`/`homepage`/`bugs`/`keywords`/`files`/`publishConfig` per Tier‑1 pkg; root `LICENSE` |
| C   | Changesets correctness      | T3      | Fix stale changeset; CLI name decision; validate config; `changeset status` dry run                                 |
| D   | Trusted-publishing workflow | T4      | Enable `release.yml`; npm upgrade; drop `NPM_TOKEN`; OIDC + provenance; npmjs.com setup docs                        |
| E   | Dry-run verification + gate | T5      | `pnpm pack` tarball audit; `changeset version` dry run; full CI gate                                                |

---

## Key open decisions (recommendations in the master plan)

1. **CLI package name** — keep `@cascivo/cli` (users run `npx @cascivo/cli …`) **or** rename the publishable package to unscoped `cascivo` so the documented `npx cascivo init` works. _Recommendation: rename to `cascivo`._
2. **License** — _Recommendation: MIT_ (permissive, matches shadcn/Carbon ecosystem expectations).
3. **Tier‑2 packages** — `private: true` vs changesets `ignore`. _Recommendation: `private: true`._
4. **`@cascivo/registry`** — publish it, or bundle it into the CLI and drop the dependency. _Recommendation: publish it_ (changesets keeps versions in lockstep; simplest).

---

## Cross-cutting rules

1. No runtime/behaviour changes to any component, layout, app, or generated artifact.
2. Tier‑1 packages may only depend on other Tier‑1 packages (publishable closure).
3. No secrets committed. The release workflow carries **no** `NPM_TOKEN`.
4. Every Tier‑1 `package.json` ends with: `name`, `version`, `description`, `license`, `repository` (+`directory`), `homepage`, `bugs`, `author`, `keywords`, `files`, `publishConfig`, `exports`/`types`.
5. Run `pnpm exec vp check` after each tranche before committing.
6. The drift gate (`pnpm regen && pnpm exec vp check --fix && git diff --exit-code`) must stay green — regenerate and commit if metadata edits ripple into generated files (e.g. `registry.json`, README).

---

## Definition of Done

### T1 — Release-set lockdown

- [ ] `@cascivo/ai`, `@cascivo/charts`, `@cascivo/render` are `private: true` (or in changesets `ignore`); apps still build.
- [ ] Tier‑1 set is exactly the 10 packages above; each is `private: false`.
- [ ] No Tier‑1 package has a `dependencies`/`peerDependencies` entry on a Tier‑2/Tier‑3 package.

### T2 — Metadata + LICENSE

- [ ] Root `LICENSE` file exists (chosen license).
- [ ] Every Tier‑1 `package.json` has `license`, `repository` (with `directory`), `homepage`, `bugs`, `author`, `keywords`, `files`, and `publishConfig: { access: "public", provenance: true }`.
- [ ] `files` includes the real publish output for each package (`dist`, `src` for CSS-only, `dist`+`bin` for the CLI).
- [ ] `pnpm exec vp check` and `pnpm build` pass.

### T3 — Changesets correctness

- [ ] `.changeset/initial-release.md` lists exactly the Tier‑1 set (no `cascade`; includes `i18n`, `storage`, `registry`, and the CLI under its final name).
- [ ] CLI name decision applied consistently (package name, `bin`, README/docs references, dependents).
- [ ] `pnpm changeset status` reports the expected version bumps and lists no Tier‑2/Tier‑3 package.

### T4 — Trusted-publishing workflow

- [ ] `release.yml` is enabled (not `.disabled`), triggers on `push: main`.
- [ ] Workflow upgrades npm to ≥ 11.5.1, sets `registry-url`, has `id-token: write` + `contents: write` + `pull-requests: write`, and carries **no** `NPM_TOKEN`.
- [ ] Provenance enabled (`publishConfig.provenance` + `NPM_CONFIG_PROVENANCE: true`).
- [ ] npmjs.com trusted-publisher setup + first-publish bootstrap documented in the workflow header / a release runbook.

### T5 — Dry-run verification + gate

- [ ] `pnpm -r exec npm pack --dry-run` (or `pnpm pack`) for each Tier‑1 package shows the expected tarball contents — `dist`/`src`/`bin` present, no `src` leak from JS packages, no tests/tsconfig.
- [ ] A throwaway `changeset version` run produces the expected version + changelog diffs (then reverted).
- [ ] Full CI gate passes: `pnpm exec vp check`, `pnpm build`, `pnpm exec vp run -r check`, `pnpm test`, drift check, `pnpm breakpoint:check`.
      </content>
      </invoke>
