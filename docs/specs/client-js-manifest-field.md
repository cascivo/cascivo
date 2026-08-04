# `clientJs` — a runtime-cost tier in the component manifest

**Status: implemented**, except the build change in §6, which was attempted, measured, and
reverted — it is blocked upstream by `@cascivo/core` and needs its own spec (§6.2).
Shipped: the field on `ComponentMeta`/`BlockMeta` (68 `none`, 11 `enhancement`, 24 `required`,
101 deliberately unclassified), the `client-js-parity` guard in `meta:check`, propagation into
`registry.json` and `llms/<name>.md`, and the removal of 76 redundant `'use client'` directives.
**Origin:** Ariel Salminen, ["Progressive Web Components"](https://arielsalminen.com/2026/progressive-web-components/)
(2026). The post argues a design system should be authored in two layers — "a base layer of HTML
and CSS that renders immediately, without JavaScript, and an enhancement layer of JavaScript" — and
classifies components by how much of that base layer survives without JS. Its web-component
substrate is not applicable to cascivo; the classification is.
**Scope:** one optional field on `ComponentMeta` (`packages/core/src/types.ts:78`), its derivation
guard, and its propagation to the AI surfaces. A related build change is described in §6 and is
explicitly **not** part of this spec.

---

## 1. Verified findings

The audit below motivated the field. Every claim was checked against source or a real build of
`@cascivo/react` (`pnpm exec vp run @cascivo/react#build`, exit 0).

### 1.1 The published npm package is a single client boundary [verified]

`packages/react/vite.config.ts:231` sets `output.banner: "'use client';"`, which prepends the
directive to **every** emitted chunk regardless of what the source file declares. Both flat entries
hardcode it too (`vite.config.ts:166` for `dist/index.js`, `:194` for `dist/node/index.js`).

Measured on the built dist: **272 of 272** JS chunks carry `'use client'`, `badge/badge.js`
included, and the entry is:

```js
// packages/react/dist/index.js
'use client';
export * from './react/src/index.js';
```

Consequence: `import { Badge } from '@cascivo/react'` inside a Server Component crosses a client
boundary at the barrel. **Removing the directive from a component's source changes nothing for npm
consumers** — the banner puts it back. This corrects the initial read of the finding: the per-file
directive is not what makes these components client on the npm path.

### 1.2 The CLI copy path ships the source directive verbatim [verified]

`npx cascivo add <component>` fetches registry files and writes them unmodified —
`writeFileSafe(dest, content)` at `packages/cli/src/commands/add.ts:416` (and `:321`), with a sha256
of the same bytes recorded for update detection. No transform step exists. So on the copy-paste
path — the project's primary distribution model — the authored `'use client'` lands in the
adopter's tree and does make the file a client boundary in their RSC app.

**This is where the waste is real, and it is the only place it is real today.**

### 1.3 40 of 126 components need no client JS at all [verified]

Classified by static scan of each component directory's non-test `.tsx`, treating a component as
needing client JS if it uses a client-only React API, a signal primitive, a DOM handler, or touches
`document`/`window`.

The allowed-on-the-server set was verified empirically against `react@19.2.7` under the
`react-server` export condition rather than assumed:

| API                                        | `react-server` |
| ------------------------------------------ | -------------- |
| `forwardRef`, `memo`, `useId`, `use`        | available      |
| `useState`, `useRef`, `createContext`       | `undefined`    |

Result: **40 of 126** component directories are free of client-only APIs.

```
aspect-ratio, avatar-group, badge, blockquote, button, card, chat-bubble, code,
data-list, empty-state, field, heading, icon-button, indicator, inline-loading,
input-group, item, join, kbd, label, link, list, native-select, progress-bar,
progress-circle, progress-indicator, progress, prose, radial-progress, radio,
separator, skeleton, slider, stack, stat, status, text, timeline, user,
visually-hidden
```

Several are zero-JS because they are already built on native controls, which is exactly the base
layer the post describes: `Slider` is an `<input type="range">` (`slider.tsx:31`), `NativeSelect` a
`<select>`, `Progress` a `<progress>` (`progress.tsx:40`), `Button` a `<button>` — each fully
functional inside a form with JS disabled. `Button` reaches `Slot` from `@cascivo/core`, which is
`forwardRef` + `Children`/`isValidElement` only (`packages/core/src/slot.tsx:35`) and therefore
also server-safe.

### 1.4 Nothing records this today

`ComponentMeta` (`packages/core/src/types.ts:78`) carries `states`, `variants`, `tokens`,
`accessibility`, `intent`, `styleHooks` — nothing about runtime cost. An agent reading
`registry.json` cannot distinguish `Badge` (free) from `CommandMenu` (a dialog, a focus trap, a
typeahead, and hydration). That is the gap this field closes.

---

## 2. The field

```ts
// packages/core/src/types.ts — added to ComponentMeta
/**
 * How much client JavaScript this component needs to be correct.
 *
 * Lets an agent or adopter weigh a component's runtime cost before choosing it, and
 * marks which components can render from a React Server Component with no hydration.
 * Optional; absent means unclassified, not `'required'`.
 */
clientJs?: 'none' | 'enhancement' | 'required'
```

Optional, following the precedent of `intent` and `styleHooks`. It flows to `registry.json` for
free — `scripts/registry/generate.ts:272` embeds the whole `meta` object — so no generator change
is needed for the registry itself.

---

## 3. Tier definitions

**`none`** — the component uses no client-only React API, no signal primitive, no DOM event
handler of its own, and never touches `document`/`window`. Its server-rendered HTML is complete and
correct; disabling JS loses nothing. It may be rendered directly from a Server Component and never
hydrates. Native-control components land here even though they are interactive, because the
platform provides the interaction. Mechanically derivable — see §4.

**`enhancement`** — the server-rendered HTML is correct and its content is reachable without JS;
client JS adds interaction on top. This is the post's "partial support" tier. A component only
qualifies if **no content is unreachable with JS off** — an accordion whose panels cannot be opened
without JS is `required`, not `enhancement`, because the content is in the DOM but unreachable.
Author-declared, reviewed against that test.

**`required`** — without client JS the component renders nothing useful, or renders a shell whose
content or function is unreachable. Most overlay, disclosure, and composite-input components.
Author-declared; the default reading for anything not `none` and not argued into `enhancement`.

The tiers describe **the component**, not a usage. `Button` is `none` even though most adopters
pass `onClick` — the handler is the adopter's client code, not the component's.

---

## 4. Derivation and enforcement

`none` is fully derivable, so it should be derived rather than trusted:

- New guard `scripts/checks/client-js-parity.test.ts`, added to the `meta:check` list in
  `package.json:43`.
- For each component directory, scan non-test `.tsx` for client-only React APIs (`useState`,
  `useRef`, `useContext`, `createContext`, `useEffect`/`useLayoutEffect`/`useReducer`), any
  `@cascivo/core` signal primitive, `on[A-Z]…={…}` handler bindings, and `document.`/`window.`
  access. `forwardRef`, `memo`, `useId`, and `use` do **not** disqualify.
- Assert both directions, as `props-parity` and `style-hooks` already do:
  - a manifest claiming `clientJs: 'none'` whose source is not clean → fail;
  - a source that scans clean but whose manifest claims `'enhancement'`/`'required'` → fail.
- `enhancement` vs `required` is a judgment call the scan cannot make. The guard must not
  invent a verdict for it; it only validates the `none` boundary in both directions.

A second, independent guard falls out of §1.2 and is worth landing with it:

- **A component whose manifest says `clientJs: 'none'` must not declare `'use client'` in its
  source.** That directive is pure cost on the copy-paste path and, per §1.1, buys nothing on the
  npm path. This affects the 40 components in §1.3.

Removing the directive from those 40 is safe: the failing case (a Server Component passing
`onClick` to `<Card>`) already fails today with the directive present, because functions cannot
cross the boundary either way. There is no working usage that regresses.

---

## 5. Propagation

Once the field exists, three surfaces should read it. All are regenerated, so none can drift.

1. **`registry.json`** — automatic (`scripts/registry/generate.ts:272`).
2. **`llms/<name>.md` and `context/<name>.md`** — emit a line in the same block that already prints
   tokens and a11y (`scripts/llms/generate.ts:365`). One sentence per tier; this is the surface an
   agent actually reads when choosing a component.
3. **Docs site component page** — a badge next to the category, so a human scanning the catalog
   sees the same fact.

Nothing else needs to change. `pnpm regen` covers 1–3 and CI diffs the result.

---

## 6. The build change — attempted, measured, reverted [verified]

**Status: blocked upstream. Do not retry without fixing §6.1 first.**

The change described below was implemented and measured on 2026-08-04. Dropping
`output.banner` and making both flat entries directive-free worked exactly as predicted at
the bundler level: the rebuilt dist emitted **86 of 272 chunks** carrying `'use client'`,
with `badge/badge.js` clean, `modal/modal.js` still marked, and `dist/index.js` reduced to a
bare `export * from './react/src/index.js'`.

Then `apps/examples/react-next` failed to prerender:

```
Error: Attempted to call cn() from the server but cn is on the client.
```

### 6.1 The real blocker is `@cascivo/core`, not the barrel

`packages/core` does a **single-entry** lib build, so its 23 directive-carrying modules
collapse into one chunk and their per-module directives are dropped. Its banner
(`packages/core/vite.config.ts:15`) is what puts the directive back, and it is genuinely
load-bearing — without it Next.js treats every hook and `Portal`/`Slot` as a Server
Component. `i18n`, `storage` and `icons` carry no banner; `core` is the only sibling that
does.

The consequence: **the whole of `@cascivo/core` is a client module**, including the pure
helpers `cn` and `normalizeTone`. A directive-free `badge.js` is a Server Component, and it
imports `cn` from a client module — which is the error above. This is unrelated to
`preserveModules` and unrelated to the barrel; it would block the change no matter how the
react build is configured.

The banner in `packages/react/vite.config.ts` remains redundant for every file that declares
its own directive (its own `spliceAfterDirectives` comment says as much), but removing it
cannot pay off while `cn` is unreachable from the server.

### 6.2 What would actually unlock it

A directive-free way to import the pure helpers — most likely a `@cascivo/core/pure`
subpath built without the banner, exporting `cn`, `normalizeTone` and the tone/type
utilities, with the ~76 `clientJs: 'none'` components importing from there.

That is a public API change: it alters the copy-paste source every adopter receives, so it
touches the docs-imports guard, the manifests' `dependencies`, and the getting-started
surface. It needs its own spec. Until it lands, the directive cleanup pays off **only on the
copy-paste path** (§1.2), which is where the waste was real anyway.

## 7. The original plan for the build change (superseded by §6)

§1.1 shows the npm distribution forces every consumer through a client barrel. Fixing it means
dropping `output.banner` (`vite.config.ts:231`) and emitting the directive per chunk from the
source, plus making the two flat entries (`:166`, `:194`) directive-free so a `export *` barrel
re-exports client leaves without itself being a boundary.

That is viable — the comment at `vite.config.ts:168` ("Collapse the duplicate `'use client'`
(source directive + banner)") confirms Rolldown already preserves the source directive under
`preserveModules`, so the banner is redundant for every file that declares it. But it changes the
published RSC semantics of every component and interacts with barrel tree-shaking in Next.js. It
should be specced and measured separately, after `clientJs` exists to say which chunks are
supposed to come out clean.

**Do not bundle it into the manifest change.** (Superseded — this was attempted; see §6.)

---

## 8. Non-goals

- **Web components / custom elements.** The post's substrate. Cascivo's thesis is React + signals +
  owned source; a `@cascivo/elements` distribution would double the catalog surface and break the
  copy-paste ownership model. No.
- **Declarative Shadow DOM.** Same reason, and it would fight the light-DOM `@layer` architecture
  the whole token system rests on.
- **Reclassifying components to earn a better tier.** Rebuilding `Accordion`/`Collapsible` on
  `<details>`/`<summary>` is a real opportunity — no component in the catalog uses `<details>` today
  — but it is a component change, not a manifest change. Track separately.
- **A bundle-size number in the manifest.** Tempting adjacent field; it is a build output, not a
  design fact, and would need a size budget and CI wiring to stay honest.
