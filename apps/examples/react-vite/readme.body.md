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

3. **State with `useSignalState`, written through its setter** (`src/App.tsx`). The hook subscribes
   the component for you, and a setter — unlike `signal.value = …` — compiles under the React
   Compiler and passes `react-hooks/immutability` (`pnpm test:compiler` proves it on this app):

   ```tsx
   import { useSignalState } from '@cascivo/core'

   function App() {
     const [on, setOn] = useSignalState(false)
     return <Toggle label="Notifications" checked={on.value} onValueChange={setOn} />
   }
   ```

   A module-level `signal()` you read in render still needs `useSignals()` as the component's first
   statement; the hooks do it for you.

Note: this app aliases `@cascivo/*` imports to workspace source in `vite.config.ts` so it builds
inside the monorepo without prebuilt `dist/` files. In your own app (installing from npm) you don't
need any aliases.
