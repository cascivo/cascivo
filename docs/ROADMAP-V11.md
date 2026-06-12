# cascade — Roadmap v11: The Open Ecosystem

**Last updated:** 2026-06-12
**Status:** 📋 Planned
**Plan documents:** `docs/superpowers/plans/2026-06-12-v11-master-plan.md` + tranches 1–7

---

## Vision

shadcn/ui did not win because its button is better. It won because its **registry became a
protocol**: ~300 third-party registries (Magic UI, Origin UI, Aceternity, tweakcn, Clerk,
Supabase…) distribute _into_ shadcn projects, every one of them marketing shadcn while
building on it. The directory pre-configures those namespaces in the CLI, blocks raised the
unit of reuse from "button" to "page region", and v0/Lovable made it the default UI library
of LLMs.

cascade has the better engine — fine-grained signals, modern CSS with no Tailwind/Radix/
CSS-in-JS, machine-readable manifests, an MCP server, 106 registry entries including blocks,
sections and charts — but a **closed, single-URL registry** that only we can publish to.

v11 turns cascade from a product into a protocol, and pairs the open registry with the
differentiators that answer "why cascade and not shadcn?" out loud:

> Concept: **"The open ecosystem."** Anyone can host a cascade registry; the directory makes
> it discoverable and _verified_; versioned items make `update` safe (the thing shadcn
> structurally cannot do); and every community component inherits the AI layer for free.

## The research (2026-06)

Three research passes ground this roadmap: the shadcn registry/directory mechanics, what
developers say is missing in UI libraries, and a full inventory of cascade's current state.

### What shadcn proved (mechanics worth adopting)

1. **Two-schema design**: an index (`registry.json`) + per-item JSON, both published as JSON
   Schema URLs. `shadcn build` flattens to static per-item files — any static host is a
   registry.
2. **Three addressing modes**: direct URL, configured namespace (`@acme/button` via a
   `registries` map with `{name}` URL templates + header/param auth + env expansion), and
   GitHub `owner/repo/item#ref` for zero-infrastructure registries.
3. **`registryDependencies` resolved recursively across registries** — the composability
   field that lets ecosystems depend on each other.
4. **Directory as a PR'd JSON file** with CI validation, published machine-readably
   (`/r/registries.json`) and pre-configured in the CLI — being listed is free distribution.
5. **Themes/blocks/pages as registry items**, which spawned tweakcn and the blocks economy.

### What shadcn cannot fix (our openings)

