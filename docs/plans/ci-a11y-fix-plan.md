# Fix plan: failing nightly a11y CI runs

Scope: the two scheduled workflows that have **never passed** since they were added.

| Run | Workflow | History |
| --- | --- | --- |
| [29142860998](https://github.com/cascivo/cascivo/actions/runs/29142860998) | AT sweep (screen readers) — `.github/workflows/a11y-at.yml` | 5/5 runs failed |
| [29142133285](https://github.com/cascivo/cascivo/actions/runs/29142133285) | Axe sweep (all stories) — `.github/workflows/axe.yml` | 8/8 runs failed |

Neither failure is a regression from the head commit (`fc86da2`, a bot catalog rebuild). The AT sweep fails on
two pure infrastructure bugs before any screen reader runs. The axe sweep fails on 122 of 652 stories: 2 are
sweep-infrastructure errors, the remaining ~120 are genuine WCAG violations that cluster into a small number of
root causes (one contrast token accounts for the majority).

Work is organized in phases. Phases 1–2 are small and make the AT sweep green on their own. Phases 3–7 burn
down the axe sweep. Each phase is independently commit-able and has its own verification gate.

---

## Phase 1 — AT sweep: Windows build crash (`flatten-types.mjs`)

**Symptom** (NVDA job): `vp run -r build` dies in `packages/flow/scripts/flatten-types.mjs` with
`Error: spawnSync pnpm ENOENT`.

**Root cause:** the script calls `execFileSync('pnpm', [...])`. On Windows, `pnpm` is a `pnpm.cmd` shim;
`execFileSync` without `shell: true` cannot spawn `.cmd` files at all on Node ≥ 18.20/22 (the
CVE-2024-27980 hardening), so the lookup fails with ENOENT. The identical script exists in **four**
packages, all in the Windows build path:

- `packages/react/scripts/flatten-types.mjs:22`
- `packages/charts/scripts/flatten-types.mjs:22`
- `packages/editor/scripts/flatten-types.mjs:22`
- `packages/flow/scripts/flatten-types.mjs:22`

**Fix** (apply identically to all four; they only got as far as flow because of build ordering — the other
three would fail the same way next):

```js
const isWin = process.platform === 'win32'
execFileSync(
  'pnpm',
  ['exec', 'vp', 'pack', '--out-dir', isWin ? `"${outDir}"` : outDir, '--dts', '--no-clean', 'src/index.ts'],
  {
    cwd: pkgRoot,
    stdio: 'inherit',
    // pnpm is pnpm.cmd on Windows; .cmd files require a shell on Node >= 22.
    shell: isWin,
  },
)
```

The `outDir` quoting matters because with `shell: true` Node joins args without escaping, and the temp path
can contain spaces on developer machines (CI's `RUNNER~1` short path happens not to).

Note: `packages/editor/scripts/check-pack.mjs:18` has the same latent bug (`execFileSync('npm', …)`), but it
only runs via `verify:pack`, which is not in any CI build path. Fix it the same way while there (one-line),
or leave it — it does not block either workflow.

**Verify:** `pnpm exec vp run -r build` still passes on Linux (`pnpm ready` covers it). Windows can only be
verified by dispatching the workflow (see Phase 8).

---

## Phase 2 — AT sweep: `npm install` cannot parse `workspace:` deps

**Symptom** (VoiceOver job; NVDA hits it too once Phase 1 lands): the "Install AT tooling" step
`npm install --no-save @guidepup/guidepup playwright` inside `apps/storybook` fails with
`npm error code EUNSUPPORTEDPROTOCOL — Unsupported URL Type "workspace:": workspace:^`.

**Root cause:** `apps/storybook/package.json` dependencies use the pnpm-only `workspace:` protocol. npm
parses the *entire* dependency tree even with `--no-save`, so this step can never succeed. This has failed
on every run of the workflow.

**Fix** — in `.github/workflows/a11y-at.yml`, both jobs, replace the npm-based step with pnpm (which
understands `workspace:`):

```yaml
- name: Install AT tooling (not committed to the lockfile)
  run: |
    cd apps/storybook
    pnpm add -D @guidepup/guidepup playwright
    pnpm exec playwright install webkit        # chromium in the NVDA job
```

Details:

- `pnpm add -D` mutates `apps/storybook/package.json` and `pnpm-lock.yaml` **in the ephemeral CI checkout
  only** — nothing is committed, which preserves the step's stated intent ("not committed to the lockfile").
- `apps/storybook/scripts/at-sweep.mjs:80-82` dynamically imports `@guidepup/guidepup` and `playwright` as
  bare specifiers; ESM resolves them from the script's ancestor `node_modules`, so they must land in
  `apps/storybook/node_modules` — which `pnpm add` there does.
- Keep `npx --yes @guidepup/setup` as-is (standalone package, no workspace deps involved).
- Use `pnpm exec playwright install …` rather than `npx playwright install …` so the just-installed
  playwright is the one resolved.

**Verify:** no local verification possible (needs macOS/Windows + screen readers). `workflow_dispatch` the
AT workflow after merge; both jobs should now reach the "Sweep" step. Whether the sweep itself grades green
is a separate (announcement-quality) concern outside this plan's scope — the plan's acceptance bar for this
workflow is that both jobs get past install/build into the sweep.

---

## Phase 3 — Axe sweep: infrastructure errors (2 stories)

### 3a. axe-core version collision (`inputs-editable--no-submit-on-blur` "unknown rule" error)

**Root cause:** two axe-core versions run in the same iframe. `@axe-core/playwright@4.11.3` (the sweep,
`pnpm-workspace.yaml:40`) injects axe-core **4.11.4**; `@storybook/addon-a11y@10.4.2`
(`apps/storybook/.storybook/main.ts:14`) bundles axe-core **4.12.0** into the preview
(`storybook-static/assets/axe-*.js`, 579 kB) and sets `window.axe`. Depending on load timing, AxeBuilder's
run mixes rule state across versions → `Error: Result for unknown rule. You may be running mismatch
axe-core versions`. It is intermittent (hit 1 story this run), so it must be fixed at the source, not
retried away.

**Fix (do both):**

1. **Single axe-core version.** Per the dependency policy (latest stable), first try bumping
   `@axe-core/playwright` in the `pnpm-workspace.yaml` catalog to the newest release; if that release
   depends on axe-core 4.12.x, done. If no such release exists yet, add a root override instead so both
   consumers resolve one version:

   ```yaml
   # pnpm-workspace.yaml (there is already an `overrides:` block at the end)
   overrides:
     axe-core: 4.12.0
   ```

   Prefer overriding **up** to 4.12.0 (minor-compatible for `@axe-core/playwright`, which just injects
   `axe.min.js` and calls `axe.run`) so the sweep also gets 4.12's rule fixes. Run
   `pnpm install` and confirm `grep 'axe-core@' pnpm-lock.yaml` shows a single version.

2. **Defensive isolation in the sweep.** In `apps/storybook/scripts/axe-sweep.mjs`, after `page.goto(...)`
   and the settle wait, clear any axe global the addon may have installed before AxeBuilder injects its own:

   ```js
   await page.evaluate(() => { delete window.axe })
   ```

   This makes the sweep immune to future version drift between the addon and the builder.

### 3b. `editor-codeeditor--large-document` — axe analyze timeout (45 s)

**Root cause:** the story renders `makeMarkdownDoc(50_000)` (50k lines,
`apps/storybook/stories/editor/code-editor.stories.tsx:46`, fixture
`packages/editor/src/engine/large-doc.fixture.ts`) into both the `<textarea>` and the highlight `<pre>`;
axe's `color-contrast` rule over that DOM blows the sweep's 45 s guard (`axe-sweep.mjs:86-90`). The sweep
has **no** skip mechanism today — it audits every `type === 'story'` entry and ignores story tags and
`parameters.a11y`.

**Fix:** add an explicit per-story rule-exception table to `axe-sweep.mjs` (keeps the story fully audited
for every other rule; no story changes; grep-able):

```js
// Stories whose DOM is too large for specific rules to finish inside the
// per-story budget. Everything else still runs against the full tag set.
const RULE_EXCEPTIONS = {
  'editor-codeeditor--large-document': ['color-contrast'],
}
```

and in `auditStory`:

```js
let builder = new AxeBuilder({ page }).withTags(TAGS)
const disabled = RULE_EXCEPTIONS[story.id]
if (disabled) builder = builder.disableRules(disabled)
const results = await Promise.race([builder.analyze(), /* existing 45s guard */])
```

**Verify (3a+3b):**
`pnpm --filter @cascivo/storybook run build && pnpm --filter @cascivo/storybook run test:axe` — the two
error entries must be gone (violations from later phases will still fail the run until those land).

---

## Phase 4 — Axe sweep: shared color tokens (fixes ~70 of the 122 stories)

All measurements below are WCAG relative-luminance ratios computed from the OKLCH theme values in
`packages/themes/src/light.css` (the sweep runs the default light theme).

### 4a. `--cascivo-color-text-muted` — THE big one

`light.css:38` maps it to `gray-400` (`oklch(0.707 0.015 264)` ≈ `#9ca1aa`) = **2.60:1 on white**. Fails on
every light surface. It is the muted/hint/caption color used by ~18 failing components **and** by the
Design-Tokens catalog story (529 failing nodes — every `TokenCard` value/caption in
`apps/storybook/stories/DesignTokens.stories.tsx` uses it; fixing the token fixes the catalog story too, so
do **not** exclude that story from the sweep).

**Fix:** darken to `oklch(0.5 0.016 264)` (≈ `#5f636d`): 6.00 on white, 5.45 on gray-100, 4.74 on the
secondary bg — passes 4.5:1 on all light surfaces. (A remap to gray-500 is NOT enough: 4.34 on gray-100.)

Components covered by this single change (their failing element is muted/hint/caption text):
pagination, breadcrumb, combobox `--with-hint`, data-table `--pagination`, date-picker `--with-hint`,
editable `--empty`, file-uploader (hint/size text), multiselect (placeholder — the aria failures are
Phase 5), progress-indicator, tags-input `--disabled`, time-picker `--with-hint`, chat-bubble,
code-snippet (caption + `.comment`), field `--with-description`, log-viewer (timestamps), toc, user
`--basic`, design-tokens catalog.

### 4b. `--cascivo-color-foreground-muted`

`light.css:35`, `oklch(0.554 0.018 264)` ≈ `#6d737e`: 4.77 on white (barely passes) but **4.34 on
gray-100/surface-2 and 3.77 on the secondary bg → fails**. This is what breaks `ai-ailabel--generating`
(muted text on surface-2).

**Fix:** darken to `oklch(0.5 0.018 264)` (clears 4.5:1 on all light surfaces).

### 4c. Missing `--cascivo-color-info-foreground`

`light.css` defines passing dark text variants for success (line 79), warning, destructive — but **no info
variant**, so components fall back to raw `--cascivo-color-info` (blue-600, 4.37:1 on blue-50 → fail).

**Fix:** add to the semantic block:

```css
--cascivo-color-info-foreground: oklch(0.45 0.19 250); /* ≈ #0052bc, 6.5:1 on blue-50 */
```

### 4d. `--cascivo-chart-axis`

`light.css:120` maps to gray-400 (2.60:1) — axis/label text in charts; this is what fails `charts-kpi--default`.
**Fix:** map to the same `oklch(0.5 0.016 264)` as 4a.

### Theme parity + regen

- Apply equivalent adjustments in `dark.css` and `warm.css` **only if** the same tokens fail there
  (check: dark theme muted grays are usually lighter-on-dark and may already pass — compute before
  touching; the sweep only exercises light, but the brand docs in `docs/specs/brand-color.md` /
  `color-usage.md` should stay coherent). Do not blindly copy the light values.
- Run `pnpm regen` (the token catalog / docs pages derive from tokens) and commit whatever it regenerates,
  per the drift gate.

**Verify:** re-run the sweep; every story listed in 4a plus `ai-ailabel--generating`, `charts-kpi--default`
should drop off the failure list (ai-label done/error remain until Phase 6).

---

## Phase 5 — Axe sweep: naming/labeling fixes (7 components, 2 stories, 1 meta example)

i18n ground rule (CLAUDE.md): new default strings go into `packages/i18n/src/builtin.ts` in **both** the
`en` defaults and the `de` `defineCatalog` block, with a `labels`-prop override where the component has one.
Only three new catalog keys are needed:

| Key | en | de |
| --- | --- | --- |
| `builtin.tagsInput.label` | `Tags` | `Schlagwörter` |
| `builtin.multiSelect.label` | `Options` | `Optionen` |
| `builtin.dateRangePicker.label` | `Date range` | `Zeitraum` |

1. **TagsInput** — `label (critical)`, 5 stories. The inner `<input>`
   (`packages/components/src/tags-input/tags-input.tsx:74-94`) only has a placeholder when empty; with tags
   present it has no accessible name. Add `aria-label={t(builtin.tagsInput.label)}` (overridable via the
   existing labels pattern).

2. **MultiSelect** — `aria-input-field-name` + `aria-required-children`, all 5 stories.
   `multi-select.tsx:125-137` puts `role="listbox"` on the popover container, which (a) has no accessible
   name and (b) directly owns the `<input type="search">` (role `searchbox` — not a permitted listbox
   child; only `option`/`group` are). Fix: strip `role`/`aria-multiselectable` from the popover container;
   move `role="listbox" aria-multiselectable="true" aria-label={labels?.label ?? t(builtin.multiSelect.label)}`
   onto the options container div (`:152`) whose direct children are the `role="option"` nodes. Add
   `label?: string` to `MultiSelectLabels`.

3. **DateRangePicker** — `button-name (critical)`, 2 stories. The trigger
   (`date-range-picker.tsx:229-243`) is a `<button role="combobox">`; combobox is `nameFrom: author`, so
   its visible text does not name it. Add
   `aria-label={labels?.label ?? t(builtin.dateRangePicker.label)}` and `label?: string` to
   `DateRangePickerLabels`.

4. **RadialProgress** — `aria-progressbar-name`, 3 stories. `radial-progress.tsx:24-42`:
   `role="progressbar"` is `nameFrom: author`; even the custom-label story's visible "45 GB" doesn't count.
   Fix without i18n: `const labelId = useId()`, put `id={labelId}` on the visible label span, and set
   `aria-labelledby={labelId}` on the progressbar div unless the caller passed `aria-label`.

5. **Avatar** (breaks `layout-indicator--online-status`, `display-item--item-with-media-content-and-actions`,
   `layout-stack--tight-stack`) — `role-img-alt`. `avatar.tsx:41-42` sets `role="img"` whenever the image
   isn't shown (including when `src` 404s in static Storybook), but `aria-label` computes to `undefined`
   when neither `alt` nor `fallback` is set. Fix in the component:

   ```tsx
   const label = alt || fallback
   role={showImage ? undefined : label ? 'img' : undefined}
   aria-label={showImage ? undefined : label || undefined}
   ```

   A nameless avatar becomes decorative (the fallback span is already `aria-hidden`) instead of an
   unlabeled image.

6. **Switcher** — `list (serious)`, 2 stories. `switcher.tsx:32` renders dividers as
   `<li role="separator">`, which strips the listitem role, so the `<ul>` has a non-listitem child. Fix:
   keep the `<li>` a plain listitem and move `role="separator" aria-orientation="horizontal"` to an inner
   `<span>` (move the divider class to the span; add a minimal `dividerItem` class if needed).

7. **PasswordInput** — `aria-prohibited-attr`, 2 stories. The strength meter
   (`password-input.tsx:108-113`) is a plain `<div aria-label=…>` (role generic — `aria-label` prohibited).
   Fix: `role="meter" aria-valuenow={strength.score} aria-valuemin={0} aria-valuemax={4}` alongside the
   existing `aria-label` (string already comes from `builtin.passwordInput.strengthLabel`; no new key).

8. **Story-content fixes** (empty-args stories rendering unlabeled controls — fix the stories, not the
   components):
   - `apps/storybook/stories/CheckboxCard.stories.tsx:11` — `Primary` has no `title`, so the wrapping
     label is empty. Give it args: `{ title: 'Automated backups', description: 'Daily snapshots, 30-day retention' }`.
   - `apps/storybook/stories/Radio.stories.tsx:11` — `Primary` has no `label`. Args:
     `{ value: 'pro', label: 'Pro' }`.

9. **NativeSelect meta example** — `select-name (critical)` on the generated
   `inputs-nativeselect--option-children` story. The component is intentionally label-less (pairs with
   `Field`); the *example* in `packages/components/src/native-select/native-select.meta.ts:102-107` omits
   any name. Add `aria-label="Theme"` to the example's `<NativeSelect …>` code (it flows through
   `{...props}` to the `<select>`), then `pnpm stories:generate` (or `pnpm regen`) and commit the
   regenerated story.

**Verify:** component tests still pass (`vp run @cascivo/components#test`); sweep drops all
label/name/list/prohibited-attr entries for these components. Update `*.meta.ts` accessibility notes if any
describe the old ARIA shape.

---

## Phase 6 — Axe sweep: structural + component-local color fixes

1. **Menu/Popover stories — `nested-interactive`.** `MenuTrigger`/`PopoverTrigger` already render a real
   `<button>` (`menu.tsx:82-93`, `popover.tsx:32-42`); the stories nest a `<Button>` inside them →
   `<button><button>…`. Fix the **stories** (the meta examples already show plain text children):
   - `apps/storybook/stories/Menu.stories.tsx:16-18, 33-35` → `<MenuTrigger>Actions ▾</MenuTrigger>`
   - `apps/storybook/stories/Popover.stories.tsx:17-19, 33-35, 49-51` → `<PopoverTrigger>Open popover</PopoverTrigger>`
   (The standalone `<Button onClick>` in the Controlled story at line 31 is fine.)

2. **Menu/Popover trigger — `target-size`.** After (1), the bare trigger can render under 24×24 px:
   `menu.module.css:2-21` has only 4 px padding; `popover.module.css:2-4` is empty. Add to `.trigger` in
   both: `min-block-size: 1.5rem; min-inline-size: 1.5rem;` (1.5rem = 24 px = `--cascivo-space-6`;
   popover also needs `display: inline-flex; align-items: center; justify-content: center;` which menu
   already has). Note the existing `--cascivo-target-min-coarse` (44 px) rule still applies under
   `pointer: coarse` per the authoring rules — this 24 px floor is the axe/WCAG 2.5.8 minimum for fine
   pointers.

3. **Combobox/DatePicker clear button — `target-size`.** `.clear` in
   `combobox.module.css:96-114` and `date-picker.module.css:92-109` is a ✕ button at `text-xs` with 4 px
   padding (~20 px box). Same fix: `display: inline-flex; align-items: center; justify-content: center;
   min-block-size: 1.5rem; min-inline-size: 1.5rem;`.

4. **Charts — `aria-prohibited-attr`** (plaincharts 47 nodes, boxplot, bubble, bullet, combo, heatmap,
   histogram, radar, pie--empty). Two sources:
   - `aria-label` on roleless SVG primitives (`<g>/<rect>/<circle>/<line>/<polygon>`):
     `boxplot.tsx:154,206`, `bubble-chart.tsx:171,195`, `heatmap.tsx:163`, `histogram.tsx:133`,
     `combo-chart.tsx:195`, `radar.tsx:199-207`, `bullet.tsx:97,107`, `treemap.tsx:124`.
     **Preferred fix: remove these per-mark `aria-label`s.** The accessible name already lives on the
     chart frame's `svg[role="img"] aria-label={title}` (`core/chart-frame.tsx:219-220`) and every chart
     ships a fallback data table (per the metas' a11y rationale) — the marks are decorative. Do NOT
     add `role="img"` per mark; hundreds of named images per chart is worse SR UX.
     (Leave `bullet.tsx:63` alone — `aria-label` on `<figure>` is permitted.)
   - Legend wrapper `legend.tsx:21`: `<div aria-label="Chart legend">` (role generic). Fix:
     `role="group"` on that div (this alone fixes `charts-piechart--empty`).

5. **CodeEditor — `aria-allowed-attr` (critical, ~18 stories).** `code-editor.tsx:873-896`: the always-on
   `aria-expanded={slashOpen.value}` sits on a plain `<textarea>` (role `textbox`, which doesn't allow
   `aria-expanded`). Fix: add `role="combobox"` to the textarea — combobox permits `aria-expanded`
   (required), `aria-controls`, `aria-activedescendant`, matching the slash-menu pattern. Existing tests
   asserting those attrs (`code-editor.test.tsx:479,500`) keep passing; extend one test to assert the role.

6. **CodeEditor — remaining `color-contrast`.** The editor's failures are its syntax-highlight palette
   (`--cs-comment`/`--cs-string`/etc., shared with code-snippet's `.comment` which Phase 4a partly covers)
   on the editor background — component-local colors, not shared tokens. After Phases 4–5 land, re-run the
   sweep filtered to the editor (`AXE_MAX_STORIES` won't filter by id, so just grep the report), compute
   which swatches still fail, and darken them to ≥ 4.5:1 against the editor bg in both editor themes.

7. **AILabel done/error + Steps markers — white-on-mid-fill.** `ai-label.module.css:19,23` hard-codes
   white text on `color-success`/`color-error` fills (3.07/3.87 at xs size);
   `steps.module.css:69,75,95` same pattern + raw `color-error` text. Fix per component: switch the badge
   to the subtle scheme (`*-subtle` bg + `*-foreground` text — the pairs that pass, see Phase 4 table) or
   darken the fills; do not change the shared `color-success/error` tokens (they're correct for
   fills/borders/icons).

8. **Status-token-as-text swaps** (raw `--cascivo-color-{info,success,warning,error}` used as *text*
   color; all fail 4.5:1 on their subtle/white backgrounds — the passing `-foreground` variants exist,
   plus the new `info-foreground` from Phase 4c):
   - `tag.module.css:32,37,42` → `info-foreground` / `success-foreground` / `warning-foreground`
   - `alert.module.css:20,77,136` (info) and `:80,83,139,142` (success/warning) → `-foreground` variants
     (lines 35/50 already do this — make the rest consistent)
   - `file-uploader.module.css:95`, `stat.module.css:32`, `log-viewer.module.css:110-139`,
     `code-snippet.module.css:96,118,126,130`, `steps.module.css:95` → same swap.
   This fixes: tag info/success/warning, alert info/actionable, ai-label primary/done/error (with item 7),
   file-uploader `--with-files` status text, stat `--with-trend`, log-viewer levels, code-snippet terminal,
   steps `--with-explicit-error-state`.

9. **ConsoleApp + FlowStory contrast** — not attributable to shared tokens (console-app uses `text-subtle`
   which passes on white). After Phases 4+6.8 land, re-run the sweep for
   `shell-consoleapp--*` and `flow-flowstory--*`; whatever remains is a local fg/bg pairing on their tinted
   panels — inspect the reported node targets in the axe output (add a temporary
   `console.log(JSON.stringify(v.nodes))` in the sweep or run axe DevTools on the story) and darken the
   local color. Budget: expected to be 1–2 CSS declarations each.

**Verify:** full sweep after this phase should print `Zero axe violations across 652 stories.`

---

## Phase 7 — Guardrails so it stays green

1. `axe.yml` says "promote to `pull_request` once it runs clean". Once Phase 6 verifies zero violations,
   add `pull_request:` to the workflow's `on:` block (keep `schedule` + `workflow_dispatch`) so regressions
   block PRs instead of rotting for a week. If runtime (~9 min) is a concern, use the existing `AXE_SHARD`
   env to split into 2–3 parallel jobs.
2. Keep the `RULE_EXCEPTIONS` table (Phase 3b) as the single documented escape hatch; any addition needs a
   comment justifying it.

---

## Phase 8 — Verification & rollout

Per-phase gates are listed above. Final gate, in order:

1. `pnpm ready` (regen → check --fix → build → type check → tests) — zero errors/warnings; commit anything
   regen/`--fix` touched (Phase 5.9 and Phase 4 regen will produce diffs).
2. `pnpm --filter @cascivo/storybook run build && pnpm --filter @cascivo/storybook run test:axe` → exit 0,
   "Zero axe violations across 652 stories."
3. `pnpm breakpoint:check` and `pnpm fallback:check` (CSS edits in Phases 4/6 must not introduce off-scale
   literals or unfallbacked `@function`/`if()` uses).
4. Push, then `workflow_dispatch` **both** workflows on the branch/main:
   - Axe sweep → green end-to-end.
   - AT sweep → both jobs must get past install + build into the "Sweep" step (screen-reader grading
     quality is out of scope; if the sweep itself surfaces announcement failures, file follow-ups —
     do not bundle into this change).

### Suggested commit slicing

One commit per phase (1, 2, 3, 4, 5, 6, 7) — each independently green under `pnpm ready`, so a partial land
still improves the nightly failure count monotonically.

### Explicit non-goals

- No component API changes beyond additive `labels` keys and ARIA attributes.
- No redesign of the AT grading pipeline (`at-lib.mjs`) or committed `at-results.json`.
- No dark/warm theme contrast audit beyond keeping edited tokens coherent (the sweep only runs light);
  file a follow-up to sweep the other themes once light is green.
