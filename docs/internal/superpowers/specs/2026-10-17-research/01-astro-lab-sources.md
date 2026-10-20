# Appendix to report 01: Astro lab sources worth keeping

The Astro lab ran in a temporary session directory that no longer exists. The two sources below
are kept verbatim because the plan refers to them: the `@cascivo/astro` integration prototype
(plan Task 6) and the minimal Preact-under-Astro repro (plan follow-ups, upstream issue). Tarball
paths are replaced with `<tarball>`; install cascivo from `pnpm pack` output, as
`scripts/checks/framework-install.test.ts` does.

## `@cascivo/astro` prototype (`lab-int/cascivo-astro.mjs`)

Passed build and dev for every directive, MDX dev layer order, no-flash theme and theme
persistence across `<ClientRouter/>`; its inline script was auto-hashed under `security.csp`. The
plan supersedes its hard-coded layer list with `DEFAULT_LAYERS` derived from `@cascivo/tokens`.

```js
// Prototype of a first-party @cascivo/astro integration (research only).
import { themePreloadScript } from '@cascivo/react'
const LAYERS = '@layer vendor, cascivo.reset, cascivo.base, cascivo.tokens, cascivo.component, cascivo.platform, cascivo.theme, cascivo.blocks, cascivo.example, cascivo.override;'
export default function cascivo({ theme = '@cascivo/themes/light-dark.css', storageKey } = {}) {
  return {
    name: '@cascivo/astro',
    hooks: {
      'astro:config:setup'({ updateConfig, injectScript, addWatchFile }) {
        updateConfig({ vite: { resolve: { noExternal: [/^@cascivo\//] } } })
        // Layer order: a virtual CSS module imported before anything else on every page.
        updateConfig({ vite: { plugins: [{
          name: 'cascivo:layers',
          resolveId(id) { if (id === 'virtual:cascivo/layers.css') return '\0virtual:cascivo/layers.css' },
          load(id) { if (id === '\0virtual:cascivo/layers.css') return LAYERS },
        }] } })
        injectScript('page-ssr', `import 'virtual:cascivo/layers.css'; import ${JSON.stringify(theme)};`)
        const pre = themePreloadScript(storageKey ? { storageKey } : {})
        // head-inline runs before first paint AND we re-apply after every ClientRouter swap,
        // because Astro copies the incoming document's <html> attributes (data-theme) on soft nav.
        injectScript('head-inline', `${pre}document.addEventListener('astro:after-swap',function(){${pre}});`)
      },
    },
  }
}
```

## Preact under Astro repro (`lab-preact/`)

Astro 7.4.0, `@astrojs/preact` 6.1.0. `V=0..4` selects how much is inlined. `client:only="preact"`
builds and runs; server-rendered islands fail with `useRef` on a null dispatcher (V=0..2) and a
dual Preact instance (`__H`) once preact itself is inlined (V=3..4).

### `astro.config.mjs`

```js
import { defineConfig } from 'astro/config'
import preact from '@astrojs/preact'
const v = process.env.V ?? '1'
const noExt = ({ '0': [], '1': [/^@cascivo\//], '2': [/^@cascivo\//, /^@preact\/signals/], '3': true, '4': [/^@cascivo\//, /^@preact\/signals/, /^preact(\/|$)/, /^react(-dom)?(\/|$)/] })[v]
console.log('[preact-lab] variant', v, noExt)
export default defineConfig({
  integrations: [preact({ compat: true })],
  vite: { resolve: { noExternal: noExt } },
})
```

### `package.json`

```json
{
  "name": "lab-preact",
  "private": true,
  "type": "module",
  "dependencies": {
    "@astrojs/preact": "6.1.0",
    "@cascivo/react": "<tarball>",
    "@cascivo/themes": "<tarball>",
    "@preact/signals-react": "^3.12.0",
    "astro": "7.4.0",
    "preact": "^10.27.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  }
}
```

### `src/components/Panel.tsx`

```tsx
import { Badge, Button, Card, CardContent, useSignal, useSignals } from '@cascivo/react'
export function Panel({ label }: { label: string }) {
  useSignals()
  const count = useSignal(0)
  return (
    <Card>
      <CardContent>
        <Badge variant="success">{label}</Badge>
        <Button data-testid="inc" onClick={() => { count.value++ }}>Count {count.value}</Button>
      </CardContent>
    </Card>
  )
}
```

### `src/pages/load.astro` (`only.astro` is identical with `client:only="preact"`)

```astro
---
import '../styles/layers.css'
import '@cascivo/themes/light-dark.css'
import { Panel } from '../components/Panel'
---
<html lang="en" data-theme="light"><head><meta charset="utf-8" /><title>load</title></head><body><Panel label="load" client:load /></body></html>
```
