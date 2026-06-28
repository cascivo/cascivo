# Contributing a Template

This guide covers the full loop for publishing a cascade **template** — a curated, installable page composition —
and getting it listed in the cascade marketplace. Everything is hosted on GitHub; there is no backend.

A template is a registry item (`type: "template"`). It rides the **same** transport as components: static JSON over
GitHub raw / Pages, referenced by `owner/repo/name`. If you have published a component registry before
([Contributing a Third-Party Registry](./CONTRIBUTING-REGISTRY.md)), this will feel identical — a template just adds
`registryDependencies` (the components it composes), `files` with `target`s (its own page/fixtures), and a
`TemplateMeta` in `meta`.

## Overview

```sh
cascivo add owner/repo/dashboard               # install a template
cascivo create my-app --template owner/repo/dashboard  # …into a fresh app
cascivo view owner/repo/dashboard              # preview before installing
```

You don't need approval to publish. The marketplace listing (a PR to `directory/registries.json`) is optional but
recommended for discoverability.

---

## 1. Scaffold a template

```sh
cascivo template init dashboard \
  --category dashboard \
  --framework react-vite \
  --components card,line-chart,data-table \
  --repo your-org/your-templates
```

This creates a `src/dashboard/` source folder, a `dashboard.template.ts` manifest, and an entry in
`cascivo-registry.json`. Or copy the [template starter](../apps/examples/template-starter/).

### File layout

```
your-templates/
├── cascivo-registry.json
└── src/
    └── dashboard/
        ├── dashboard.tsx          # the page (target: src/pages/dashboard.tsx)
        ├── dashboard.module.css   # styles (target: src/pages/dashboard.module.css)
        ├── fixtures.ts            # mock data (target: src/fixtures/dashboard.ts)
        └── dashboard.template.ts  # the TemplateMeta manifest
```

### Authoring rules

A template's components come from the registry (yours or first-party) — **never inline component source into the
template**. The template ships only its *own* novel files: the page, fixtures, and any layout glue. Follow the
[cascade house rules](../CLAUDE.md) for that source:

- **Signals, not hooks** — no `useState`/`useEffect`/`useContext`/`useReducer`. Use `useSignal`/`useComputed`/
  `useSignalEffect` for interactivity; React example apps call `useSignals()` first.
- **CSS custom properties only** — no Tailwind, no CSS-in-JS. `@layer components { … }` to scope styles; logical
  properties for RTL.
- **WCAG 2.2 AA** — roles, `aria-*`, keyboard operability, ≥44px coarse touch targets.
- User-visible strings default from `@cascivo/i18n`.

---

## 2. Write the registry manifest

A template item in `cascivo-registry.json`:

```json
{
  "schemaVersion": 2,
  "name": "my-templates",
  "homepage": "https://github.com/your-org/your-templates",
  "items": [
    {
      "schemaVersion": 2,
      "name": "dashboard",
      "type": "template",
      "description": "An analytics dashboard with KPI cards, a chart, and a table",
      "category": "dashboard",
      "version": "1.0.0",
      "license": "MIT",
      "author": "your-org",
      "homepage": "https://github.com/your-org/your-templates",
      "files": [
        {
          "url": "https://raw.githubusercontent.com/your-org/your-templates/main/src/dashboard/dashboard.tsx",
          "target": "src/pages/dashboard.tsx"
        },
        {
          "url": "https://raw.githubusercontent.com/your-org/your-templates/main/src/dashboard/dashboard.module.css",
          "target": "src/pages/dashboard.module.css"
        },
        {
          "url": "https://raw.githubusercontent.com/your-org/your-templates/main/src/dashboard/fixtures.ts",
          "target": "src/fixtures/dashboard.ts"
        }
      ],
      "dependencies": [],
      "registryDependencies": ["card", "line-chart", "data-table"],
      "tags": ["dashboard", "template"],
      "meta": {
        "intent": "Analytics dashboard",
        "framework": "react-vite",
        "category": "dashboard",
        "screenshots": [
          {
            "light": "https://raw.githubusercontent.com/your-org/your-templates/main/screenshots/dashboard-light.png",
            "dark": "https://raw.githubusercontent.com/your-org/your-templates/main/screenshots/dashboard-dark.png",
            "alt": "Analytics dashboard with KPI cards, a line chart, and a data table"
          }
        ],
        "demoUrl": "https://your-org.github.io/your-templates/dashboard",
        "fileRoles": {
          "src/pages/dashboard.tsx": "page",
          "src/pages/dashboard.module.css": "asset",
          "src/fixtures/dashboard.ts": "fixture"
        },
        "pages": [{ "name": "Dashboard", "target": "src/pages/dashboard.tsx" }]
      }
    }
  ]
}
```

**Template-specific fields (beyond the base item):**

| Field                       | Required | Notes                                                                          |
| --------------------------- | -------- | ------------------------------------------------------------------------------ |
| `type`                      | yes      | Must be `"template"`                                                            |
| `license`                   | yes      | SPDX id — required for templates                                                |
| `registryDependencies`      | \*       | Component names the template composes (at least one, or one `page` file)        |
| `files[].target`            | yes      | Where each file lands in the user's project                                     |
| `meta.intent`               | yes      | One-line description of what the template builds                                |
| `meta.framework`            | yes      | `"react-vite"` or `"react-next"`                                                |
| `meta.category`             | yes      | Discovery category                                                             |
| `meta.screenshots`          | yes      | At least one, each with `light` + `alt`                                         |
| `meta.fileRoles`            | yes      | Maps every `files[].target` to `page` / `fixture` / `asset` / `config`          |
| `meta.demoUrl`              | no       | A live demo (typically GitHub Pages)                                            |
| `meta.pages`                | no       | Named pages for previews and routing hints                                     |

