# Astro First-Class Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A plain `astro add react && pnpm add @cascivo/react` app renders styled with no config.
`@cascivo/astro` handles everything that needs page-level injection: layer order, theme CSS, a
theme script that survives view transitions, and SSR-safe theming. CI proves all of it on a real
tarball install.

**Architecture:** Three layers.
1. Package metadata (the `astro-component` keyword) gets Astro to bundle cascivo into its server
   build, so the CSS graph is walked with zero config.
2. Runtime fixes in `@cascivo/core` (theme) and `@cascivo/components` (Tabs/Accordion, toast,
   Modal/Popover) remove the assumption of one document and one request.
3. A new `@cascivo/astro` integration injects what no package export can: the `@layer` order, the
   theme stylesheet and the inline theme script.

**Tech Stack:** Astro 7.4 (Vite 8/Rolldown), `@astrojs/react` 7.1, React 19, `@preact/signals-react`,
vite+ (`vp`), `node --test` framework checks, Playwright with Chromium. Do not hard-code a
browser path: CI installs Chromium with `pnpm --filter @cascivo/site exec playwright install
chromium --with-deps` (`.github/workflows/ci.yml:257`); a sandbox may ship one preinstalled.

**Spec:** [`../specs/2026-10-17-ai-era-gap-analysis-design.md`](../specs/2026-10-17-ai-era-gap-analysis-design.md)
(W1). Evidence: [`../specs/2026-10-17-research/01-astro.md`](../specs/2026-10-17-research/01-astro.md).
Read both before starting.

## Global Constraints

- Component authoring rules in `CLAUDE.md` apply: no `useState`/`useEffect`/`useContext`/
  `useLayoutEffect`/`useReducer`; DOM side effects in `useSignalEffect`; all CSS in
  `@layer cascivo.component`.
- `pnpm ready` passes before every commit. Because Tasks 1, 3, 4, 5 and 6 touch published packages,
  also run `pnpm isolated:check` and `pnpm pack:check` before those commits.
- `pnpm framework:check` is the authority for the adopter path. A green
  `apps/examples/astro-islands` is not evidence: it uses `workspace:*`, which Vite never
  externalizes.
- Peers are explicit and ranged. `@cascivo/astro` declares peers `astro: ">=7.0.0"` (the only
  tested major) and `@cascivo/themes: ">=1.0.0"` (themes is at 1.0.3, tokens at 1.3.1; a
  `>=1.9.0` floor would exclude every published version). It has one runtime dependency,
  `@cascivo/core` (`workspace:^`, so the published range starts at the release that carries Task 3's
  `reapplyOn`), imported only through the React-free `@cascivo/core/pure`. It does not depend on
  `@cascivo/tokens`: `DEFAULT_LAYERS` is inlined at build time. Adopters must not be asked to
  declare core or tokens themselves (`scripts/checks/scaffold-contract.test.ts:104`).
- The CLI's workspace package is named `cascivo`, not `@cascivo/cli`: run its tests with
  `vp run cascivo#test`.
- Every published package that ships CSS carries the keyword `astro-component`. Today those are
  `@cascivo/react`, `@cascivo/charts`, `@cascivo/ai`, `@cascivo/editor` and `@cascivo/flow`.
- The canonical layer order comes only from `packages/tokens/src/layers.css`
  (`@cascivo/tokens/layers.css`). Never copy the order statement by hand. Whatever is injected
  first must already contain every layer name the page will use (`vendor` lowest, app layers in
  place), because a name declared later is appended on top.
- Every behaviour change gets a changeset. `@cascivo/astro` starts at `0.1.0`, outside the `fixed`
  group in `.changeset/config.json`, like `@cascivo/vite-plugin`.

## Review Focus

These are the failure modes most likely to reach adopters. Each one has a test in the task named.

1. A visitor whose stored theme is `dark` loads an SSR'd island that calls `useTheme()`, on a page
   where a `ThemeProvider defaultTheme="dark"` lives in a different island that may hydrate later.
   Expected: no React #418 hydration error, and the island shows `dark` right after hydration
   (Task 3).
2. Two SSR requests in one process: one renders `<ThemeProvider value="dark" defaultTheme="dark">`,
   the next renders no provider. Expected: the second renders exactly what a fresh process renders
   (Task 3).
3. An adopter writes `<Tabs><TabsTrigger/>…</Tabs>` directly in a `.astro` file. Expected: the build
   fails, naming the cause and the fix (compose inside one `.tsx` island), instead of rendering
   nothing (Task 4).
4. A user opens a Modal in a `transition:persist` island in a browser without `Element.moveBefore`,
   then navigates. Expected: the dialog is still modal and Escape closes it (Task 5).
5. An adopter on an older `@cascivo/react`, with no integration and no `resolve.noExternal`.
   Expected: `cascivo doctor` names the missing config (Task 7).

---

