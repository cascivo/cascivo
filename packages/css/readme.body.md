cascivo's components as plain CSS with **stable, unhashed class names**, for plain HTML, htmx,
Solid or any other framework. Parts are `cv-<unit>-<local>` classes (`cv-button-label`), every
root also answers to `cv-<unit>` (`cv-button`), and variant/state are `data-*` attributes. The
same names are rendered by `@cascivo/react` and by the `cascivo-html` Rust crate.

## Usage

```ts
import '@cascivo/themes/light.css' // tokens + a theme first
import '@cascivo/css/cascivo.css' // every component (or one: '@cascivo/css/button.css')
import { classes as c } from '@cascivo/css'

const html = `<button class="${c.button.alias}" data-variant="primary">
  <span class="${c.button.label}">Save</span>
</button>`
```

`classes` is typed from the contract, so `c.button.lable` is a compile error.

## Exports

| Path                         | What                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------ |
| `@cascivo/css`               | `classes` (unit → `root`, `alias`, one key per part) and the `Contract*` types |
| `@cascivo/css/cascivo.css`   | every component sheet, in `@layer cascivo.component`                           |
| `@cascivo/css/<unit>.css`    | one component (`button.css`, `data-table.css`, …)                              |
| `@cascivo/css/contract.json` | the contract: unit → tier, classes, parts, `data-*` values, `aria-*`, roles    |
| `@cascivo/css/vite`          | `cascivoScopedName`, `createCascivoScopedName` for Vite CSS modules            |

## Vite: contract names for copied components

Components you own (`npx cascivo add`) are hashed by your bundler. To make them emit the
contract names too (needed only when React markup meets htmx/plain-HTML markup):

```ts
import { cascivoScopedName } from '@cascivo/css/vite'

export default defineConfig({ css: { modules: { generateScopedName: cascivoScopedName } } })
```

`<unit>/<file>.module.css` maps to the contract; every other module, and any local the contract
does not list, stays hashed. Another layout: `createCascivoScopedName({ unit: (file) => … })`.

## Versioning

Semver follows `contract.json`, not the CSS bytes: removing or renaming a class, part, `data-*`
value or role is major; adding one is minor; visual and token changes are patches.
