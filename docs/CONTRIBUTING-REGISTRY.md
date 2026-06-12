# Contributing a Third-Party Registry

This guide covers the full loop for publishing a cascade component registry and getting it listed in the cascade directory.

## Overview

The cascade registry model lets anyone publish components that users can install with:

```sh
cascade add owner/repo/component-name
# or
cascade add https://your-host.com/r/component-name.json
```

You don't need approval to publish. The `directory/registries.json` listing is optional but recommended for discoverability.

---

## 1. Start from the starter template

```sh
# Clone the starter
git clone https://github.com/urbanisierung/cascade-ui apps/examples/registry-starter my-registry
cd my-registry
rm -rf .git && git init
```

Or create from scratch — you need only two things:

1. A `cascade-registry.json` manifest
2. Component source files referenced by that manifest

---

## 2. Write your component

### File layout

```
my-registry/
├── cascade-registry.json
└── src/
    └── my-component/
        ├── my-component.tsx
        ├── my-component.css
        └── my-component.meta.ts   # optional but recommended
```

### Component rules

Follow the cascade house rules for any component intended to work inside cascade projects:

- **No `useState`, `useContext`, `useEffect`, `useLayoutEffect`, `useReducer`** in components that use signals. For simple presentational components (no interactivity), plain React props are fine.
- **CSS custom properties only** — no Tailwind, no CSS-in-JS. Use `@layer components { … }` to scope styles.
- **Logical properties** — `margin-inline-start`, `padding-block`, etc. for RTL support.
- **WCAG 2.1 AA** — provide `role`, `aria-*` attributes, keyboard operability.

### Minimal component example

```tsx
// src/callout/callout.tsx
import './callout.css'

export type CalloutType = 'info' | 'warning' | 'success' | 'error'

export interface CalloutProps {
  type?: CalloutType
  title?: string
  children: React.ReactNode
}

export function Callout({ type = 'info', title, children }: CalloutProps) {
  return (
    <div className="callout" data-type={type} role="note">
      {title && <p className="callout-title">{title}</p>}
      <div className="callout-body">{children}</div>
    </div>
  )
}
```

```css
/* src/callout/callout.css */
@layer components {
  .callout {
    --callout-color: var(--cascade-color-info, #0ea5e9);
    border-inline-start: 4px solid var(--callout-color);
    background-color: color-mix(in srgb, var(--callout-color) 10%, transparent);
    border-radius: 0 var(--cascade-radius-md, 6px) var(--cascade-radius-md, 6px) 0;
    padding: var(--cascade-space-3, 0.75rem) var(--cascade-space-4, 1rem);
  }
}
```

---

## 3. Write the registry manifest

`cascade-registry.json` is a `RegistryIndex` at schema version 2:

```json
{
  "schemaVersion": 2,
  "name": "my-registry",
  "homepage": "https://github.com/your-org/my-registry",
  "items": [
    {
      "schemaVersion": 2,
      "name": "callout",
      "type": "component",
      "description": "A callout box for highlighting important content",
      "version": "1.0.0",
      "files": [
        {
          "url": "https://raw.githubusercontent.com/your-org/my-registry/main/src/callout/callout.tsx"
        },
        {
          "url": "https://raw.githubusercontent.com/your-org/my-registry/main/src/callout/callout.css"
        }
      ],
      "dependencies": [],
      "tags": ["display", "callout"]
    }
  ]
}
```

**Key fields:**

| Field           | Required | Notes                                                       |
| --------------- | -------- | ----------------------------------------------------------- |
| `schemaVersion` | yes      | Must be `2`                                                 |
| `name`          | yes      | kebab-case, unique within your registry                     |
| `type`          | yes      | `"component"` for components                                |
| `description`   | yes      | One-line summary                                            |
| `version`       | yes      | semver string                                               |
| `files[].url`   | yes      | Public URL to the raw source file                           |
| `dependencies`  | yes      | npm package names required at runtime (empty array if none) |
| `tags`          | no       | For search and discovery                                    |

---

## 4. Build

```sh
cascade registry build --in cascade-registry.json --out public/r
```

This reads your manifest and writes one JSON artifact per item into `public/r/`:

```
public/r/
└── callout.json   # resolved item with inlined file contents
```

Re-run after every change. Commit `public/r/` or publish it from CI.

---

## 5. Host

Any static host works. Pick the simplest option for your workflow:

**GitHub Pages (recommended)**

Enable Pages on your repo pointing at the `main` branch `/` root (or a `gh-pages` branch). Your components are then addressable as:

```sh
cascade add your-org/my-registry/callout
# resolves to https://your-org.github.io/my-registry/r/callout.json
```

**Vercel / Netlify**

Set publish directory to `public`. Use the deployed URL directly:

```sh
cascade add https://my-registry.vercel.app/r/callout.json
```

**Raw GitHub URLs**

Reference `raw.githubusercontent.com` URLs directly in `cascade-registry.json` files entries. No build step needed if you point at source files — but users get the raw source, not a resolved artifact.

---

## 6. Test locally

Before publishing, verify the built artifact installs correctly:

```sh
# Build
cascade registry build --in cascade-registry.json --out public/r

# Install from local path into a test project
cd /tmp && npx cascade init test-project && cd test-project
cascade add /path/to/my-registry/public/r/callout.json
```

Check that the files land in `src/components/callout/` and that the component imports resolve.

---

## 7. Submit to the cascade directory

The `directory/registries.json` file is an index of known third-party registries. Being listed here makes your registry discoverable via `cascade search` and the cascade MCP server.

### Add your entry

Open a PR against [urbanisierung/cascade-ui](https://github.com/urbanisierung/cascade-ui) adding your registry to `directory/registries.json`:

```json
{
  "registries": [
    {
      "name": "my-registry",
      "description": "Callout, StepList, and other content display components",
      "homepage": "https://github.com/your-org/my-registry",
      "url": "https://your-org.github.io/my-registry/r",
      "author": "your-org",
      "verified": false
    }
  ]
}
```

### What CI checks

The CI pipeline for directory PRs verifies:

1. **Schema** — the entry matches the `RegistryDirectoryEntry` type (name, url, author required)
2. **Reachability** — `url` responds with a valid registry index (HTTP 200, `schemaVersion: 2`)
3. **At least one item** — the registry must expose at least one component
4. **No duplicates** — `name` must be unique in the directory

### What `verified` means

`"verified": true` is set by the cascade maintainers after manual review:

- Component source reviewed for malicious code
- Styles follow cascade CSS conventions (no Tailwind, `@layer` scoping)
- Accessibility spot-checked (roles, keyboard nav)
- Maintainer has agreed to respond to security reports

Verification is optional. Unverified registries are listed but shown with a warning in the docs.

---

## Updating your registry

1. Bump `version` in the item inside `cascade-registry.json`
2. Rebuild: `cascade registry build --in cascade-registry.json --out public/r`
3. Push — users who run `cascade update callout` will get the new version

---

## Further reading

- [Registry starter example](../apps/examples/registry-starter/) — copy-paste starting point
- [`cascade registry` CLI reference](../packages/cli/README.md)
- [Component manifest schema](../packages/core/src/types.ts)
- [cascade house rules](../CLAUDE.md) — authoring rules for components
