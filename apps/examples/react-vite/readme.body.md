The canonical minimal Vite + React + TypeScript starter for cascivo. One page, ~100 lines: a `Card`
with a `Button`, a `Toggle` wired to a signal, and a theme switcher between `light`, `dark`, and
`warm`. It consumes the prebuilt packages (`@cascivo/react`, `@cascivo/themes`, `@cascivo/tokens`,
`@cascivo/core`) — no copy-paste required.

## Run

```sh
# From the monorepo root
pnpm install

# From this directory
pnpm exec vp dev

# Or from the monorepo root
pnpm exec vp run @cascivo/example-react-vite#dev
```

`pnpm exec vp build` builds, `pnpm exec vp test` runs the smoke test.

## The three things to copy into your own app

1. **Theme CSS, imported once in your entry** (`src/main.tsx`):

   ```ts
   import '@cascivo/themes/all' // tokens + base + light + dark
   import '@cascivo/themes/warm' // extra themes are opt-in
   ```

2. **`data-theme` on the root element** (`src/App.tsx`) — activates a theme for that subtree, so it
   can be scoped to any container:

   ```tsx
   <main data-theme="dark">…</main>
   ```

3. **`useSignals()` as the first statement of any React component that reads `signal.value`**
   (`src/App.tsx`). React apps have no signals compiler transform — without it the component never
   re-renders on signal writes:

   ```tsx
   import { useSignal, useSignals } from '@cascivo/core'

   function App() {
     useSignals()
     const on = useSignal(false)
     …
   }
   ```

Note: this app aliases `@cascivo/*` imports to workspace source in `vite.config.ts` so it builds
inside the monorepo without prebuilt `dist/` files. In your own app (installing from npm) you don't
need any aliases.
