# @cascivo/css

## 0.1.0

### Minor Changes

- eaefb56: New package: cascivo's markup contract as plain CSS. `@cascivo/css/cascivo.css` and `@cascivo/css/<unit>.css` ship every component with unhashed `cv-<unit>-<local>` classes plus a `cv-<unit>` alias on each root; `@cascivo/css` exports the typed `classes` map and the `Contract` types; `@cascivo/css/contract.json` is the versioned contract; `@cascivo/css/vite` exports `cascivoScopedName` for Vite CSS modules.