### Task 1: Zero-config styling with the `astro-component` keyword

Astro's dependency crawl inlines a package into its server build when the package's `keywords`
contain `astro` or `astro-component`. When a package is inlined, Astro walks its `import './x.css'`
edges and emits the CSS. This was verified with a repacked tarball (report 01, R1).

**Files:**
- Modify: `packages/react/package.json`, `packages/charts/package.json`, `packages/ai/package.json`,
  `packages/editor/package.json`, `packages/flow/package.json` (add `"astro-component"` to
  `keywords`, kept sorted)
- Modify: `scripts/checks/css-contract.test.ts` (new `it` after "every node twin is preceded by a
  module condition", line ~245)
- Modify: `scripts/checks/framework-install.test.ts:298-320` (rewrite the negative arm) and the
  file's header comment (lines 1-25)
- Create: `.changeset/astro-zero-config.md` (patch for the five packages)

**Interfaces:**
- Produces: the invariant "a package that ships CSS and has a `node` twin lists `astro-component`".
  Task 8 relies on it.

- [ ] **Step 1: Write the failing guard.** In `css-contract.test.ts`, add
  `it('every CSS-bearing package carries the astro-component keyword', { skip: !built }, …)`. It
  iterates the same `candidates()` and collects `${c.name}: missing "astro-component" keyword` for
  every candidate whose `pkg.keywords` lacks it. Use `assert.deepEqual(offenders, [], <message>)`.
  The message explains that Astro externalizes the package without it and SSR'd islands render
  unstyled.
- [ ] **Step 2: Run it and confirm it fails.** Run `pnpm css-contract:check`. Expected: FAIL,
  listing the five packages.
- [ ] **Step 3: Add the keyword** to the five `package.json` files.
- [ ] **Step 4: Run it again.** Run `pnpm css-contract:check`. Expected: PASS.
- [ ] **Step 5: Flip the framework canary.**
  - Replace `it('fails without resolve.noExternal …')` with
    `it('builds styled with a vanilla astro.config (no resolve.noExternal)', …)`. Write the
    config the old arm wrote (`integrations: [react()]` and nothing else), build, and assert
    `unstyledClasses(app).every((r) => r.unmatched.length === 0)`.
  - Add `it('the keyword is what makes it work (the canary can still fail)', …)`. Remove
    `astro-component` from `node_modules/@cascivo/react/package.json` inside the scaffolded app,
    clear `node_modules/.vite` and `node_modules/.astro`, and build with the vanilla config. Assert
    that some page has unmatched classes. Restore the keyword in `finally`. **Never edit the file
    in place:** pnpm hardlinks it from the global store, so an in-place write corrupts every later
    install of that tarball (Task 9 included). Resolve the real path with `realpathSync`, write the
    edited JSON to a sibling temp file and `renameSync` it over the original, for both the edit and
    the restore. Put this in a helper `patchInstalledFile(path, edit)` that Task 9 reuses.
  - Update the header comment: the keyword is now invariant (b); `resolve.noExternal` remains as
    belt-and-braces in the scaffold.
- [ ] **Step 6: Run the framework check.** Run `pnpm framework:check`. Expected: both astro `it`s
  PASS. If the canary does not fail, the keyword is not what fixed it; stop and re-diagnose with
  report 01 §2 R1.
- [ ] **Step 7: Run the gates and commit.** Run `pnpm ready && pnpm isolated:check && pnpm pack:check`,
  then `git commit -m "fix(react): render styled under a plain Astro config"`.

### Task 2: Scaffold and fixture version drift

`cascivo create --framework astro` pins `@astrojs/react ^5.0.0` next to `astro ^7.0.0`. That
installs two Vite majors and prints 21 deprecation warnings per build. The in-repo fixture has the
same pairing.

**Files:**
- Modify: `packages/cli/src/commands/create.ts:851` (`'@astrojs/react': '^7.1.0'`) and `:860`
  (check whether `@astrojs/check ^0.9.0` is still current; it refuses TypeScript 7, so keep the
  scaffold's TypeScript on the catalog version and note it)
- Modify: `apps/examples/astro-islands/package.json` (`"@astrojs/react": "^7.1.0"`), `pnpm-lock.yaml`
- Test: `packages/cli/src/commands/create.test.ts`

- [ ] **Step 1: Write the failing test.**
  `it('astro scaffold pins an @astrojs/react major that matches astro')` parses the emitted
  `package.json` and asserts `dependencies['@astrojs/react']` starts with `^7.`.
- [ ] **Step 2: Confirm it fails.** Run `vp run cascivo#test`. Expected: FAIL (`^5.0.0`).
- [ ] **Step 3: Bump the versions** in `create.ts` and in the fixture, then run `pnpm install`.
- [ ] **Step 4: Run the tests and the fixture build.** Run `vp run cascivo#test` and
  `vp run @cascivo/example-astro-islands#build`. Expected: PASS, and no "deprecated" lines from
  `@astrojs/react` in the build output.
- [ ] **Step 5: Commit** after `pnpm ready`, with
  `git commit -m "fix(cli): pair @astrojs/react 7 with astro 7 in the astro scaffold"`.

### Task 3: Theme runtime that survives SSR, hydration and soft navigation

There are three defects, all in `packages/core/src/theme.tsx` (report 01, R3):

- `useTheme()` returns the persisted client value during the hydration render, which causes #418.
- `ThemeProvider value=…` writes the module-level store during a server render, so the value leaks
  into the next request.
- `themePreloadScript()` runs once, so a view-transition swap resets `data-theme`.

**Files:**
- Modify: `packages/core/src/theme.tsx` (`useTheme` at line 185, `ThemeProvider` at line 261,
  `themePreloadScript` at line 360)
- Create: `packages/core/src/theme-script.ts`. Move `themePreloadScript` (and `DEFAULT_KEY` /
  `DEFAULT_ATTR` if needed) here, with no imports. Re-export it from `theme.tsx` and from
  `packages/core/src/pure.ts`, so that `@cascivo/core/pure` serves it without loading React.
  `@cascivo/core`'s root entry imports `react`, `react-dom` and `@preact/signals-react` at module
  scope, so it cannot be loaded in Astro's config process.
- Test: `packages/core/src/theme.test.tsx`, plus the existing `core-pure` test (assert that
  `themePreloadScript` is exported from `pure` and that the `pure` bundle still imports no React).
- Modify: `packages/components/src/toast/toast.tsx:45` (`enqueue`) and its test
- Modify: `docs/HEADLESS.md` (theme entry: the new option and the SSR behaviour),
  `docs/AI-RULES.md` if it describes `useTheme` during SSR
- Create: `.changeset/theme-ssr-safe.md` (minor for `@cascivo/core`; note the behaviour change below)

**Interfaces:**
- Produces: `themePreloadScript(options?: { storageKey?: string; attribute?: string; defaultTheme?: string; reapplyOn?: string | readonly string[] }): string`.
  Task 6 calls it with `reapplyOn: 'astro:after-swap'`.
- Behaviour change, stated in the changeset and in `docs/UPGRADING.md`: during SSR and the
  hydration render, `useTheme()` returns the constant `'light'` (`SSR_THEME`). It moves to the
  persisted or controlled value in the render right after hydration. This matches `next-themes`.
  The `data-theme` attribute is still correct on first paint, because the scripts set it. This is
  a regression for controlled SSR: a Next.js `<ThemeProvider value="dark">` with a component that
  prints `useTheme()[0]` now renders `light` until hydration. Say so, and tell people to express
  theme-dependent visuals in CSS (`[data-theme='dark'] &`).
- **Why a constant and not `defaultTheme`:** the hydration snapshot must be identical on the server
  and the client whatever order islands render in. `ThemeProvider` writes the module `config`
  during render (`theme.tsx:274-285`), and in Astro a provider in another island can configure it
  on the server before a `useTheme` island renders, but on the client after that island hydrates.
  Any snapshot that reads `config` reproduces #418.

- [ ] **Step 1: Write the failing tests** in `theme.test.tsx`:
  - `hydration: useTheme renders the server snapshot, then the persisted value`. Put
    `{"v":1,"value":"dark"}` in localStorage. Render a `<Probe/>` (renders `useTheme()[0]`) to a
    string with `renderToString` while `window` is stubbed undefined. Expect `light`. Then
    `hydrateRoot` the same markup with an `onRecoverableError` spy. Expect the spy not to be called,
    and after `act`, the text to be `dark`.
  - `hydration across islands: a later-hydrating provider cannot cause #418`. Server-render two
    separate roots, `<ThemeProvider defaultTheme="dark"/>` and `<Probe/>`. Hydrate the `<Probe/>`
    root first, then the provider root. Expect no recoverable error.
  - `server isolation: a provider does not leak into the next render`. With `window` stubbed
    undefined, render `<ThemeProvider value="dark" defaultTheme="dark"><Probe/></ThemeProvider>`,
    then `<Probe/>` alone. The second output equals the output of a `<Probe/>` rendered first in a
    fresh module (use `vi.resetModules()`). The module `config` and `store` stay untouched (the
    store is still `null`).
  - `themePreloadScript reapplyOn re-applies after a swap`. Eval
    `themePreloadScript({ reapplyOn: 'astro:after-swap' })` with stored `dark`. Set `data-theme` to
    `light`, dispatch `new Event('astro:after-swap')` on `document`, and expect `dark`. Also expect
    the script without `reapplyOn` to be byte-identical to today's output (snapshot the string).
- [ ] **Step 2: Confirm they fail.** Run `vp run @cascivo/core#test -- theme`. Expected: four
  FAILs (#418 recovered error twice, `dark` leaked, attribute stays `light`).
- [ ] **Step 3: Implement.**
  - `useTheme`: keep `useSignals()`, and read the value through
    `useSyncExternalStore(subscribe, () => themeStore().value, () => SSR_THEME)`, where
    `SSR_THEME = 'light'` is a module constant and `subscribe` wraps `themeStore().subscribe`.
    `useSyncExternalStore` is not on the banned list (React >= 18 has it), and it is the React
    primitive whose `getServerSnapshot` is used for exactly the server and hydration renders.
  - `ThemeProvider`: when `typeof window === 'undefined'`, skip the whole configure block
    (lines ~274-285), the `themeStore()` call and the controlled write. The server touches neither
    `config` nor `store`. The controlled inline-script branch still renders, from the `value` prop.
  - `themePreloadScript`: wrap the body in a named function `a()`, call it once, and for each
    event in `reapplyOn` add `document.addEventListener(<event>, a)`. With no `reapplyOn` the
    output stays byte-identical.
- [ ] **Step 4: Make toast enqueue a no-op on the server.** There is no standalone `toast()`
  export and `toastQueue` is private, so test through the public API (`useToast().toast`,
  `toast.tsx:135`). Write `toast: enqueue during a server render is a no-op`: with `window` stubbed
  undefined, `renderToString` a `<ToastProvider>` whose child calls `useToast().toast({ title: 'x' })`
  during render. Then restore `window`, render a fresh `<ToastProvider/>` on the client, and expect
  no toast with title `x`. Watch it fail, then add the guard at the top of `enqueue`.
- [ ] **Step 5: Run the tests.** Run `vp run @cascivo/core#test` and
  `vp run @cascivo/components#test -- toast`. Expected: PASS.
- [ ] **Step 6: Run the gates and commit.** Run `pnpm ready && pnpm isolated:check && pnpm pack:check`,
  then `git commit -m "fix(core): hydration- and request-safe theming; preload script survives swaps"`.

### Task 4: Compound parts fail loudly outside their root

In `.astro` files every component renders separately, so `TabsTrigger` and `TabsContent` find no
store and silently return `null`. Popover and Menu already throw. Bring Tabs and Accordion in line.

**Files:**
- Modify: `packages/components/src/tabs/tabs.tsx:57` (`TabsList`), `:125` (`TabsTrigger`) and
  `:176` (`TabsContent`); `packages/components/src/accordion/accordion.tsx:95-99`
  (`AccordionItem`), `:171` (`AccordionTrigger`) and `:221` (`AccordionContent`). Also check
  `radio-card.tsx` and `hover-card.tsx` for the same `store ? … : null` pattern. No in-repo
  usage renders a part outside its root (site, storybook, examples and the
  `enhancement-renders`, `text-mode` and `no-js-disclosure` tests all nest them), so throwing is
  safe.
- Test: `packages/components/src/tabs/tabs.test.tsx`, `accordion/accordion.test.tsx`
- Modify: `packages/react` (rebuild only; it re-exports)
- Create: `.changeset/compound-parts-throw.md` (patch, react)

- [ ] **Step 1: Write the failing tests.** `TabsTrigger outside <Tabs> throws a guidance error`
  expects `render(<TabsTrigger value="a">A</TabsTrigger>)` to throw `/inside <Tabs>/` and
  `/compose .* in one \.tsx island/i`. Write the same for `TabsList`, `TabsContent` and the three
  Accordion parts. `AccordionTrigger` and `AccordionContent` used inside `<Accordion>` but outside
  an `<AccordionItem>` throw a message naming `<AccordionItem>`.
- [ ] **Step 2: Confirm they fail.** Run `vp run @cascivo/components#test -- tabs accordion`.
  Expected: FAIL (renders null).
- [ ] **Step 3: Replace each `: null` branch with a throw.** Use the exact message shape
  `` `${Part} must be used inside <${Root}>. In Astro, compose compound components in one .tsx island and hydrate that island — Astro renders each .astro child separately, so React context cannot reach it.` ``.
  Keep Popover's and Menu's existing messages as they are.
- [ ] **Step 4: Run the tests, then the gates, and commit.** Run
  `vp run @cascivo/components#test` (PASS), then `pnpm ready && pnpm isolated:check && pnpm pack:check`,
  then `git commit -m "fix(components): compound parts outside their root throw with Astro guidance"`.

### Task 5: Overlays in persisted islands without `moveBefore`

Without `Element.moveBefore`, `transition:persist` re-inserts the island, usually by moving an
ancestor. A re-inserted open `<dialog>` drops out of the top layer, but Modal's signal still says
it is open, so Escape does nothing. A removed popover is hidden without a `toggle` event (the
"fire events" flag is false on removal; confirm in Chromium), so the existing `toggle` listener in
`use-popover.ts` never hears it (report 01, R6).

**Files:**
- Modify: `packages/components/src/modal/modal.tsx` (the `useSignalEffect` that calls `showModal()`)
- Modify: `packages/components/src/popover/use-popover.ts` (it already syncs from `toggle`)
- Test: `modal/modal.test.tsx`, `popover/popover.test.tsx`

- [ ] **Step 1: Write the failing tests.**
  - `Modal re-enters the top layer after an ancestor is re-inserted`: render the modal inside a
    wrapper `<div>`, open it, then move the wrapper (`document.body.appendChild(wrapper)` after
    detaching it), which is what a persist without `moveBefore` does. Expect `showModal` to have been
    called a second time (spy; jsdom lacks the top layer), and expect the `onClose` spy NOT to have
    been called. A controlled parent would otherwise close the modal.
  - `Popover re-opens after an ancestor is re-inserted`: same move with an open popover. Expect
    `showPopover` to have been called again and the trigger's `aria-expanded` to stay `"true"`.
- [ ] **Step 2: Confirm they fail.** Run `vp run @cascivo/components#test -- modal popover`.
  Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Modal: in a `useSignalEffect` that runs only while `isOpen.value` is true, observe `document`
    with `{ childList: true, subtree: true }`. On a mutation where the dialog `isConnected` and is no
    longer modal (`!dialog.matches(':modal')`, guarded for engines without `:modal`), restore it with
    `dialog.removeAttribute('open')` then `dialog.showModal()`. Do not call `dialog.close()`: it fires
    `close`, which calls `onClose` (`modal.tsx:102-108`). Disconnect in the cleanup, so closed modals
    cost nothing.
  - Popover: the same observer pattern in `use-popover.ts` while open. If the element is connected
    and `!el.matches(':popover-open')`, call `showPopover()`.
- [ ] **Step 4: Run the tests and the visual check, then commit.** Run
  `vp run @cascivo/components#test` (PASS) and `pnpm visual:baselines:check`. Then run
  `pnpm ready && pnpm isolated:check && pnpm pack:check` and
  `git commit -m "fix(components): modal and popover state survive re-insertion"`.

### Task 6: The `@cascivo/astro` integration

**Files:**
- Create: `packages/astro/package.json`, `tsconfig.json`, `vite.config.ts`, `README.md`,
  `readme.body.md`, `src/index.ts`, `src/index.test.ts`. Copy the shape of `packages/vite-plugin`
  (build `vp pack --minify`, `exports` with `types`/`import`/`default`, and
  `publishConfig.provenance: true`).
- `package.json` must have:
  - `"name": "@cascivo/astro"` and `"version": "0.1.0"`.
  - `"keywords": ["astro", "astro-integration", "cascivo", "css", "design-system", "withastro"]`.
    The `astro-integration` keyword is what makes `npx astro add @cascivo/astro` work.
  - `peerDependencies` as listed in Global Constraints.
- Modify: every place that enumerates published packages. Check each and copy what
  `vite-plugin` gets: `scripts/checks/pkg-exports.test.ts`, `scripts/llms/generate.ts`,
  `scripts/build/minify.ts`, `scripts/quality/bundle-check.ts`, and the root `package.json`
  `build:release` `-F` list (`release-filter.test.ts` fails otherwise). Also, missing from that
  grep:
  - `scripts/registry/cli-versions.ts:26-34`: otherwise `V['@cascivo/astro']` is undefined in the
    scaffold;
  - `scripts/checks/framework-install.test.ts:61` `PACKAGES`: otherwise the scaffold fetches the
    unpublished package from npm;
  - `scripts/compat/generate.ts` `ORDER`.

  Vite source aliases in `apps/site/vite.config.ts` and `apps/storybook/.storybook/main.ts` are
  needed only if either app imports the package (CLAUDE.md "Vite aliases"). The
  `@cascivo/core/pure` aliases already exist (`apps/site/vite.config.ts:1074`,
  `apps/storybook/.storybook/main.ts:29`).
- Create: `.changeset/cascivo-astro.md`

**Interfaces:**
- Consumes: `themePreloadScript` with `reapplyOn` (Task 3), via
  `import { themePreloadScript } from '@cascivo/core/pure'`. Never import it from the root entry,
  because that loads React at module scope.
- Produces:

```ts
export interface CascivoAstroOptions {
  /** Full `@layer …;` order statement injected first on every page. Default: DEFAULT_LAYERS. */
  layers?: string
  /** Theme stylesheet injected on every page. `false` to import it yourself. Default '@cascivo/themes/light-dark.css'. */
  theme?: string | false
  /** Inline no-flash theme script. `false` to opt out. Defaults mirror ThemeProvider. */
  themeScript?: false | { storageKey?: string; attribute?: string; defaultTheme?: string }
}
/** `@layer vendor, ` + the names of the canonical statement in `@cascivo/tokens/layers.css`. */
export const DEFAULT_LAYERS: string
export default function cascivo(options?: CascivoAstroOptions): AstroIntegration
```

  **Why the order is a whole statement, not `@cascivo/tokens/layers.css`.** A layer takes its
  position from its first appearance. If the canonical statement, which has no `vendor`, went
  first, the app's later `@layer vendor, …` would append `vendor` above every cascivo layer, so
  third-party CSS would beat cascivo. The scaffold's `cascivo.example` would also land above
  `cascivo.override`. So the integration injects one complete statement first, `vendor` at the
  bottom by default (as `docs/THIRD-PARTY-CSS.md` prescribes), and an app with its own names
  passes them through `layers`.

  The integration's `name` is `'@cascivo/astro'`. In `astro:config:setup` it:
  1. calls `updateConfig({ vite: { resolve: { noExternal: [/^@cascivo\//] } } })`. This is
     belt-and-braces next to Task 1, and covers `@cascivo/react` versions before the Task 1
     release;
  2. registers a Vite plugin that serves the virtual module `virtual:cascivo/layers.css`, whose
     content is `options.layers ?? DEFAULT_LAYERS`. This shape was proven by the prototype in
     report 01. It also calls
     `injectScript('page-ssr', "import 'virtual:cascivo/layers.css';" + (theme ? \`import '${theme}';\` : ''))`,
     so the layer order comes first on every page;
  3. unless `themeScript === false`, calls
     `injectScript('head-inline', themePreloadScript({ ...themeScript, reapplyOn: 'astro:after-swap' }))`.

  `DEFAULT_LAYERS` is computed at build time from `packages/tokens/src/layers.css` and inlined
  into the bundle, with no hand-copied list and no runtime dependency on `@cascivo/tokens`. Read
  the file in `vite.config.ts` and expose it through `define`. A unit test pins that it starts with
  `@layer vendor, cascivo.reset` and ends with `cascivo.override;`.

- [ ] **Step 1: Write the failing unit tests** in `src/index.test.ts`. Call
  `cascivo().hooks['astro:config:setup']` with spies for `updateConfig` and `injectScript`. Assert:
  - the `noExternal` regex matches `@cascivo/react`;
  - the `page-ssr` script imports `virtual:cascivo/layers.css` before the theme;
  - the plugin's `load('\0virtual:cascivo/layers.css')` returns `DEFAULT_LAYERS`, and returns a
    custom `layers` statement verbatim when one is passed;
  - `DEFAULT_LAYERS` lists `vendor` first and every name of the tokens statement in the same order;
  - `theme: false` drops the theme import;
  - the `head-inline` script contains `astro:after-swap`;
  - `themeScript: false` injects no `head-inline` script.
- [ ] **Step 2: Confirm they fail.** Run `vp run @cascivo/astro#test`. Expected: FAIL (module
  missing).
- [ ] **Step 3: Implement `src/index.ts`** to the interface above. Type `AstroIntegration` from
  `astro` as a type-only import.
- [ ] **Step 4: Run the tests and the package gates.** Run `vp run @cascivo/astro#test`,
  `pnpm pack:check` and `pnpm isolated:check`. Expected: PASS.
- [ ] **Step 5: Use it in the scaffold.** In `packages/cli/src/commands/create.ts`:
  - Extract the order statement in `astroLayersCss()` (line 920) into a constant
    `ASTRO_LAYER_ORDER`, and use it in both places so the two cannot drift.
  - Change `astroConfig()` to emit
    `integrations: [react(), cascivo({ layers: ASTRO_LAYER_ORDER, theme: '@cascivo/themes/${opts.theme}.css', themeScript: { defaultTheme: opts.theme } })]`.
    Keep `resolve.noExternal`.
  - Add `@cascivo/astro` to `astroPackageJson`.
  - Remove the `@cascivo/themes/${opts.theme}.css` import from `astroLayout()` (line 951). It has
    no inline script to remove.
  - The defaults (`light-dark.css`, and an OS-preference script) would overwrite `midnight` and
    every other non-light/dark theme and render it grayscale. Add a test that scaffolds with
    `--theme midnight` and asserts that the emitted config passes `midnight` through to both
    options.
  - Keep the reset and base rules in `astroLayersCss()`. Its order statement is now idempotent,
    because it repeats what ran first.
  Update `create.test.ts` to match, then run `vp run cascivo#test`.
- [ ] **Step 6: Run the gates and commit.** Run `pnpm ready && pnpm framework:check`, then
  `git commit -m "feat(astro): @cascivo/astro integration (layers, theme, view-transition-safe theme script)"`.

### Task 7: CLI awareness: `init` and `doctor` detect Astro

**Files:**
- Modify: `packages/cli/src/commands/doctor.ts`: extend the existing `checkSsrConfig(cwd)`
  (line 344) instead of adding a parallel detector. For an Astro config it must accept only
  `resolve.noExternal`, the `@cascivo/astro` integration, or an installed `@cascivo/react` with the
  `astro-component` keyword. Its current `/noExternal/` regex also accepts `ssr.noExternal`, which
  Astro ignores; that is a bug to fix here.
- Modify: `packages/cli/src/commands/init.ts`: after init, when an `astro.config.{mjs,ts,js,mts}`
  exists, print Astro-shaped next steps: `npx astro add @cascivo/astro`, compose compound
  components in `.tsx`, and hydrate only the interactive islands.
- Test: `packages/cli/src/commands/doctor.test.ts`, `init.test.ts`

- [ ] **Step 1: Write the failing tests.**
  - `doctor warns on Astro without the integration or keyword`: a temp dir with an
    `astro.config.mjs` that does not mention `@cascivo/astro` or `noExternal`, and an installed
    `node_modules/@cascivo/react/package.json` without the `astro-component` keyword. Expect a
    warning containing `@cascivo/astro`.
  - `doctor stays quiet when the keyword is present`.
  - `doctor still warns when the Astro config only sets ssr.noExternal`.
  - `init prints Astro next steps`.
- [ ] **Step 2: Confirm they fail.** Run `vp run cascivo#test -- doctor init`. Expected: FAIL.
- [ ] **Step 3: Implement** the detection and messages. Read the installed `@cascivo/react`
  `package.json` as `unknown` and narrow it before reading `keywords` (CLAUDE.md "Security").
- [ ] **Step 4: Run the tests, then the gates, and commit.** Run `vp run cascivo#test` (PASS),
  then `pnpm ready`, then `git commit -m "feat(cli): init and doctor detect Astro"`.

### Task 8: Layer order travels with every component stylesheet

Component CSS files open with `@layer cascivo.component{…}` and no order statement, so whichever
stylesheet arrives first fixes the order. Astro's dev mode with MDX layouts gets this wrong
(report 01, R4). The tokens file already documents prepending as the contract ("Every entry path
emits it first").

**Files:**
- Modify: `packages/react/vite.config.ts`: in the plugin that post-processes emitted CSS assets,
  prepend the order statement read from `packages/tokens/src/layers.css`, extracted as the single
  `@layer …;` statement.
- Apply the same to `packages/charts`, `ai`, `editor` and `flow` if they emit per-module CSS
  (check their `vite.config.ts`).
- Test: `scripts/checks/css-contract.test.ts`:
  `it('every shipped stylesheet opens with the canonical layer order')`

- [ ] **Step 1: Write the failing test.** For every `dist/**/*.css` of each candidate package,
  assert that the first `@layer` rule is a statement (ends in `;`) identical to the one in
  `packages/tokens/src/layers.css`.
- [ ] **Step 2: Confirm it fails.** Run `vp run -r build && pnpm css-contract:check`. Expected: FAIL.
- [ ] **Step 3: Implement the prepend.** Check that `pnpm audit:bundle` budgets still pass; the
  statement is about 120 B per file before gzip.
- [ ] **Step 4: Run the gates and commit.** Run `pnpm ready && pnpm isolated:check && pnpm pack:check`,
  then `git commit -m "fix(react): every component stylesheet declares the layer order"`.

### Task 9: CI: the naive-adopter Astro arm

The scaffold hides the bugs adopters hit. Add a hand-written fixture that mirrors
`astro add react && pnpm add @cascivo/react`, and test it in build, preview, dev and the browser.

**Files:**
- Create: `scripts/checks/fixtures/astro-naive/` with:
  - `astro.config.mjs` (vanilla, integrations `[react(), mdx()]`) and `src/layouts/Layout.astro`
    (imports `@cascivo/themes/light-dark.css`, includes `<ClientRouter/>`);
  - one page per directive: `load`, `visible`, `idle`, `only`, `none`;
  - `mdx.mdx` (with a `layout:`);
  - `vt-a.astro` and `vt-b.astro` (with a `transition:persist` island holding a Modal);
  - `shared.astro` (two islands sharing a module-level signal, plus Toast);
  - `theme.astro` (an island rendering `useTheme()`);
  - `src/components/*.tsx` islands, including `TabsIsland.tsx` composed in `.tsx`.
- Create: `scripts/checks/astro-browser.ts`, the Playwright assertions, used by the test below.
- Modify: `scripts/checks/framework-install.test.ts`: new `describe('astro (naive adopter)')`
  that copies the fixture into the temp workspace and installs the tarballs plus
  `astro@${process.env.ASTRO_VERSION ?? '^7.4.0'}`, `@astrojs/react` and `@astrojs/mdx`. Run it in
  two variants, vanilla and with `cascivo()` added.
- Create: `.github/workflows/framework-latest.yml`: weekly `schedule` plus `workflow_dispatch`,
  running `pnpm framework:check` with `ASTRO_VERSION=latest`. SHA-pin every action, and grant no
  `id-token` permission (spec W7).

- [ ] **Step 1: Write the assertions** in `astro-browser.ts`. Each one is an exported function the
  test calls:
  - `assertFirstResponseStyled(url)`: fetch the SSR HTML, collect the cascivo class names, and
    confirm that every one has a rule in a linked stylesheet;
  - `assertHydrates(page)`: click the counter, the text changes;
  - `assertNoHydrationErrors(page)`: no `pageerror`, and no console message matching
    `/#418|hydrat/i`;
  - `assertThemeSurvivesSoftNav(page)`: set `dark`, navigate `vt-a`→`vt-b`, and confirm
    `data-theme` is still `dark`;
  - `assertLayerOrderFirst(css)`: the first `@layer` in the page CSS is the canonical statement.
    Run this for `mdx` in dev;
  - `assertNoBarrelIsland(html)`: no `astro-island[component-url]` points at
    `@cascivo/react`'s `dist/index.js`;
  - `assertModalSurvivesPersist(page)`: run with an init script that deletes
    `Element.prototype.moveBefore` (CI's Chromium has it). Open the Modal on `vt-a`, navigate to
    `vt-b`, and expect `dialog:modal` to match and Escape to close it. This pins Review Focus 4.
- [ ] **Step 2: Wire it into the test.** For each variant run `astro build` → `assertNoBarrelIsland`
  and the class match; `astro preview` → all browser assertions; `astro dev` → the browser
  assertions plus `assertLayerOrderFirst` on `/mdx`. Stop dev and preview with `astro dev stop` and
  `astro preview stop`, because both are daemons in Astro 7. Patch installed files only through
  Task 1's `patchInstalledFile` helper.
- [ ] **Step 3: Make sure the check can fail.** Temporarily revert the Task 3 `useTheme` change in
  the packed `@cascivo/core` (edit the installed copy) and confirm that `assertNoHydrationErrors`
  fails. Remove `reapplyOn` from the injected script and confirm that
  `assertThemeSurvivesSoftNav` fails. Record both in the test file as named `it`s that patch the
  installed copy and expect failure, as the Task 1 canary does.
- [ ] **Step 4: Run the framework check.** Run `pnpm framework:check`. Expected: PASS, with a
  runtime increase of about 2 minutes. Make sure the `framework:check` job in
  `.github/workflows/ci.yml:305` installs Chromium as line 257 does, and give
  `framework-latest.yml` the same install step.
- [ ] **Step 5: Commit.** `git commit -m "test(framework): naive-adopter Astro arm with browser assertions"`

### Task 10: Docs: Astro is first-class

**Files:**
- Rewrite: `docs/USING-WITH-ASTRO.md`. Cover:
  - zero config from the Task 1 release, and `npx astro add @cascivo/astro` for the theme and
    layers;
  - composing compound components in `.tsx`, and never `client:*` a `@cascivo/react` export
    directly from `.astro`: it measured 326 KB of JS and 331 KB of CSS;
  - theme across `<ClientRouter/>`;
  - Starlight coexistence (its theme picker drives cascivo's dark mode);
  - Preact: `client:only="preact"` works and server-rendered Preact islands do not. Fix the stale
    claim that `client:only` crashes;
  - verification status, pointing at the Task 9 arm.
- Modify: `docs/COMPATIBILITY.md`, but only the hand-written Frameworks rows (around line 18). Its
  package table sits between generated markers and comes from `scripts/compat/generate.ts`.
  Also modify `docs/TROUBLESHOOTING.md` (unstyled islands, #418, theme reset after navigation) and
  the `packages/astro/readme.body.md` content.
- Run `pnpm regen` (llms, context and README package tables pick up `@cascivo/astro`).

- [ ] **Step 1: Write the docs and run `pnpm regen && pnpm doc-urls:check && pnpm claims:check`.**
  Expected: PASS. `claims:check` guards only hard-coded counts, so check by hand that every
  "verified" sentence points at the Task 9 arm.
- [ ] **Step 2: Commit** after `pnpm ready`, with `git commit -m "docs(astro): first-class Astro guide"`.

## Follow-ups (not in this plan)

- A dev toolbar app (`addDevToolbarApp`) that flags compound parts outside their root, components
  marked `clientJs: 'required'` with no directive, barrel islands and unloaded theme CSS.
- Per-component subpath exports (`@cascivo/react/tabs`), so a directly hydrated export costs one
  component. This needs per-entry `.d.ts`; today the types are flattened into `dist/index.d.ts`.
- File the Preact-under-Astro issue upstream, with the minimal repro kept in
  [`../specs/2026-10-17-research/01-astro-lab-sources.md`](../specs/2026-10-17-research/01-astro-lab-sources.md). The owner should post it.
- Request isolation for the module-scope i18n locale (`packages/i18n/src/locale.ts`). Spec W8
  needs its own design.
- Real Safari and Firefox runs of Task 5 (only Chromium is installed in CI today; spec W8).
