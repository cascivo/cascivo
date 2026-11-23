# The markup contract (`@cascivo/css`)

cascivo's components are described by one contract: stable `cv-<unit>-<local>` class names, a
`cv-<unit>` alias on each root, and the `data-*` attributes that select variants and states. The
contract is plain CSS, so it works from HTML, htmx, Solid, Rust templates or any framework. React
renders the same names.

## Use it

```ts
import '@cascivo/themes/light.css'
import '@cascivo/css/cascivo.css' // all units; or '@cascivo/css/button.css' for one
import { classes as c } from '@cascivo/css'

c.button.root // 'cv-button-button' (the root class)
c.button.alias // 'cv-button' (same root, same specificity)
c.button.label // 'cv-button-label'
c.button.lable // type error: the map is typed from contract.json
```

```html
<button class="cv-button-button" data-variant="primary" data-state="idle">
  <span class="cv-button-label">Save</span>
</button>
```

- Variants, sizes and states are `data-*` attributes, never extra classes. The allowed values per
  unit are in `@cascivo/css/contract.json` (`units.<unit>.anatomy`).
- CSS lives in `@layer cascivo.component`, so your own unlayered CSS always wins.
- Vite CSS modules that compile cascivo source use `cascivoScopedName` from
  `@cascivo/css/vite` to get the same names.
- The runnable example is [`apps/examples/solid-htmx`](../apps/examples/solid-htmx): an axum
  server (`cascivo-server`) sends htmx fragments, one Solid island uses the typed `classes`.

## Tiers

| Tier | Meaning | Rust emitter (`cascivo-html`) |
| ---- | ------- | ----------------------------- |
| `static` | Markup only | yes, with a parity case |
| `native` | Native elements do the behaviour (`<details>`, form controls) | yes, with a parity case |
| `behaviour` | Needs JS (menus, overlays, pickers). Markup is in the contract; behaviour is Phase 4 | no |

Six `static` units have no emitter yet and are listed with a reason in
`packages/components/test/html-conformance/parity-coverage-allowlist.json`: `code-snippet`,
`indicator`, `inline-citation`, `input-group`, `qr-code`, `relative-time`.

## Versioning (gate G1)

`packages/css/contract.baseline.json` is the contract of the last published `@cascivo/css`.
`scripts/contract/semver.test.ts` (in `pnpm contract:check`, part of `ready` and CI) diffs
`contract.json` against it.

- **Breaking:** a removed unit, class, part, `data-*` attribute or value; a renamed class or alias.
  It needs a changeset for `@cascivo/css` that bumps `minor` while the version is `0.x`, `major`
  from `1.0.0`.
- **Not breaking:** anything added.
- **Deprecation:** keep the old class as an alias selector for one major and mark the anatomy part
  `deprecated`. Removing it later is still breaking.
- **Releasing:** after `@cascivo/css` is published, run `pnpm contract:baseline` and commit the
  new baseline, so the next diff starts from what is on npm.

## Parity (gate G3)

Every `static` and `native` unit has a `cascivo-html` emitter, a React-vs-Rust parity case and a
`PARITY_COMPONENTS` row, or an allowlist entry with a reason (`scripts/checks/parity-coverage.test.ts`).
The allowlist may only shrink: an entry for a unit that gained an emitter fails as stale.

## Rules

- Renaming a local class in a `*.module.css` is a public change: G1 will fail until you add the
  changeset.
- `.cv` and Rust emitters take class names from `contract_gen.rs`, never from string literals.
