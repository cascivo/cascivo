# 05 - Trust, quality proof, AI-era workflow, enterprise, adoption (as of 2026-10-17)

Method: read the named local docs + grepped workflows/packages; web research (WebSearch/WebFetch). Items marked
[INFERENCE] are my judgement, not sourced. Items marked [UNVERIFIED] came from a single secondary source.

## 0. Corrections to the 2026-09 market analysis (repo has moved)
- Section 8.1 says "provenance/SBOM should be verified and advertised": already done. `.github/workflows/release.yml` uses `id-token: write`,
  `NPM_CONFIG_PROVENANCE: true`, changesets, and attaches a CycloneDX SBOM per package to each GitHub release; `scripts/checks/provenance.test.ts`
  pins the claim to the config; every package has `publishConfig.provenance`. docs/GOVERNANCE.md advertises it.
- Visual regression is now per-PR (sampled by `scripts/visual/select.ts`) plus nightly full (`.github/workflows/visual.yml`); the analysis' 8.3 #4 is stale.
- axe is PR-blocking across 660 stories (`.github/workflows/axe.yml`); NVDA + VoiceOver run nightly via guidepup (`a11y-at.yml`, `apps/site/.../accessibility/at-results.json`, generatedAt 2026-10-10: 12 components, 21 partial / 3 pass; JAWS absent).
- DTCG export (`scripts/tokens/dtcg.ts`), DESIGN.md generator (`scripts/design-md`), React Compiler CI leg (`compiler:check`), `cascivo mcp init` (packages/cli/src/index.ts:46), `render_view_as_markdown` MCP tool exist.
- Still true: no VPAT/ACR, no third-party audit, no JAWS, one maintainer, no LTS/SLA, benchmarks dated 2026-06-16, marketplace/directory thin (directory/registries.json has one entry; templates/ has auth, dashboard, landing).

## 1. Supply chain and registry trust

