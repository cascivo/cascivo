Persisted signals for cascivo — sync signal state to `localStorage` or `IndexedDB` with SSR-safe initialisation. A drop-in replacement for a plain signal whenever the value should survive a reload.

## Usage

```tsx
import { persistedSignal } from '@cascivo/storage'

// reads the stored value on the client, falls back to the default on the server
const theme = persistedSignal('theme', 'light')

theme.value = 'dark' // written through to storage automatically
```

Use it exactly like a signal — read `.value`, assign `.value`, derive with `useComputed`. Writes are envelope-encoded (with a version stamp) and persisted for you.

## SSR safety

On the server there is no storage, so `persistedSignal` returns the default and adopts the stored value on the client without a hydration mismatch. The returned signal carries a `ready` signal you can read to know when async drivers have hydrated:

```ts
const draft = persistedSignal('editor-draft', '')
draft.ready.value // false until the driver has loaded
```

## Drivers & migrations

Choose where values live, and migrate old shapes safely when they change:

```ts
import { persistedSignal } from '@cascivo/storage'
import { indexedDBDriver } from '@cascivo/storage'

const prefs = persistedSignal(
  'prefs',
  { density: 'comfortable' },
  {
    driver: indexedDBDriver(),
    version: 2,
    migrate: (old) => ({ density: 'comfortable', ...(old as object) }),
  },
)
```

Available drivers: `localStorageDriver` (default), `indexedDBDriver`, and `memoryDriver` (tests/SSR). Drivers that support a `subscribe` hook propagate cross-tab updates automatically.