1. **Update/merge pain is structural**: copied code has no version; `diff` + hand-merge is
   the only update path and customization breaks it (shadcn discussions #7170, #1467).
2. **Tailwind lock-in** — and a love/hate relationship (17 pain mentions in State of React
   2025 even as it tops usage). A no-Tailwind option is an underserved segment.
3. **Homogeneity**: "all shadcn sites look the same" is so accepted that tweakcn's entire
   pitch is fixing it.
4. **Black-box primitives**: you own the styling wrapper, not Radix; the Radix→Base UI
   shift raised abandonment anxiety for everything built on it.
5. **Overcomplexity vs the platform**: the "215-line shadcn radio button" critique hit 355
   points on HN (Jan 2026), including reported ARIA violations.
6. **Directory trust gap**: a flat list with a "review code yourself" disclaimer — no
   validation of quality, a11y, or manifests.

### What users say is missing (ranked, State of React 2025 + community)

styling/customization difficulty (#1, 34 mentions) · major-version migration trauma (Chakra
v3) · CSS-in-JS runtime churn · bundle weight · **complex components paywalled** (MUI X Pro
data grid, date-range) · form complexity · foundation abandonment risk · docs quality · RSC
compatibility. Notably, **33% of respondents use no component library at all** — the market
is unsettled.

### Trends with deadlines

- **Popover API is Baseline; CSS anchor positioning is Interop 2025** — overlays without
  floating-UI JS are now possible with progressive fallback.
- **W3C DTCG design tokens hit first stable (2025.10)** — Figma, Style Dictionary, Tokens
  Studio are implementing.
- **European Accessibility Act enforced since 2025-06-28** (WCAG 2.1 AA, fines to €100k) —
  a11y now has a budget line; nobody markets conformance at component granularity.
- **AI prototyping users' #1 frustration**: "can't bring my own design system" to
  v0/Lovable/agents — exactly what manifests + MCP + llms.txt solve.

## The pitch — why cascade (and not shadcn)

v11's deliverables make these seven claims true and loud:

| #   | Claim                                            | Substance                                                                                                         |
| --- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| 1   | **Own your code — keep updates**                 | Versioned registry items + `cascade.lock` + three-way merge `update`. shadcn structurally cannot do this.         |
| 2   | **No Tailwind. No Radix. No runtime CSS-in-JS.** | Modern CSS + signals; primitives are owned code too; RSC-clean by construction.                                   |
| 3   | **Platform-native overlays**                     | Popover API + CSS anchor positioning + `@starting-style` — near-zero overlay JS on Chromium, fallbacks elsewhere. |
| 4   | **Distinct by default**                          | Five first-party themes + theme generator + themes as registry items — the anti-homogeneity story.                |
| 5   | **AI-first for the whole ecosystem**             | Community registry items carry manifests, so MCP / llms.txt / skills work for third-party components too.         |
| 6   | **Compliance as a feature**                      | Per-component WCAG 2.1 AA conformance generated from manifests — the EAA answer.                                  |
| 7   | **Free what others paywall**                     | Data table, date/time pickers, 16 charts already free; v11 queues calendar/date-range, tree view, virtualization. |

## Workstreams

| #   | Workstream                 | Tranche | Summary                                                                                                                                                                  |
| --- | -------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A   | Registry protocol v2       | T1      | Versioned item schema (+author/license/provenance), published JSON Schemas, static per-item build, `cascade registry build` for authors.                                 |
| B   | Multi-registry CLI         | T2      | `registries` namespace map (+auth), GitHub `owner/repo/item#ref` addressing, recursive registry dependencies, `cascade.lock`, three-way-merge `update`, `search`/`view`. |
| C   | Directory + community      | T3      | `registries.json` directory with CI validation + verified tier, docs Directory page, registry starter template, contributor guide, MCP cross-registry tools.             |
| D   | Platform-native overlays   | T4      | Popover API + anchor positioning + `@starting-style` across overlay components, progressive enhancement, "near-zero overlay JS" claim.                                   |
| E   | Gap components + forms     | T5      | Calendar/date-range picker, tree view, color picker, virtualized data-table rows via factory backlog; Standard Schema validation adapter; i18n validation messages.      |
| F   | Tokens, AI & compliance    | T6      | DTCG token export/import, `llms-full.txt`, "bring cascade to your agent" guide, generated per-component a11y conformance page (EAA).                                     |
| G   | Positioning + launch gates | T7      | "Why cascade" comparison page, README/llms refresh, full regen + drift + DoD walkthrough.                                                                                |

## Decisions baked in

1. **Adopt shadcn's proven mechanics, not its schema.** The protocol is ours (manifest-first),
   but the shapes that made the ecosystem work are copied deliberately: index + per-item
   static JSON, published schema URLs, namespace config with env-expanded auth, GitHub
   addressing, recursive registry dependencies, directory-as-PR'd-JSON.
2. **Versioning is the headline feature, not an afterthought.** Every registry item carries
   semver + a changelog entry. `cascade add` records `{registry, name, version, file hashes}`
   in `cascade.lock`; `cascade update` does a three-way merge (base = the version you
   installed, not whatever main looks like today). Conflicts produce standard conflict
   markers, never silent overwrites.
3. **The monolithic `registry.json` stays** (back-compat for the docs app, render validator,
   and existing CLI installs). The static per-item output (`/r/<name>.json`) is additive.
4. **Manifests are mandatory for directory listing.** A community item without
   `ComponentMeta` (incl. the `accessibility` block) can be _installed_ by URL but not
   _listed_. This is the verified-tier moat: cascade's directory validates schema, manifest
   completeness, and component rules in CI — shadcn's disclaims responsibility.
5. **Namespaces are config, the directory pre-configures them.** `@ns/name` resolves via the
   `registries` map in `cascade.config.ts`; directory-listed namespaces work with zero
   config because the CLI consults the published `registries.json`.
6. **No Tailwind concepts leak in.** The item schema's styling surface is cascade tokens
   (`tokens`, theme items as CSS custom-property sets) — no `cssVars`-for-Tailwind, no
   utility-class fields.
7. **Platform-native overlays ship behind progressive enhancement.** Anchor positioning is
   not yet Baseline in Firefox/Safari — `@supports (anchor-name: --a)` gates it; the current
   positioning logic remains the fallback. No regression for any browser in the support
   matrix.
8. **Gap components go through the dark factory**, not hand-built in v11: specs for
   calendar + date-range-picker, tree-view, color-picker enter `factory-backlog.json` with
   v11 milestone; the virtualized-rows enhancement lands directly in `data-table` (it's an
   enhancement, not a new component).
9. **DTCG export before import.** Export is cheap and makes cascade interoperable with
   Figma variables/Style Dictionary on day one; `cascade tokens import` (DTCG → theme CSS)
   reuses the MCP `generateThemeCss` path, hoisted to a shared module.
10. **Compliance pages are generated, never hand-written.** The EAA/a11y conformance page
    derives from `meta.accessibility` (role, WCAG level, keyboard map) at docs build time —
    same pipeline as llms generation, zero drift.
11. **Rich text editor stays out.** It is the single biggest scope trap in the gap list;
    re-evaluate in v12 with its own spec.

## Definition of Done

- [ ] A third party can host a registry as static files (`cascade registry build` output),
      and `cascade add @theirs/thing`, `cascade add <url>`, and
      `cascade add owner/repo/thing#v1` all install it — with recursive registry
      dependencies resolved across registries.
- [ ] `cascade add` writes `cascade.lock`; after upstream publishes a new item version,
      `cascade update <item>` shows the version delta and three-way merges local edits —
      a locally-customized component updates cleanly when upstream changes a different
      region, and produces conflict markers (not silent overwrite) when regions collide.
- [ ] `registries.json` exists, is validated in CI (schema + manifest completeness +
      component rules), is published at a stable URL, renders as a Directory page in docs,
      and directory namespaces resolve in the CLI with zero user config.
- [ ] The registry starter template builds a valid registry from a fresh clone, and the
      contributor guide documents the full author → validate → submit loop.
- [ ] MCP: `list_registries` exists; `search_components` / `get_component` /
      `add_to_project` work against directory registries, not just the bundled file.
- [ ] Tooltip, popover, dropdown, hover-card and menu render via the Popover API with CSS
      anchor positioning under `@supports`, with `@starting-style` entry/exit transitions;
      existing positioning fallback verified in a non-supporting engine; all existing
      component tests pass.
- [ ] `factory-backlog.json` contains v11-milestone specs for calendar, date-range-picker,
      tree-view, color-picker; data-table virtualizes ≥100k rows smoothly (windowed
      rendering behind an opt-in prop).
- [ ] `createForm` accepts any Standard Schema validator (zod/valibot/arktype verified in
      tests); built-in validation messages come from the i18n catalog.
- [ ] `tokens.dtcg.json` (spec 2025.10) is generated from `@cascade-ui/tokens` and
      published; `cascade tokens import <file>` produces a working theme from a DTCG file.
- [ ] `llms-full.txt` is generated and published; docs ship an agent-integration guide and
      a generated per-component a11y conformance page; the "why cascade" page states the
      seven claims with receipts.
- [ ] Full local CI gate exits 0: `vp check`, build, type check, tests, regeneration +
      `git diff --exit-code`.

## Deferred (do not re-litigate in v11)

- **Figma kit / Figma plugin** — large, design-resource-heavy; DTCG export (T6) is the
  technical prerequisite and lands first. Revisit in v12.
- **Rich text editor** — scope trap; needs its own roadmap entry with a real spec.
- **Paid/private registry hosting service** — header/param auth in the namespace config is
  the v11 ceiling; a hosted registry product is a different business decision.
- **Blocks marketplace / monetization layer** — let the open directory exist first.
- **v0/Lovable native plugins** — those platforms control their integrations; v11 ships the
  guide + MCP/llms surfaces they can consume.
- **Indeterminate loader, scroll-linked animations, SignalsDemo redesign, landing Playwright
  suite** — still deferred from v9/v10 backlog; unrelated to this theme.