### External state (Oct 2026)
- npm trusted publishing (OIDC) GA July 2025; GitHub's Sept 2025 plan after Shai-Hulud: 2FA for local publish, 7-day granular tokens, deprecate classic tokens, expand OIDC providers
  (https://github.blog/security/supply-chain-security/our-plan-for-a-more-secure-npm-supply-chain/ ; https://www.helpnetsecurity.com/2025/09/23/npm-publishing-security-improvements/).
  Shai-Hulud 2.0 (Nov 2025) hit ~800-1000+ packages via preinstall scripts (https://www.theregister.com/2025/11/24/shai_hulud_npm_worm/); classic tokens reported revoked 9 Dec 2025 [verify against npm changelog].
  A vendor post claims bypass-2FA tokens lose publish access Jan 2027 [UNVERIFIED] (akeyless link via search).
- **Staged publishing** (npm CLI 11.15.0, May 2026): `npm stage publish` queues a tarball; a human approves with 2FA (`npm stage approve`). OIDC trusted-publisher configs can be stage-only
  (https://github.blog/changelog/2026-05-22-staged-publishing-and-new-install-time-controls-for-npm ; https://infoq.com/news/2026/08/npm-stage-available). Per https://docs.npmjs.com/trusted-publishers, configs created after 2026-09-03 default to `npm stage publish`; trusted publishers support GitHub Actions, GitLab, CircleCI; "Require 2FA and disallow tokens" recommended. Not available for first-time package names.
- **Provenance is not sufficient**: Mini Shai-Hulud / TanStack, 2026-05-11, 84 malicious versions of 42 packages, carried VALID provenance. Chain: `pull_request_target` "pwn request" + GitHub Actions cache poisoning + OIDC token extracted from runner memory
  (https://www.endorlabs.com/learn/shai-hulud-compromises-the-tanstack-ecosystem-80-packages-compromised ; https://cloudsmith.com/blog/tanstack-npm-packages-compromised-in-mini-shai-hulud-attack.md ; https://heise.de/-11291014).
- shadcn registry model: JSON items fetched at install; namespaced registries `@ns/item` (CLI 3.0), auth headers/env tokens, GitHub registries (June 2026) and private GitHub registries (Aug 2026) (https://ui.shadcn.com/docs/changelog, https://ui.shadcn.com/docs/registry/authentication).
  I found NO official shadcn signing / hash pinning / integrity story. Snyk rates shadcn agent skills MEDIUM for indirect prompt injection because registry metadata (outsider-authored free text) flows into agent context (skills.sh/Snyk audit pages from search). This is an open niche.
- MCP: spec 2025-11-25 treats servers as OAuth 2.1 resource servers, mandates RFC 8707 resource indicators; Security Best Practices page covers confused deputy, token passthrough, SSRF, session hijack, local-server compromise (one-click config must show the exact command), scope minimization
  (https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices). Tool poisoning / prompt injection via tool metadata is documented by third parties, not as a normative spec section (https://securityboulevard.com/2026/01/mcp-security-how-to-prevent-prompt-injection-and-tool-poisoning-attacks/).
- CRA: manufacturer reporting (24h/72h/14d) from 11 Sep 2026; full obligations 11 Dec 2027. Stewards: ENISA factsheet and Linux Foundation say steward reporting duty also from 11 Sep 2026 "to the extent involved in development of products"; Goodwin says steward duties 11 Dec 2027 - sources conflict
  (https://tac.aswf.io/process/cra.html ; https://www.goodwinlaw.com/en/insights/publications/2026/09/alerts-lifesciences-technology-preparing-for-eu-cyber-resilience-act ; https://www.enisa.europa.eu/sites/default/files/2026-07/ENISA_CRA_SRP_Factsheet_v1.0_0.pdf - PDF unreadable via fetch). Stewards get a light regime, no fines; a commercial seller is a manufacturer.

### What cascivo does
- Release: OIDC + provenance + CycloneDX SBOM + preflight + stale-docs check (release.yml). SECURITY.md has private reporting (GitHub PVR). pnpm `minimumReleaseAge` configured in pnpm-workspace.yaml (with exclusions list). `onlyBuiltDependencies`-style allowlist present.
- CLI: `parseItem` (packages/registry/src/validate.ts) + `isSafeRelativePath` at parse; `assertInside` at write (packages/cli/src/utils/fs.ts); 10MB / 15s / retry cap in http.ts; third-party registries print "Review before use" (add.ts ~line 215); `directory/registries.json` has `verified` flag with documented manual-review meaning (docs/CONTRIBUTING-REGISTRY.md).
- Lock: `cascivo.lock` stores sha256 of what was written; registry items carry `fileHashes` (177 hits in registry.json), used only by `update --check` and `doctor --drift` (update.ts:225).
- MCP: stdio only (no auth surface). Tools spawn `npx cascivo ...` (server.ts:235, 349, 430, 498).

### Gaps (this section)
1. `fileHashes` are NOT verified at install time and live in the same payload as the content (no independent trust root). No signed registry index, no pinning of a registry item hash in components.json/lock to be checked on a later `add`, no sigstore/cosign bundle over `registry.json` and `r/*.json`. [Evidence: grep of add.ts/registry.ts: hashes computed locally post-fetch only.]
2. Release workflow hardening vs the TanStack chain: `release.yml` job caches pnpm (`cache: pnpm`, line 52) in the same job that holds `id-token: write` (cache-poisoning vector); all actions pinned by mutable tag (`actions/checkout@v4`, `changesets/action@v1`, `peter-evans/create-pull-request@v7`, ... none SHA-pinned); `npm install -g npm@latest` in the publishing job; no `pull_request_target` anywhere (good); not using `npm stage publish` / stage-only trusted publisher / `npm audit signatures` in CI; no CODEOWNERS, no dependabot/renovate, no CodeQL/Scorecard/zizmor, no SLSA level claim beyond npm provenance, no `.npmrc`/`ignore-scripts` guidance for adopters. [INFERENCE: cache poisoning is plausible only if an untrusted-ref workflow can write the same cache key; cascivo's PR workflows use the same `cache: pnpm`, so scope by key is worth checking.]
3. MCP content trust: tools return registry/third-party-origin text (list_registries, get_template, add_template with URLs, get_guide) straight to the model with no provenance labelling, size caps or "untrusted content" framing; `add_to_project`/`add_template` can pull non-directory registries from inside an agent loop without the human "Review before use" gate [INFERENCE from server.ts + add.ts; I did not trace every tool path]. No MCP integrity pinning (tool-definition hash) and no remote/HTTP transport story (so no OAuth 2.1 / RFC 8707 work needed yet, but also no hosted endpoint for builders like Lovable/Claude Design to call).
4. Only one registry in directory; `verified` is a manual flag with no machine attestation (content-hash of the reviewed commit).
5. CRA: no stewardship statement in SECURITY.md; no documented vuln-handling policy w/ coordinated disclosure timelines, no CVE/GHSA publishing practice documented, no "end of support" dates published per line (SECURITY.md only has the 6-month rule). Cheap to add; the Linux Foundation template exists (tac.aswf.io/process/cra.html).

## 2. Proving quality to AI-era buyers

### External state
- Public, reproducible agent evals exist for frameworks: Vercel `next-evals-oss` (PROMPT.md + hidden EVAL.ts assertions, sandboxed agent, pass@4 board at nextjs.org/evals, cost per eval, tiered model reruns) https://github.com/vercel/next-evals-oss .
- Design-system AI measurements are mostly blog posts, not reproducible suites: Atlassian (MCP ~80% vs DESIGN.md ~30% correctness proxy; DESIGN.md +92% tokens, 2.7x variance; self-described as not conclusive) https://www.atlassian.com/blog/ai-at-work/atlassians-design-md-is-here-what-we-learned-testing-portable-design-context-in-practice ; Indeed (22 prompts x 3 runs x 8 configs; JSON same/better accuracy with ~80% fewer tokens - secondary account only) https://intodesignsystems.substack.com/p/ai-design-system-mcp-example .
- I found no public, re-runnable "design-system conformance" eval from shadcn, Vercel/v0, Figma, Builder.io or Anthropic/OpenAI in this search (search tool limited; absence of evidence). Figma Make kits require a React 18 + Vite npm package (https://developers.figma.com/docs/code/bring-your-design-system-package/); no accuracy numbers published that I could find. Academic adjacent: SWE-Shield (design-constraint compliance, arXiv 2604.05955).
- Storybook MCP addon (preview, React only): component manifest + agent writes stories, runs interaction + a11y tests, fixes, re-runs (https://storybook.js.org/docs/ai).
- EAA applicable since 28 Jun 2025; enforcement via national market surveillance in 2026; EN 301 549 v3.2.1 (WCAG 2.1) still binding, new version expected to be cited in OJ ~16 Dec 2026 [sources conflict] (https://www.dwt.com/insights/2026/09/european-accessibility-act-ict-standards-update). Procurement asks for ACR/VPAT (WCAG edition) per component/product.

### What cascivo publishes
- docs/BENCHMARKS.md: bundle, Mann-Whitney interaction latency, re-render counts, Lighthouse, axe parity vs shadcn/Carbon - good methodology (apps/bench/METHODOLOGY.md) but dated 2026-06-16 (pre-1.0, one machine, "source: local").
- `apps/bench/agent` ("what an agent spends to build an app"): 5 fixed prompts x 2 arms, records tokens, cost, tsc errors, `audit --ai` findings; `--publish` writes docs/AGENT-BENCHMARKS.md which DOES NOT EXIST; apps/bench/results has only results.json (perf). Harness is built, the number is not published.
- CI: axe all 660 stories PR-blocking; visual PR + nightly; NVDA/VoiceOver nightly rendered on /accessibility; bundle budgets, landing perf budget (`audit:bundle`, `audit:landing`), sparkline size budget, computed-style/RTL/bare-page/no-JS canaries, isolated-install + framework-install canaries, API-surface snapshot, React Compiler leg. This is an unusually strong gate set.
- Accessibility copy: AccessibilityStatement.tsx says "No third-party VPAT"; docs/specs/legal-mapping.md maps EAA / EN 301 549 / 508; docs/specs/at-matrix.md still shows all cells "not tested" (stale vs automated at-results.json - doc contradiction); wcag-2.2.md claims checkbox/radio 18px passes via the Spacing exception (design rationale; a reviewer may challenge; project also has coarse-pointer 44px tokens).

### Gaps
6. No published, re-runnable "LLM + cascivo" eval (the harness exists but the headline number, model-tier matrix, and a vs-shadcn+Tailwind control arm are missing). Highest-leverage proof item. Model it on next-evals-oss: hidden assertions, pass@k, cost, public JSON, tiered model reruns, transcripts.
7. No ACR/VPAT (even self-authored ACR on VPAT 2.5/WCAG edition) and no external audit; JAWS untested; at-matrix.md stale; AT grades 21 partial / 3 pass over 12 components.
8. Benchmarks stale (June, pre-1.x) and unversioned on the site; no continuous perf-regression publication (perf.yml/bench.yml exist - [not inspected in detail] - results not surfaced as a public trend).

## 3. AI dev-workflow features vs competitors

Cascivo has (verified in repo):
- `cascivo audit --ai` (packages/cli/src/audit-ai/): css-literals, jsx-props, raw-strings, required-props, unknown-names, unlayered, vendor-css, suppress directives; `--json`.
- MCP (28 tools): get_component/search/select_component, validate_component, validate_view, render_view_as_markdown, scaffold_page/view/flow, get_tokens, get_variant_matrix, create_app/compose_app, deploy_preview, lint_email, guides/context.
- ESLint: `@cascivo/eslint-plugin` v0.1.0 = only 2 rules (`prop-vocabulary`, `token-values`); `@cascivo/eslint-config` enables them at warn. Data generated from near-misses.json + registry.
- `cascivo update [--check]` with three-way merge against the locked base version (update.ts), `doctor --drift` (local-edit drift + peerVersions drift), `breaking-changes.json`, deprecation surfaced at discovery, `eject`. This is stronger than shadcn's (shadcn `diff` was deprecated/limited) [INFERENCE on shadcn's current diff behaviour].
- 8 skills in skills/ (add, add-template, create-theme, design-page, email, extend, migrate-from-shadcn, share-preview). `scripts/migration/generate.ts`.

Gaps:
9. No SARIF/GitHub annotations output or ready-made GitHub Action for `audit --ai` (only `--json`); no PR bot / "review UI against the design system" workflow; no pre-commit/hook pack for Claude Code / Cursor (post-edit hook running `audit --ai --changed`) - the analysis' "conformance loop" is manual. (grep: no sarif, no action.yml in repo.)
10. No visual verification loop tool: nothing like "render component/page -> screenshot -> return to model" in MCP (render_view_as_markdown is text-only; deploy_preview exists). Storybook MCP addon now offers test+a11y loop; cascivo has Storybook but no documented agent-test flow, no test generator (Playwright/RTL tests from `.meta.ts`).
11. ESLint coverage thin (2 rules, v0.1.0): no rules for the a11y-critical bans that CLAUDE.md enforces for adopters (e.g. missing accessible name, raw `<dialog>`/Tailwind class use, `useState` next to signals, un-called `useSignals()` - the #1 documented adopter trap in docs/TESTING.md), no codemod-backed autofix beyond Flex gap/Dialog import.
12. No codemod runner for majors (only "deprecate then remove" + breaking-changes.json); no AI-assisted migration prompt generated from breaking-changes.json (the migrate-from-shadcn skill exists, but no `cascivo migrate <from-version>`). Competitor pattern: shadcn moved from codemods to skills (per analysis 8.4 #8).
13. No adoption analytics: nothing like Omlet / react-scanner config (component + prop usage, version-drift dashboards) (https://www.npmjs.com/package/@omlet/cli ; https://www.productboard.com/blog/how-we-measure-adoption-of-a-design-system-at-productboard/). Owned code makes this harder; `cascivo.lock` + `doctor --drift` is a local primitive that could be aggregated by an opt-in `cascivo report` (org-level JSON) and a react-scanner preset. No opt-in telemetry at all [grep: none] - good for privacy, but leaves the maintainer blind to usage.

## 4. Enterprise / commercial

| Buyer requirement 2026 | Cascivo status | Evidence |
|---|---|---|
| WCAG 2.2 AA, EN 301 549 mapping | partial - claim + mapping, no audit | legal-mapping.md, wcag-2.2.md |
| ACR/VPAT | missing | AccessibilityStatement.tsx:141 |
| Screen-reader matrix incl. JAWS | partial (NVDA+VO automated; JAWS manual, empty) | at-results.json, at-matrix.md |
| Provenance + SBOM | yes | release.yml, provenance.test.ts |
| Vulnerability disclosure | basic | SECURITY.md |
| CRA steward statement / vuln-handling policy | missing | SECURITY.md |
| LTS | only "previous major 6 months security" | GOVERNANCE.md; analysis cites MUI X 2-year LTS |
| SLA / paid support | none (explicitly) | GOVERNANCE.md |
| SOC2 (hosted services) | n/a today (no hosted service); relevant only if cascivo.com/Workers deploy_preview, registry host, or hosted MCP becomes a service [INFERENCE] | - |
| Licensing | MIT; no dependency licence report / NOTICE; SBOM prod-only CycloneDX (no SPDX output) | release.yml |
| Bus factor | one maintainer, stated candidly | GOVERNANCE.md |
| Stability contract | strong (api-surface snapshot, deprecation policy, lockstep) | ci.yml `api:check` |

Gaps:
14. Enterprise tier is only a pitch page (EnterprisePitch.tsx): no downloadable security/compliance pack (SBOM index, provenance how-to, ACR, pen-test, licence report, CRA statement, DPA-n/a statement) - procurement wants a single trust page + PDF. S effort for a trust page, L for audit.

## 5. Community / adoption mechanics

- shadcn flywheel: copy-paste CLI + registry spec -> namespaced registries -> directory (the analysis counts ~149) -> v0 / MCP / skills integration -> presets/`shadcn create`, GitHub-hosted public/private registries (June/Aug 2026 changelog). Community supplies blocks; shadcn supplies distribution and the LLM prior.
- Cascivo has: `registry-starter` and `template-starter` example apps (apps/examples/*/cascivo-registry.json), `cascivo registry build`, `cascivo template init`, docs/CONTRIBUTING-REGISTRY.md and CONTRIBUTING-TEMPLATES.md, `directory/registries.json` (1 entry, schemaVersion 1) validated by `.github/workflows/directory.yml`, `marketplace.yml` daily catalog rebuild (scripts/registry/build-marketplace.ts), 3 first-party templates (auth, dashboard, landing), `create_app`/`compose_app`/blocks, shadcn-schema projection, a MIGRATING-FROM-SHADCN doc + skill.
Gaps:
15. Ecosystem is empty: 1 directory entry, 3 templates, no external contributors ("1 star" per analysis), no "Open in v0"/shadcn-directory listing evidence, no showcase of third-party registries, no registry submission bot that runs `audit` + hash-pins the reviewed commit. Seeding (S) matters more than tooling (M).

## Ranked top-10 gaps (impact, partial?, effort)

| # | Gap | Have partially? | Effort |
|---|---|---|---|
| 1 | Published, reproducible AI-conformance eval (finish `apps/bench/agent`, add shadcn+Tailwind control + no-context arm, pass@k, public JSON, rerun per model release) | Harness yes, publication no | M |
| 2 | ACR/VPAT 2.5 (self-authored first for charts+core 12, then third-party audit), JAWS pass, refresh at-matrix.md | Mapping + automated NVDA/VO | M (self-ACR) / L (audit) |
| 3 | Release-pipeline hardening post-TanStack: SHA-pin actions, drop `cache:` in the OIDC job, move to `npm stage publish` + stage-only trusted publisher + "disallow tokens", Scorecard/zizmor/CodeQL, CODEOWNERS | OIDC+provenance+SBOM yes | S |
| 4 | Signed registry: sign `registry.json`/`r/*.json` (sigstore/cosign or minisign), verify in CLI, pin hashes in `cascivo.lock`, verify `fileHashes` at add; verified-registry attestation | Hashes + path safety yes | M |
| 5 | MCP content-trust: label third-party registry content as untrusted, strip/size-cap free text, require human confirm for non-directory registry installs from agent tools; document threat model | Path validation, stdio only | S-M |
| 6 | Agent-loop tooling: `audit --ai` SARIF + GitHub Action + PR comment bot + Claude Code/Cursor hooks pack; visual-verify tool (screenshot -> critique); test generation from `.meta.ts` | audit --ai, validate_* yes | M |
| 7 | Expand `@cascivo/eslint-plugin` (a11y name, useSignals-missing, banned hooks/Tailwind in adopter code) and ship codemod/AI-migration prompt from breaking-changes.json | 2 rules, drift yes | M |
| 8 | Trust page + CRA/LTS/support policy: CRA stewardship statement, per-line EOL dates, 12-24 month LTS for latest 1.x, licence report, downloadable compliance pack | GOVERNANCE.md yes | S |
| 9 | Ecosystem seeding: 10+ real templates, 5+ external registries, shadcn Directory listing, "Open in v0", registry submission bot | Mechanics yes (starters, directory, marketplace) | M |
| 10 | Adoption/drift analytics: `cascivo report` (aggregate lock/drift JSON), react-scanner/Omlet preset, optional opt-in telemetry | `doctor --drift`, lock yes | M |

Also cheap: refresh docs/BENCHMARKS.md on 1.x and show date/version on /performance (S); fix at-matrix.md contradiction (S).