---

## 3. Build

```sh
cascivo registry build --in cascivo-registry.json --out public/r
```

This validates every item (templates additionally run `validateTemplate`) and writes one JSON artifact per item to
`public/r/`. A template whose `registryDependencies` reference a component not in this index produces a **warning**
(the component is expected to resolve from another registry — e.g. the first-party `@cascivo` registry — at install
time). A malformed template (missing license, screenshots, or a `fileRoles` mismatch) **fails** the build.

Commit `public/r/` or publish it from CI. Re-run after every change.

---

## 4. Host (GitHub only)

Any static host works; GitHub keeps it backend-free.

**GitHub Pages (recommended)** — enable Pages pointing at `main` `/` root. Your template is then addressable as:

```sh
cascivo add your-org/your-templates/dashboard
# resolves to https://your-org.github.io/your-templates/r/dashboard.json
```

**Raw GitHub URLs** — reference `raw.githubusercontent.com` URLs directly in your `files` entries; no Pages needed.

**Vercel / Netlify** — set the publish directory to `public` and use the deployed URL.

Screenshots and the live demo are hosted in your repo / Pages too — the marketplace never hosts your assets.

---

## 5. Test locally

```sh
# Build
cascivo registry build --in cascivo-registry.json --out public/r

# Install into a throwaway app
cd /tmp && npx cascivo create demo --yes && cd demo
cascivo add /path/to/your-templates/public/r/dashboard.json
cascivo doctor    # confirm the installed source follows the house rules
```

Check that the page lands at `src/pages/dashboard.tsx`, the fixtures at `src/fixtures/dashboard.ts`, and the
components install under your components directory.

---

## 6. Submit to the marketplace

The `directory/registries.json` file indexes known registries. Add (or update) your entry and declare that it
provides templates:

```json
{
  "namespace": "@your-org",
  "name": "your-org templates",
  "description": "Dashboard, landing, and auth templates",
  "homepage": "https://github.com/your-org/your-templates",
  "registryUrl": "https://your-org.github.io/your-templates/r/{name}.json",
  "tags": ["templates"],
  "provides": ["template"],
  "verified": false
}
```

Open a PR against [cascivo/cascivo](https://github.com/cascivo/cascivo). CI validates:

1. **Schema** — the entry matches `RegistryDirectoryEntry`
2. **Reachability** — the index responds with `schemaVersion: 2`
3. **At least one template** — for entries that `provides` templates
4. **Screenshots + license** — every template passes `validateTemplate`
5. **No duplicates** — `namespace` is unique

A scheduled CI job then rebuilds the static marketplace catalog (`marketplace.json`) and the gallery picks up your
templates automatically.

### What `verified` means

`"verified": true` is set by the cascade maintainers after manual review:

- Source reviewed for malicious code
- Styles follow cascade CSS conventions (no Tailwind, `@layer` scoping)
- Accessibility spot-checked (roles, keyboard nav)
- Maintainer has agreed to respond to security reports

Verification is optional. Unverified templates are listed but shown with a warning in the gallery.

---

## Security, safety & advisories

Templates are **owned, copy-paste source** — exactly like components. Installing one writes files you review and own;
nothing is ever executed remotely, and the gallery hosts only static metadata plus author-hosted screenshots/demos.

**Maintainer verification checklist** (run before flipping `"verified": true`):

- [ ] `validateTemplate` passes (schema, screenshots, license, `fileRoles`).
- [ ] Source reviewed for malicious code (no exfiltration, no obfuscation, no network calls to unexpected hosts).
- [ ] House rules: no `useState`/`useEffect`/`useContext`/`useReducer`; `@layer`-scoped CSS, no Tailwind; logical
      properties; ≥44px coarse touch targets.
- [ ] `cascivo doctor` / `cascivo audit --ai` run clean over the template's source files.
- [ ] Accessibility spot-check: roles, keyboard operability, alt text on screenshots.
- [ ] Components in `registryDependencies` resolve and carry no unaddressed advisories.

**Advisories propagation.** A template doesn't re-declare its components' security advisories — it inherits them. When
you `cascivo add` a template, each component installs through the normal component path, so any `advisories[]` on a
component surface at that point just as they would installing the component directly. Keep `registryDependencies`
pointed at maintained components so this inheritance stays meaningful.

---

## Updating your template

1. Bump `version` in the item
2. Rebuild: `cascivo registry build --in cascivo-registry.json --out public/r`
3. Push — users who run `cascivo update` will see the new version

---

## Further reading

- [Template starter](../apps/examples/template-starter/) — copy-paste starting point
- [Contributing a Third-Party Registry](./CONTRIBUTING-REGISTRY.md) — the component-registry sibling of this guide
- [`cascivo` CLI reference](../packages/cli/README.md)
- [Registry + template schema](../packages/registry/src/types.ts)
- [cascade house rules](../CLAUDE.md)
</content>
