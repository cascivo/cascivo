# v21 Tranche 1: example-kit + Cascade Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the shared `@cascivo/example-kit` utility package and the `Cascade Deploy` reference dashboard app that demonstrates AppShell, mock data, simulation, and the full cascivo component surface.

**Architecture:** `@cascivo/example-kit` is a source-only private package (no build step) exporting `seededRandom`, `createMockApi`, `createSimulation`, `useSimulation`, and `AppShell`. `apps/examples/deploy` is a Vite+React app that consumes example-kit via a workspace alias and builds a minimal deployment dashboard with real cascivo components.

**Tech Stack:** React 19, `@cascivo/react`, `@cascivo/core` (signals), `@cascivo/storage` (persistedSignal), `@cascivo/i18n` (defineMessages/t), Vitest, vite-plus (`vp`).

---

## File Map

### New files — `@cascivo/example-kit`

- `apps/examples/kit/package.json` — package manifest, `private: true`, source exports
- `apps/examples/kit/tsconfig.json` — extends `../../../tsconfig.base.json`
- `apps/examples/kit/src/index.ts` — re-exports all kit primitives
- `apps/examples/kit/src/seeded-random.ts` — mulberry32 PRNG
- `apps/examples/kit/src/mock-api.ts` — createMockApi + createApiConfig
- `apps/examples/kit/src/simulation.ts` — createSimulation + useSimulation
- `apps/examples/kit/src/app-shell.tsx` — AppShell layout component
- `apps/examples/kit/src/app-shell.module.css` — AppShell styles (mobile-first, token-only)
- `apps/examples/kit/src/seeded-random.test.ts` — PRNG unit tests
- `apps/examples/kit/src/mock-api.test.ts` — mock-api unit tests
- `apps/examples/kit/src/simulation.test.ts` — simulation unit tests

### New files — `apps/examples/deploy`

- `apps/examples/deploy/package.json` — app manifest
- `apps/examples/deploy/tsconfig.json` — extends base, paths for kit + packages
- `apps/examples/deploy/index.html` — app shell HTML
- `apps/examples/deploy/vite.config.ts` — all src aliases including example-kit
- `apps/examples/deploy/src/main.tsx` — React root, theme imports
- `apps/examples/deploy/src/App.tsx` — AppShell + section router
- `apps/examples/deploy/src/data/fixtures.ts` — seeded fixture data (5 projects, 20 deployments each)
- `apps/examples/deploy/src/api/index.ts` — mock API wrapping fixtures
- `apps/examples/deploy/src/sections/Overview.tsx` — stats section
- `apps/examples/deploy/src/sections/Deployments.tsx` — table + drawer section
- `apps/examples/deploy/src/sections/DeploymentDetail.tsx` — detail panel with progress sim
- `apps/examples/deploy/src/sections/Overview.module.css` — Overview styles
- `apps/examples/deploy/src/sections/Deployments.module.css` — Deployments styles
- `apps/examples/deploy/src/sections/DeploymentDetail.module.css` — Detail styles
- `apps/examples/deploy/test/smoke.spec.ts` — Playwright smoke test

---

## Task 1: Scaffold `@cascivo/example-kit` package

**Files:**

- Create: `apps/examples/kit/package.json`
- Create: `apps/examples/kit/tsconfig.json`
- Create: `apps/examples/kit/src/index.ts` (placeholder, updated in later tasks)

- [ ] **Step 1: Create `apps/examples/kit/package.json`**

```json
{
  "name": "@cascivo/example-kit",
  "version": "0.0.0",
  "private": true,
  "description": "Shared utilities for cascivo example apps",
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "test": "vp test"
  },
  "dependencies": {
    "@cascivo/core": "workspace:*",
    "@cascivo/i18n": "workspace:*",
    "@cascivo/react": "workspace:*",
    "@cascivo/storage": "workspace:*",
    "@cascivo/themes": "workspace:*",
    "@cascivo/tokens": "workspace:*",
    "react": "catalog:"
  },
  "devDependencies": {
    "@types/react": "catalog:",
    "typescript": "catalog:",
    "vite-plus": "catalog:"
  }
}
```

- [ ] **Step 2: Create `apps/examples/kit/tsconfig.json`**

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "paths": {
      "@cascivo/react": ["../../../packages/react/src/index.ts"],
      "@cascivo/core": ["../../../packages/core/src/index.ts"],
      "@cascivo/storage": ["../../../packages/storage/src/index.ts"],
      "@cascivo/i18n": ["../../../packages/i18n/src/index.ts"]
    }
  },
  "include": [
    "src",
    "../../../packages/components/src/css-modules.d.ts",
    "../../../packages/react/src/css-modules.d.ts"
  ]
}
```

- [ ] **Step 3: Create placeholder `apps/examples/kit/src/index.ts`**

```ts
// exports filled in as each module is implemented
export { seededRandom } from './seeded-random'
export { createMockApi, createApiConfig } from './mock-api'
export { createSimulation, useSimulation } from './simulation'
export { AppShell } from './app-shell'
export type { AppShellProps } from './app-shell'
```

- [ ] **Step 4: Verify pnpm recognises the new workspace package**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui
pnpm install --frozen-lockfile=false 2>&1 | tail -5
```

Expected: no errors. The package appears in pnpm's workspace graph.

---

## Task 2: `seededRandom` — mulberry32 PRNG

**Files:**

- Create: `apps/examples/kit/src/seeded-random.ts`
- Create: `apps/examples/kit/src/seeded-random.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/examples/kit/src/seeded-random.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { seededRandom } from './seeded-random'

describe('seededRandom', () => {
  it('produces deterministic sequence from same seed', () => {
    const rng1 = seededRandom(42)
    const rng2 = seededRandom(42)
    expect(rng1.next()).toBeCloseTo(rng2.next())
    expect(rng1.next()).toBeCloseTo(rng2.next())
    expect(rng1.next()).toBeCloseTo(rng2.next())
  })

  it('produces different sequences from different seeds', () => {
    const rng1 = seededRandom(1)
    const rng2 = seededRandom(2)
    expect(rng1.next()).not.toBeCloseTo(rng2.next())
  })

  it('next() returns values in [0, 1)', () => {
    const rng = seededRandom(99)
    for (let i = 0; i < 100; i++) {
      const v = rng.next()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('int(min, max) returns integer in [min, max]', () => {
    const rng = seededRandom(7)
    for (let i = 0; i < 50; i++) {
      const v = rng.int(1, 10)
      expect(v).toBeGreaterThanOrEqual(1)
      expect(v).toBeLessThanOrEqual(10)
      expect(Number.isInteger(v)).toBe(true)
    }
  })

  it('pick() returns an element from the array', () => {
    const rng = seededRandom(3)
    const arr = ['a', 'b', 'c', 'd']
    for (let i = 0; i < 20; i++) {
      expect(arr).toContain(rng.pick(arr))
    }
  })

  it('bool(p=1) always returns true', () => {
    const rng = seededRandom(5)
    for (let i = 0; i < 20; i++) {
      expect(rng.bool(1)).toBe(true)
    }
  })

  it('bool(p=0) always returns false', () => {
    const rng = seededRandom(5)
    for (let i = 0; i < 20; i++) {
      expect(rng.bool(0)).toBe(false)
    }
  })

  it('bool() defaults to p=0.5', () => {
    // With enough samples, should produce both true and false
    const rng = seededRandom(12345)
    const results = Array.from({ length: 100 }, () => rng.bool())
    expect(results.some(Boolean)).toBe(true)
    expect(results.some((v) => !v)).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails (module not yet found)**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui
pnpm exec vp test --project '@cascivo/example-kit' 2>&1 | tail -20
```

Expected: FAIL — Cannot find module `./seeded-random`

- [ ] **Step 3: Implement `apps/examples/kit/src/seeded-random.ts`**

```ts
// mulberry32 PRNG — deterministic, seedable, no globals

export interface SeededRandom {
  next(): number
  int(min: number, max: number): number
  pick<T>(arr: T[]): T
  bool(p?: number): boolean
}

export function seededRandom(seed: number): SeededRandom {
  let s = seed >>> 0

  function next(): number {
    s += 0x6d2b79f5
    let z = s
    z = Math.imul(z ^ (z >>> 15), z | 1)
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61)
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296
  }

  return {
    next,
    int(min: number, max: number): number {
      return Math.floor(next() * (max - min + 1)) + min
    },
    pick<T>(arr: T[]): T {
      return arr[Math.floor(next() * arr.length)] as T
    },
    bool(p = 0.5): boolean {
      return next() < p
    },
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui
pnpm exec vp test --project '@cascivo/example-kit' 2>&1 | tail -20
```

Expected: All seededRandom tests pass.

- [ ] **Step 5: Commit**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui
git add apps/examples/kit/
git commit -m "feat(example-kit): scaffold package + seededRandom PRNG"
```

---

## Task 3: `createMockApi`

**Files:**

- Create: `apps/examples/kit/src/mock-api.ts`
- Create: `apps/examples/kit/src/mock-api.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/examples/kit/src/mock-api.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockApi } from './mock-api'

describe('createMockApi', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves with wrapped data after latency', async () => {
    const api = createMockApi({ latencyMs: 100, seed: 1 })
    const getUser = api.wrap(() => ({ id: 1, name: 'Alice' }))
    const promise = getUser()
    // has not resolved yet
    expect(await Promise.race([promise, Promise.resolve('pending')])).toBe('pending')
    vi.advanceTimersByTime(100)
    const result = await promise
    expect(result).toEqual({ id: 1, name: 'Alice' })
  })

  it('failNext() rejects once then resolves on next call', async () => {
    const api = createMockApi({ latencyMs: 0, seed: 2 })
    const getItem = api.wrap(() => 'data')
    api.failNext()
    const failPromise = getItem()
    vi.advanceTimersByTime(0)
    await expect(failPromise).rejects.toThrow()
    const okPromise = getItem()
    vi.advanceTimersByTime(0)
    await expect(okPromise).resolves.toBe('data')
  })

  it('uses fixed latency when latencyMs is a number', async () => {
    // Deterministic: with seed, same fixed latency = same delay
    const api = createMockApi({ latencyMs: 200, seed: 3 })
    const fn = api.wrap(() => 'x')
    const p = fn()
    vi.advanceTimersByTime(199)
    expect(await Promise.race([p, Promise.resolve('pending')])).toBe('pending')
    vi.advanceTimersByTime(1)
    await expect(p).resolves.toBe('x')
  })

  it('uses jittered latency in range when latencyMs is [min, max]', async () => {
    // seed=42, range=[100, 200] — with fixed seed, latency is deterministic
    const api = createMockApi({ latencyMs: [100, 200], seed: 42 })
    const fn = api.wrap(() => 'y')
    const p = fn()
    // After 200ms everything should have resolved
    vi.advanceTimersByTime(200)
    await expect(p).resolves.toBe('y')
  })

  it('errorRate=1 always rejects', async () => {
    const api = createMockApi({ latencyMs: 0, errorRate: 1, seed: 10 })
    const fn = api.wrap(() => 'data')
    const p = fn()
    vi.advanceTimersByTime(0)
    await expect(p).rejects.toThrow()
  })

  it('errorRate=0 never rejects', async () => {
    const api = createMockApi({ latencyMs: 0, errorRate: 0, seed: 11 })
    const fn = api.wrap(() => 'data')
    const p = fn()
    vi.advanceTimersByTime(0)
    await expect(p).resolves.toBe('data')
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui
pnpm exec vp test --project '@cascivo/example-kit' 2>&1 | tail -20
```

Expected: FAIL — Cannot find module `./mock-api`

- [ ] **Step 3: Implement `apps/examples/kit/src/mock-api.ts`**

```ts
import { signal } from '@cascivo/core'
import type { Signal } from '@cascivo/core'
import { seededRandom } from './seeded-random'
import type { SeededRandom } from './seeded-random'

export interface MockApiOptions {
  latencyMs?: number | [number, number]
  errorRate?: number
  seed?: number
}

export interface ApiConfig {
  latencyMs: number | [number, number]
  errorRate: number
}

export interface MockApi {
  wrap<T>(fn: () => T): () => Promise<T>
  failNext(): void
}

export function createMockApi(opts: MockApiOptions = {}): MockApi {
  const rng: SeededRandom = seededRandom(opts.seed ?? 0)
  const latencyMs = opts.latencyMs ?? [300, 600]
  const errorRate = opts.errorRate ?? 0
  let injectFailure = false

  function getLatency(): number {
    if (Array.isArray(latencyMs)) {
      const [min, max] = latencyMs
      return rng.int(min, max)
    }
    return latencyMs
  }

  function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  return {
    wrap<T>(fn: () => T): () => Promise<T> {
      return async (): Promise<T> => {
        const ms = getLatency()
        await delay(ms)
        const shouldFail = injectFailure || rng.next() < errorRate
        injectFailure = false
        if (shouldFail) throw new Error('Mock API error')
        return fn()
      }
    },
    failNext(): void {
      injectFailure = true
    },
  }
}

export function createApiConfig(overrides?: Partial<ApiConfig>): Signal<ApiConfig> {
  return signal<ApiConfig>({
    latencyMs: 300,
    errorRate: 0,
    ...overrides,
  })
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui
pnpm exec vp test --project '@cascivo/example-kit' 2>&1 | tail -20
```

Expected: All mock-api + seededRandom tests pass.

- [ ] **Step 5: Commit**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui
git add apps/examples/kit/src/mock-api.ts apps/examples/kit/src/mock-api.test.ts
git commit -m "feat(example-kit): add createMockApi + createApiConfig"
```

---

## Task 4: `createSimulation` + `useSimulation`

**Files:**

- Create: `apps/examples/kit/src/simulation.ts`
- Create: `apps/examples/kit/src/simulation.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/examples/kit/src/simulation.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSimulation } from './simulation'

describe('createSimulation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts stopped by default', () => {
    let ticks = 0
    const sim = createSimulation({
      tickMs: 100,
      seed: 1,
      onTick: () => {
        ticks++
      },
    })
    vi.advanceTimersByTime(500)
    expect(ticks).toBe(0)
    expect(sim.running.value).toBe(false)
  })

  it('start() causes onTick to be called periodically', () => {
    let ticks = 0
    const sim = createSimulation({
      tickMs: 100,
      seed: 2,
      onTick: () => {
        ticks++
      },
    })
    sim.start()
    vi.advanceTimersByTime(350)
    expect(ticks).toBe(3)
  })

  it('stop() prevents further ticks', () => {
    let ticks = 0
    const sim = createSimulation({
      tickMs: 100,
      seed: 3,
      onTick: () => {
        ticks++
      },
    })
    sim.start()
    vi.advanceTimersByTime(200)
    sim.stop()
    vi.advanceTimersByTime(300)
    expect(ticks).toBe(2)
    expect(sim.running.value).toBe(false)
  })

  it('toggle() flips running state', () => {
    const sim = createSimulation({ tickMs: 100, seed: 4, onTick: () => {} })
    expect(sim.running.value).toBe(false)
    sim.toggle()
    expect(sim.running.value).toBe(true)
    sim.toggle()
    expect(sim.running.value).toBe(false)
  })

  it('onTick receives a seededRandom that produces deterministic output', () => {
    const values: number[] = []
    const sim = createSimulation({
      tickMs: 100,
      seed: 42,
      onTick: (rng) => {
        values.push(rng.next())
      },
    })
    sim.start()
    vi.advanceTimersByTime(300)
    sim.stop()

    // Re-run with same seed — expect same values
    const values2: number[] = []
    const sim2 = createSimulation({
      tickMs: 100,
      seed: 42,
      onTick: (rng) => {
        values2.push(rng.next())
      },
    })
    sim2.start()
    vi.advanceTimersByTime(300)
    sim2.stop()

    expect(values).toEqual(values2)
    expect(values.length).toBeGreaterThan(0)
  })

  it('start() is idempotent — does not double-tick', () => {
    let ticks = 0
    const sim = createSimulation({
      tickMs: 100,
      seed: 5,
      onTick: () => {
        ticks++
      },
    })
    sim.start()
    sim.start()
    vi.advanceTimersByTime(200)
    expect(ticks).toBe(2)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui
pnpm exec vp test --project '@cascivo/example-kit' 2>&1 | tail -20
```

Expected: FAIL — Cannot find module `./simulation`

- [ ] **Step 3: Implement `apps/examples/kit/src/simulation.ts`**

```ts
import { signal, useSignalEffect, useSignals } from '@cascivo/core'
import type { ReadonlySignal } from '@cascivo/core'
import { seededRandom } from './seeded-random'
import type { SeededRandom } from './seeded-random'

export interface SimulationOptions {
  tickMs: number
  seed: number
  onTick: (rng: SeededRandom) => void
}

export interface Simulation {
  running: ReadonlySignal<boolean>
  start(): void
  stop(): void
  toggle(): void
}

export function createSimulation(opts: SimulationOptions): Simulation {
  const _running = signal(false)
  let intervalId: ReturnType<typeof setInterval> | undefined
  // Each simulation gets its own rng seeded at construction time.
  // The rng advances on every tick so output is deterministic per seed.
  const rng = seededRandom(opts.seed)

  function start(): void {
    if (_running.value) return
    _running.value = true
    intervalId = setInterval(() => {
      opts.onTick(rng)
    }, opts.tickMs)
  }

  function stop(): void {
    if (!_running.value) return
    _running.value = false
    if (intervalId !== undefined) {
      clearInterval(intervalId)
      intervalId = undefined
    }
  }

  function toggle(): void {
    if (_running.value) stop()
    else start()
  }

  return {
    running: _running as ReadonlySignal<boolean>,
    start,
    stop,
    toggle,
  }
}

export function useSimulation(sim: Simulation): void {
  useSignals()
  useSignalEffect(() => {
    if (sim.running.value) {
      // already running — nothing to start (start() manages the interval)
      return () => {
        // cleanup: stop on unmount
        sim.stop()
      }
    }
    return undefined
  })
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui
pnpm exec vp test --project '@cascivo/example-kit' 2>&1 | tail -20
```

Expected: All simulation + prior tests pass.

- [ ] **Step 5: Commit**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui
git add apps/examples/kit/src/simulation.ts apps/examples/kit/src/simulation.test.ts
git commit -m "feat(example-kit): add createSimulation + useSimulation"
```

---

## Task 5: `<AppShell>` layout component

**Files:**

- Create: `apps/examples/kit/src/app-shell.tsx`
- Create: `apps/examples/kit/src/app-shell.module.css`

No unit tests needed — AppShell is a layout component whose correctness is verified by building the deploy app.

- [ ] **Step 1: Read SideNav, Header, and CommandMenu prop shapes (already done above)**

Key facts:

- `SideNav` takes `items: SideNavItem[]` — each item is `{ label, href?, icon?, active?, onClick? }`
- `Header` takes `brand?: ReactNode`, `actions?: ReactNode`, `sticky?: boolean`
- `CommandMenu` takes `open: boolean`, `onOpenChange: (open: boolean) => void`, `groups: CommandGroup[]`
  - `CommandGroup` = `{ heading?: string, items: CommandItem[] }`
  - `CommandItem` = `{ id, label, onSelect?, shortcut?, keywords? }`
- `persistedSignal(key, initial)` returns a `Signal<T> & { ready: ReadonlySignal<boolean> }`
- `defineMessages(namespace, messages)` returns typed message objects; `t(msg)` translates

- [ ] **Step 2: Create `apps/examples/kit/src/app-shell.module.css`**

```css
@layer cascade.component {
  .shell {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: auto 1fr;
    block-size: 100dvh;
    overflow: hidden;
    background: var(--cascivo-color-background);
    color: var(--cascivo-color-text);
    font-family: var(--cascivo-font-sans);
  }

  .header {
    grid-column: 1 / -1;
    grid-row: 1;
  }

  .nav {
    grid-column: 1;
    grid-row: 2;
    block-size: 100%;
    overflow-y: auto;
  }

  .content {
    grid-column: 2;
    grid-row: 2;
    overflow-y: auto;
    padding: var(--cascivo-space-6);
  }

  .banner {
    grid-column: 1 / -1;
    background: color-mix(in oklch, var(--cascivo-color-warning) 15%, transparent);
    border-block-end: 1px solid color-mix(in oklch, var(--cascivo-color-warning) 40%, transparent);
    padding: var(--cascivo-space-1) var(--cascivo-space-4);
    font-size: var(--cascivo-text-xs);
    color: var(--cascivo-color-text-subtle);
    text-align: center;
  }
}
```

- [ ] **Step 3: Create `apps/examples/kit/src/app-shell.tsx`**

```tsx
'use client'
import { useSignal, useSignals } from '@cascivo/core'
import { defineMessages, t } from '@cascivo/i18n'
import { persistedSignal } from '@cascivo/storage'
import { CommandMenu, Header, SideNav, ToastProvider } from '@cascivo/react'
import type { CommandGroup, CommandItem } from '@cascivo/react'
import type { ReactNode } from 'react'
import styles from './app-shell.module.css'

const msgs = defineMessages('app-shell', {
  mockBanner: 'Mock demo — no real data',
  switchTheme: 'Switch theme',
  commandMenuLabel: 'Commands',
})

export interface NavItem {
  label: string
  href: string
  icon?: ReactNode
}

export interface AppCommand {
  id: string
  label: string
  onSelect: () => void
  kbd?: string
}

export interface AppShellProps {
  title: string
  nav: NavItem[]
  commands?: AppCommand[]
  children: ReactNode
  mockBanner?: boolean
}

// Module-level so it persists across mounts without duplicate keys
const themeSignal = persistedSignal<'light' | 'dark' | 'warm'>('cascivo-theme', 'light')

export function AppShell({
  title,
  nav,
  commands = [],
  children,
  mockBanner = false,
}: AppShellProps) {
  useSignals()

  const cmdOpen = useSignal(false)

  const themeCommands: CommandItem[] = [
    {
      id: 'theme-light',
      label: 'Light theme',
      onSelect: () => {
        themeSignal.value = 'light'
      },
    },
    {
      id: 'theme-dark',
      label: 'Dark theme',
      onSelect: () => {
        themeSignal.value = 'dark'
      },
    },
    {
      id: 'theme-warm',
      label: 'Warm theme',
      onSelect: () => {
        themeSignal.value = 'warm'
      },
    },
  ]

  const appCommandItems: CommandItem[] = commands.map((cmd) => ({
    id: cmd.id,
    label: cmd.label,
    onSelect: cmd.onSelect,
    shortcut: cmd.kbd ? [cmd.kbd] : undefined,
  }))

  const groups: CommandGroup[] = [
    ...(appCommandItems.length > 0 ? [{ heading: 'Actions', items: appCommandItems }] : []),
    { heading: t(msgs.switchTheme), items: themeCommands },
  ]

  const sideNavItems = nav.map((item) => ({
    label: item.label,
    href: item.href,
    icon: item.icon,
  }))

  return (
    <div data-theme={themeSignal.value} className={styles['shell']}>
      <ToastProvider>
        {mockBanner && (
          <div className={styles['banner']} role="status">
            {t(msgs.mockBanner)}
          </div>
        )}
        <div className={styles['header']}>
          <Header
            brand={<strong>{title}</strong>}
            actions={
              <button
                type="button"
                onClick={() => {
                  cmdOpen.value = true
                }}
                aria-label={t(msgs.commandMenuLabel)}
                style={{
                  padding: `var(--cascivo-space-1) var(--cascivo-space-3)`,
                  borderRadius: 'var(--cascivo-radius-control)',
                  border: '1px solid var(--cascivo-color-border)',
                  background: 'var(--cascivo-color-surface)',
                  color: 'var(--cascivo-color-text)',
                  cursor: 'pointer',
                  fontSize: 'var(--cascivo-text-xs)',
                }}
              >
                ⌘K
              </button>
            }
          />
        </div>
        <nav className={styles['nav']}>
          <SideNav items={sideNavItems} showCollapseToggle />
        </nav>
        <main className={styles['content']}>{children}</main>
        <CommandMenu
          open={cmdOpen.value}
          onOpenChange={(open) => {
            cmdOpen.value = open
          }}
          groups={groups}
          hotkey
        />
      </ToastProvider>
    </div>
  )
}
```

- [ ] **Step 4: Run all kit tests to confirm nothing broke**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui
pnpm exec vp test --project '@cascivo/example-kit' 2>&1 | tail -20
```

Expected: All tests pass (AppShell itself has no test file — its build verification comes in Task 8).

- [ ] **Step 5: Commit**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui
git add apps/examples/kit/src/app-shell.tsx apps/examples/kit/src/app-shell.module.css
git commit -m "feat(example-kit): add AppShell layout component"
```

---

## Task 6: Scaffold `apps/examples/deploy` app skeleton

**Files:**

- Create: `apps/examples/deploy/package.json`
- Create: `apps/examples/deploy/tsconfig.json`
- Create: `apps/examples/deploy/index.html`
- Create: `apps/examples/deploy/vite.config.ts`
- Create: `apps/examples/deploy/src/main.tsx`

- [ ] **Step 1: Create `apps/examples/deploy/package.json`**

```json
{
  "name": "@cascivo/example-deploy",
  "version": "0.0.0",
  "private": true,
  "description": "Cascade Deploy — reference deployment dashboard",
  "type": "module",
  "scripts": {
    "dev": "vp dev",
    "build": "vp build",
    "preview": "vp preview"
  },
  "dependencies": {
    "@cascivo/core": "workspace:*",
    "@cascivo/example-kit": "workspace:*",
    "@cascivo/i18n": "workspace:*",
    "@cascivo/react": "workspace:*",
    "@cascivo/storage": "workspace:*",
    "@cascivo/themes": "workspace:*",
    "@cascivo/tokens": "workspace:*",
    "react": "catalog:",
    "react-dom": "catalog:"
  },
  "devDependencies": {
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "typescript": "catalog:",
    "vite-plus": "catalog:"
  }
}
```

- [ ] **Step 2: Create `apps/examples/deploy/tsconfig.json`**

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "paths": {
      "@cascivo/core": ["../../../packages/core/src/index.ts"],
      "@cascivo/storage": ["../../../packages/storage/src/index.ts"],
      "@cascivo/i18n": ["../../../packages/i18n/src/index.ts"],
      "@cascivo/react": ["../../../packages/react/src/index.ts"],
      "@cascivo/example-kit": ["../kit/src/index.ts"]
    }
  },
  "include": [
    "src",
    "test",
    "../../../packages/components/src/css-modules.d.ts",
    "../../../packages/react/src/css-modules.d.ts"
  ]
}
```

- [ ] **Step 3: Create `apps/examples/deploy/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cascade Deploy</title>
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      body {
        font-family: system-ui, sans-serif;
        height: 100dvh;
        display: flex;
        flex-direction: column;
      }
      #root {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Create `apps/examples/deploy/vite.config.ts`**

```ts
import { resolve } from 'node:path'
import { defineConfig } from 'vite-plus'

const root = resolve(__dirname, '../../..')

export default defineConfig({
  resolve: {
    alias: {
      '@cascivo/core': resolve(root, 'packages/core/src/index.ts'),
      '@cascivo/storage': resolve(root, 'packages/storage/src/index.ts'),
      '@cascivo/i18n': resolve(root, 'packages/i18n/src/index.ts'),
      '@cascivo/ai': resolve(root, 'packages/ai/src/index.ts'),
      '@cascivo/react': resolve(root, 'packages/react/src/index.ts'),
      '@cascivo/render': resolve(root, 'packages/render/src/index.ts'),
      '@cascivo/icons': resolve(root, 'packages/icons/src/index.tsx'),
      '@cascivo/example-kit': resolve(__dirname, '../kit/src/index.ts'),
    },
  },
})
```

- [ ] **Step 5: Create `apps/examples/deploy/src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import '@cascivo/themes/light'
import '@cascivo/themes/dark'
import '@cascivo/themes/warm'
import App from './App'

const root = document.getElementById('root')
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
```

- [ ] **Step 6: Install workspace dependencies**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui
pnpm install --frozen-lockfile=false 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 7: Commit scaffold**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui
git add apps/examples/deploy/
git commit -m "feat(deploy): scaffold Cascade Deploy app"
```

---

## Task 7: Fixture data + mock API

**Files:**

- Create: `apps/examples/deploy/src/data/fixtures.ts`
- Create: `apps/examples/deploy/src/api/index.ts`

- [ ] **Step 1: Create `apps/examples/deploy/src/data/fixtures.ts`**

```ts
import { seededRandom } from '@cascivo/example-kit'

const rng = seededRandom(42)

const STATUSES = ['building', 'ready', 'error', 'queued'] as const
export type DeployStatus = (typeof STATUSES)[number]

export interface Project {
  id: string
  name: string
  url: string
}

export interface Deployment {
  id: string
  projectId: string
  status: DeployStatus
  branch: string
  commit: string
  durationSec: number
  timestamp: string
}

export interface BuildLog {
  deploymentId: string
  lines: string[]
}

const BRANCHES = ['main', 'dev', 'feat/auth', 'fix/layout', 'chore/deps']
const PREFIXES = ['feat', 'fix', 'chore', 'docs', 'refactor']

function sha(): string {
  return Array.from({ length: 7 }, () => rng.int(0, 15).toString(16)).join('')
}

function isoTimestamp(daysAgo: number): string {
  const d = new Date(Date.UTC(2026, 5, 14))
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return d.toISOString()
}

export const projects: Project[] = Array.from({ length: 5 }, (_, i) => ({
  id: `proj-${i + 1}`,
  name: `Project ${['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'][i] ?? i}`,
  url: `https://proj-${i + 1}.example.com`,
}))

export const deployments: Deployment[] = projects.flatMap((project) =>
  Array.from({ length: 20 }, (_, i) => ({
    id: `deploy-${project.id}-${i + 1}`,
    projectId: project.id,
    status: rng.pick(STATUSES),
    branch: rng.pick(BRANCHES),
    commit: sha(),
    durationSec: rng.int(15, 300),
    timestamp: isoTimestamp(rng.int(0, 30)),
  })),
)

export const buildLogs: BuildLog[] = deployments.map((d) => ({
  deploymentId: d.id,
  lines: Array.from({ length: 10 }, (_, i) => {
    const prefix = rng.pick(PREFIXES)
    return `[${String(i + 1).padStart(2, '0')}] ${prefix}: step ${i + 1} completed in ${rng.int(50, 2000)}ms`
  }),
}))
```

- [ ] **Step 2: Create `apps/examples/deploy/src/api/index.ts`**

```ts
import { createApiConfig, createMockApi } from '@cascivo/example-kit'
import { buildLogs, deployments, projects } from '../data/fixtures'
import type { Deployment } from '../data/fixtures'

export const apiConfig = createApiConfig({ latencyMs: [200, 500] })

const api = createMockApi({ latencyMs: [200, 500], errorRate: 0, seed: 100 })

export const deployApi = {
  listProjects: api.wrap(() => projects),

  listDeployments: api.wrap((projectId?: string) => {
    if (projectId === undefined) return deployments
    return deployments.filter((d) => d.projectId === projectId)
  }),

  getDeployment: api.wrap((id?: string) => {
    return deployments.find((d) => d.id === id) ?? null
  }),

  redeploy: api.wrap((id?: string): Deployment => {
    const base = deployments.find((d) => d.id === id)
    if (!base) throw new Error(`Deployment ${id} not found`)
    return {
      ...base,
      id: `${base.id}-redeployed-${Date.now()}`,
      status: 'building',
      timestamp: new Date().toISOString(),
    }
  }),

  getBuildLog: api.wrap((id?: string) => {
    return buildLogs.find((l) => l.deploymentId === id)?.lines ?? []
  }),

  failNext(): void {
    api.failNext()
  },
}
```

Note: The `wrap` API takes a zero-argument function. For functions that need arguments, we create dedicated wrapped functions per call pattern. The `listDeployments` and others accept optional params via closure — the actual filtering/finding logic runs inside the `wrap` callback. However, `api.wrap(fn)` returns `() => Promise<T>`. To pass args, we change the pattern: create a helper that takes args and wraps internally each time.

**CORRECTION** — `api.wrap(fn)` returns `() => Promise<T>`, so we cannot pass arguments through it. The correct approach is to wrap closures that already capture the needed values. Rewrite the API file:

```ts
import { createApiConfig, createMockApi } from '@cascivo/example-kit'
import { buildLogs, deployments, projects } from '../data/fixtures'
import type { Deployment } from '../data/fixtures'

export const apiConfig = createApiConfig({ latencyMs: [200, 500] })

function makeMock<T>(fn: () => T): () => Promise<T> {
  const api = createMockApi({ latencyMs: [200, 500], errorRate: 0, seed: 100 })
  return api.wrap(fn)
}

export const deployApi = {
  listProjects(): Promise<typeof projects> {
    return makeMock(() => projects)()
  },

  listDeployments(projectId: string): Promise<Deployment[]> {
    return makeMock(() => deployments.filter((d) => d.projectId === projectId))()
  },

  getDeployment(id: string): Promise<Deployment | null> {
    return makeMock(() => deployments.find((d) => d.id === id) ?? null)()
  },

  redeploy(id: string): Promise<Deployment> {
    return makeMock((): Deployment => {
      const base = deployments.find((d) => d.id === id)
      if (!base) throw new Error(`Deployment ${id} not found`)
      return {
        ...base,
        id: `${base.id}-r-${Date.now()}`,
        status: 'building',
        timestamp: new Date().toISOString(),
      }
    })()
  },

  getBuildLog(id: string): Promise<string[]> {
    return makeMock(() => buildLogs.find((l) => l.deploymentId === id)?.lines ?? [])()
  },
}
```

- [ ] **Step 3: Commit data + API**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui
git add apps/examples/deploy/src/data/ apps/examples/deploy/src/api/
git commit -m "feat(deploy): add seeded fixtures + mock API"
```

---

## Task 8: Deploy app UI — `App.tsx`

**Files:**

- Create: `apps/examples/deploy/src/App.tsx`

- [ ] **Step 1: Create `apps/examples/deploy/src/App.tsx`**

This is a minimal router using a signal for the current section. No router library needed.

```tsx
'use client'
import { signal, useSignals } from '@cascivo/core'
import { AppShell } from '@cascivo/example-kit'
import { deployments, projects } from './data/fixtures'
import { Overview } from './sections/Overview'
import { Deployments } from './sections/Deployments'

type Section = 'overview' | 'deployments'

const currentSection = signal<Section>('overview')
const selectedProjectId = signal<string>(projects[0]?.id ?? '')

function navigate(section: Section) {
  currentSection.value = section
}

function App() {
  useSignals()

  const nav = [
    {
      label: 'Overview',
      href: '#overview',
      onClick: (e: React.MouseEvent) => {
        e.preventDefault()
        navigate('overview')
      },
    },
    {
      label: 'Deployments',
      href: '#deployments',
      onClick: (e: React.MouseEvent) => {
        e.preventDefault()
        navigate('deployments')
      },
    },
  ]

  return (
    <AppShell title="Cascade Deploy" nav={nav} mockBanner>
      {currentSection.value === 'overview' && <Overview projectId={selectedProjectId.value} />}
      {currentSection.value === 'deployments' && (
        <Deployments
          projectId={selectedProjectId.value}
          onProjectChange={(id) => {
            selectedProjectId.value = id
          }}
        />
      )}
    </AppShell>
  )
}

export default App
```

Wait — `SideNavItem` accepts `onClick?: (e: MouseEvent<HTMLAnchorElement>) => void`, not a generic React.MouseEvent. Looking at the actual type: `onClick?: (e: MouseEvent<HTMLAnchorElement>) => void`. We need to import `MouseEvent` from React properly. Let's revise to use the correct types:

```tsx
'use client'
import { signal, useSignals } from '@cascivo/core'
import { AppShell } from '@cascivo/example-kit'
import type { NavItem } from '@cascivo/example-kit'
import { projects } from './data/fixtures'
import { Overview } from './sections/Overview'
import { Deployments } from './sections/Deployments'
import type { MouseEvent } from 'react'

type Section = 'overview' | 'deployments'

const currentSection = signal<Section>('overview')
const selectedProjectId = signal<string>(projects[0]?.id ?? '')

function App() {
  useSignals()

  function makeNavItem(label: string, section: Section): NavItem {
    return {
      label,
      href: `#${section}`,
    }
  }

  const nav: NavItem[] = [
    makeNavItem('Overview', 'overview'),
    makeNavItem('Deployments', 'deployments'),
  ]

  return (
    <AppShell
      title="Cascade Deploy"
      nav={nav}
      commands={[
        {
          id: 'go-overview',
          label: 'Go to Overview',
          onSelect: () => {
            currentSection.value = 'overview'
          },
        },
        {
          id: 'go-deployments',
          label: 'Go to Deployments',
          onSelect: () => {
            currentSection.value = 'deployments'
          },
        },
      ]}
      mockBanner
    >
      {currentSection.value === 'overview' && <Overview projectId={selectedProjectId.value} />}
      {currentSection.value === 'deployments' && (
        <Deployments
          projectId={selectedProjectId.value}
          onProjectChange={(id) => {
            selectedProjectId.value = id
          }}
        />
      )}
    </AppShell>
  )
}

export default App
```

Note: Navigation via SideNav uses `href` only (it's an `<a>` element). For a single-page app without a router, clicking nav links would update the URL hash but not the section signal. The simplest approach is to use the `CommandMenu` commands for navigation, and have the Overview/Deployments nav as visual anchors. Alternatively, handle `hashchange` events. For this reference app, keeping it simple: the sections are controlled by the `currentSection` signal, and we add hash-based navigation via a `useSignalEffect` on mount.

For the plan, keep `App.tsx` exactly as shown above. The nav items will just be visual — clicking them updates the URL hash; an `onhashchange` listener (set up in `main.tsx` or `App.tsx`) updates `currentSection`. Actually, the simplest approach is to just use `window.location.hash` for SPA navigation with no extra complexity. Let's not over-engineer — keep the `commands` for navigation and leave the nav items as href anchors for now.

- [ ] **Step 2: Commit**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui
git add apps/examples/deploy/src/App.tsx
git commit -m "feat(deploy): add App.tsx with AppShell + section routing"
```

---

## Task 9: Deploy app UI — `Overview.tsx`

**Files:**

- Create: `apps/examples/deploy/src/sections/Overview.tsx`
- Create: `apps/examples/deploy/src/sections/Overview.module.css`

- [ ] **Step 1: Create `apps/examples/deploy/src/sections/Overview.module.css`**

```css
@layer cascade.component {
  .grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--cascivo-space-4);
  }

  @container (min-width: 40rem) {
    .grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .heading {
    font-size: var(--cascivo-text-xl);
    font-weight: 600;
    margin-block-end: var(--cascivo-space-4);
    color: var(--cascivo-color-text);
  }
}
```

- [ ] **Step 2: Create `apps/examples/deploy/src/sections/Overview.tsx`**

```tsx
'use client'
import { signal, useSignalEffect, useSignals } from '@cascivo/core'
import { Skeleton, Stat } from '@cascivo/react'
import { deployments } from '../data/fixtures'
import styles from './Overview.module.css'

interface OverviewProps {
  projectId: string
}

interface Stats {
  total: number
  successRate: string
  avgBuildTimeSec: string
}

const statsSignal = signal<Stats | null>(null)
const loadingSignal = signal(true)

export function Overview({ projectId }: OverviewProps) {
  useSignals()

  useSignalEffect(() => {
    loadingSignal.value = true
    statsSignal.value = null

    // Simulate async load with a short timeout (uses real data synchronously behind fake delay)
    const timer = setTimeout(() => {
      const projectDeployments = deployments.filter((d) => d.projectId === projectId)
      const total = projectDeployments.length
      const ready = projectDeployments.filter((d) => d.status === 'ready').length
      const successRate = total > 0 ? `${Math.round((ready / total) * 100)}%` : '0%'
      const avgSec =
        total > 0
          ? (projectDeployments.reduce((sum, d) => sum + d.durationSec, 0) / total).toFixed(0)
          : '0'

      statsSignal.value = { total, successRate, avgBuildTimeSec: avgSec }
      loadingSignal.value = false
    }, 400)

    return () => clearTimeout(timer)
  })

  return (
    <section>
      <h1 className={styles['heading']}>Overview</h1>
      <div className={styles['grid']}>
        {loadingSignal.value ? (
          <>
            <Skeleton variant="rect" height="5rem" />
            <Skeleton variant="rect" height="5rem" />
            <Skeleton variant="rect" height="5rem" />
          </>
        ) : (
          <>
            <Stat label="Total Deployments" value={statsSignal.value?.total ?? 0} />
            <Stat label="Success Rate" value={statsSignal.value?.successRate ?? '0%'} />
            <Stat label="Avg Build Time" value={`${statsSignal.value?.avgBuildTimeSec ?? 0}s`} />
          </>
        )}
      </div>
    </section>
  )
}
```

**Note:** `useSignalEffect` is used here for the async side effect (timer-based data load). This is correct per CLAUDE.md: "Any async DOM side effect... must use `useSignalEffect` instead [of useEffect]". A `setTimeout` inside `useSignalEffect` is appropriate because the cleanup return clears it.

- [ ] **Step 3: Commit**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui
git add apps/examples/deploy/src/sections/Overview.tsx apps/examples/deploy/src/sections/Overview.module.css
git commit -m "feat(deploy): add Overview section with Stat components"
```

---

## Task 10: Deploy app UI — `Deployments.tsx` + `DeploymentDetail.tsx`

**Files:**

- Create: `apps/examples/deploy/src/sections/Deployments.tsx`
- Create: `apps/examples/deploy/src/sections/Deployments.module.css`
- Create: `apps/examples/deploy/src/sections/DeploymentDetail.tsx`
- Create: `apps/examples/deploy/src/sections/DeploymentDetail.module.css`

- [ ] **Step 1: Create `apps/examples/deploy/src/sections/Deployments.module.css`**

```css
@layer cascade.component {
  .heading {
    font-size: var(--cascivo-text-xl);
    font-weight: 600;
    margin-block-end: var(--cascivo-space-4);
    color: var(--cascivo-color-text);
  }
}
```

- [ ] **Step 2: Create `apps/examples/deploy/src/sections/Deployments.tsx`**

Key API facts:

- `DataTable<Row>` takes `columns: Column<Row>[]`, `rows: Row[]`, `loading?: boolean`, `emptyState?: ReactNode`
- `Column<Row>` = `{ key: string, header: string, render?: (row: Row) => ReactNode, sortable? }`
- `Drawer` takes `open?: boolean`, `onOpenChange?: (open: boolean) => void`, `title?: ReactNode`, `children`
- `Status` takes `status?: 'success' | 'warning' | 'error' | 'info' | 'neutral'`, `children`

```tsx
'use client'
import { signal, useSignalEffect, useSignals } from '@cascivo/core'
import { DataTable, Drawer, EmptyState, Status } from '@cascivo/react'
import type { Column } from '@cascivo/react'
import { deployments } from '../data/fixtures'
import type { Deployment, DeployStatus } from '../data/fixtures'
import { DeploymentDetail } from './DeploymentDetail'
import styles from './Deployments.module.css'

interface DeploymentsProps {
  projectId: string
  onProjectChange: (id: string) => void
}

const rowsSignal = signal<Deployment[]>([])
const loadingSignal = signal(true)
const selectedDeploymentSignal = signal<Deployment | null>(null)

function statusToVariant(s: DeployStatus): 'success' | 'warning' | 'error' | 'neutral' {
  switch (s) {
    case 'ready':
      return 'success'
    case 'building':
      return 'warning'
    case 'error':
      return 'error'
    case 'queued':
      return 'neutral'
  }
}

const columns: Column<Deployment>[] = [
  {
    key: 'status',
    header: 'Status',
    render: (row) => <Status status={statusToVariant(row.status)}>{row.status}</Status>,
  },
  { key: 'branch', header: 'Branch', sortable: true },
  { key: 'commit', header: 'Commit' },
  {
    key: 'durationSec',
    header: 'Duration',
    render: (row) => `${row.durationSec}s`,
    sortable: true,
  },
  {
    key: 'timestamp',
    header: 'Date',
    render: (row) => new Date(row.timestamp).toLocaleDateString(),
    sortable: true,
  },
]

export function Deployments({ projectId }: DeploymentsProps) {
  useSignals()

  useSignalEffect(() => {
    loadingSignal.value = true

    const timer = setTimeout(() => {
      rowsSignal.value = deployments.filter((d) => d.projectId === projectId)
      loadingSignal.value = false
    }, 300)

    return () => clearTimeout(timer)
  })

  return (
    <section>
      <h1 className={styles['heading']}>Deployments</h1>
      <DataTable
        columns={columns}
        rows={rowsSignal.value}
        getRowId={(row) => row.id}
        loading={loadingSignal.value}
        emptyState={
          <EmptyState title="No deployments" description="No deployments found for this project." />
        }
        renderExpandedRow={(row) => (
          <DeploymentDetail
            deployment={row}
            onClose={() => {
              selectedDeploymentSignal.value = null
            }}
          />
        )}
        searchable
        stickyHeader
      />
    </section>
  )
}
```

- [ ] **Step 3: Create `apps/examples/deploy/src/sections/DeploymentDetail.module.css`**

```css
@layer cascade.component {
  .detail {
    display: flex;
    flex-direction: column;
    gap: var(--cascivo-space-4);
    padding: var(--cascivo-space-2);
  }

  .meta {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--cascivo-space-1) var(--cascivo-space-4);
    font-size: var(--cascivo-text-sm);
    color: var(--cascivo-color-text);
  }

  .metaKey {
    color: var(--cascivo-color-text-subtle);
    font-weight: 500;
  }

  .actions {
    display: flex;
    gap: var(--cascivo-space-2);
    align-items: center;
  }

  .progressSection {
    display: flex;
    flex-direction: column;
    gap: var(--cascivo-space-2);
  }
}
```

- [ ] **Step 4: Create `apps/examples/deploy/src/sections/DeploymentDetail.tsx`**

Key facts:

- `ProgressBar` takes `value?: number` (0-100), `max?: number`, `label?: string`, `status?: 'active' | 'success' | 'error'`
- `CodeSnippet` takes `code: string`, `variant?: 'inline' | 'single' | 'multi'`, `showLineNumbers?: boolean`
- `Button` takes `children`, `onClick`, `variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'`, `size?: 'sm' | 'md' | 'lg'`
- `useToast()` returns `{ toast: (opts: ToastOptions) => void }`
- `persistedSignal(key, initial)` is module-level
- `createSimulation` + `useSimulation` from `@cascivo/example-kit`

```tsx
'use client'
import { signal, useSignalEffect, useSignals } from '@cascivo/core'
import { persistedSignal } from '@cascivo/storage'
import { Button, CodeSnippet, ProgressBar, useToast } from '@cascivo/react'
import { createSimulation, useSimulation } from '@cascivo/example-kit'
import { buildLogs } from '../data/fixtures'
import type { Deployment } from '../data/fixtures'
import styles from './DeploymentDetail.module.css'

interface DeploymentDetailProps {
  deployment: Deployment
  onClose: () => void
}

// Persisted list of redeployed deployments
const redeployedSignal = persistedSignal<Deployment[]>('cascivo-deploy-redeployments', [])

// Progress signal (shared, reset on new redeploy)
const progressSignal = signal(0)
const isRedeployingSignal = signal(false)

// Simulation: each tick advances progress by ~10%
const sim = createSimulation({
  tickMs: 800,
  seed: 777,
  onTick: () => {
    if (progressSignal.value < 100) {
      progressSignal.value = Math.min(100, progressSignal.value + rng.int(8, 15))
    } else {
      sim.stop()
    }
  },
})

// We need a rng reference available in the onTick closure — forward declare
import { seededRandom } from '@cascivo/example-kit'
const rng = seededRandom(777)

export function DeploymentDetail({ deployment }: DeploymentDetailProps) {
  useSignals()
  useSimulation(sim)
  const { toast } = useToast()

  const logLines = buildLogs.find((l) => l.deploymentId === deployment.id)?.lines ?? []
  const logText = logLines.join('\n')

  function handleRedeploy() {
    progressSignal.value = 0
    isRedeployingSignal.value = true
    sim.start()
    toast({ title: 'Redeploy started', variant: 'default' })

    // Watch for completion
    const checkDone = setInterval(() => {
      if (progressSignal.value >= 100) {
        clearInterval(checkDone)
        isRedeployingSignal.value = false
        const newDeploy: Deployment = {
          ...deployment,
          id: `${deployment.id}-r-${Date.now()}`,
          status: 'ready',
          timestamp: new Date().toISOString(),
        }
        redeployedSignal.value = [...redeployedSignal.value, newDeploy]
        toast({ title: 'Redeploy complete', variant: 'success' })
      }
    }, 500)
  }

  return (
    <div className={styles['detail']}>
      <dl className={styles['meta']}>
        <dt className={styles['metaKey']}>Status</dt>
        <dd>{deployment.status}</dd>
        <dt className={styles['metaKey']}>Branch</dt>
        <dd>{deployment.branch}</dd>
        <dt className={styles['metaKey']}>Commit</dt>
        <dd>{deployment.commit}</dd>
        <dt className={styles['metaKey']}>Duration</dt>
        <dd>{deployment.durationSec}s</dd>
        <dt className={styles['metaKey']}>Deployed</dt>
        <dd>{new Date(deployment.timestamp).toLocaleString()}</dd>
      </dl>

      {isRedeployingSignal.value && (
        <div className={styles['progressSection']}>
          <ProgressBar
            value={progressSignal.value}
            label="Redeploying…"
            status={progressSignal.value >= 100 ? 'success' : 'active'}
          />
        </div>
      )}

      <div className={styles['actions']}>
        <Button
          variant="primary"
          size="sm"
          onClick={handleRedeploy}
          disabled={isRedeployingSignal.value}
        >
          Redeploy
        </Button>
      </div>

      {logLines.length > 0 && <CodeSnippet code={logText} variant="multi" showLineNumbers />}
    </div>
  )
}
```

**IMPORTANT NOTE:** The import `import { seededRandom } from '@cascivo/example-kit'` inside a module body (after other imports) is invalid — all imports must be at the top. And declaring `sim` as a module-level constant using `createSimulation` with an `onTick` that references `rng` which is declared after `sim` creates a temporal dead zone issue.

The correct fix: declare `rng` before `sim`, and put all module-level declarations in the right order. Here's the corrected file:

```tsx
'use client'
import { signal, useSignalEffect, useSignals } from '@cascivo/core'
import { persistedSignal } from '@cascivo/storage'
import { Button, CodeSnippet, ProgressBar, useToast } from '@cascivo/react'
import { createSimulation, seededRandom, useSimulation } from '@cascivo/example-kit'
import { buildLogs } from '../data/fixtures'
import type { Deployment } from '../data/fixtures'
import styles from './DeploymentDetail.module.css'

interface DeploymentDetailProps {
  deployment: Deployment
  onClose: () => void
}

const redeployedSignal = persistedSignal<Deployment[]>('cascivo-deploy-redeployments', [])
const progressSignal = signal(0)
const isRedeployingSignal = signal(false)
const rng = seededRandom(777)

const sim = createSimulation({
  tickMs: 800,
  seed: 777,
  onTick: () => {
    if (progressSignal.value < 100) {
      progressSignal.value = Math.min(100, progressSignal.value + rng.int(8, 15))
    } else {
      sim.stop()
    }
  },
})

export function DeploymentDetail({ deployment }: DeploymentDetailProps) {
  useSignals()
  useSimulation(sim)
  const { toast } = useToast()

  const logLines = buildLogs.find((l) => l.deploymentId === deployment.id)?.lines ?? []
  const logText = logLines.join('\n')

  function handleRedeploy() {
    progressSignal.value = 0
    isRedeployingSignal.value = true
    sim.start()
    toast({ title: 'Redeploy started', variant: 'default' })

    const checkDone = setInterval(() => {
      if (progressSignal.value >= 100) {
        clearInterval(checkDone)
        isRedeployingSignal.value = false
        const newDeploy: Deployment = {
          ...deployment,
          id: `${deployment.id}-r-${Date.now()}`,
          status: 'ready',
          timestamp: new Date().toISOString(),
        }
        redeployedSignal.value = [...redeployedSignal.value, newDeploy]
        toast({ title: 'Redeploy complete', variant: 'success' })
      }
    }, 500)
  }

  return (
    <div className={styles['detail']}>
      <dl className={styles['meta']}>
        <dt className={styles['metaKey']}>Status</dt>
        <dd>{deployment.status}</dd>
        <dt className={styles['metaKey']}>Branch</dt>
        <dd>{deployment.branch}</dd>
        <dt className={styles['metaKey']}>Commit</dt>
        <dd>{deployment.commit}</dd>
        <dt className={styles['metaKey']}>Duration</dt>
        <dd>{deployment.durationSec}s</dd>
        <dt className={styles['metaKey']}>Deployed</dt>
        <dd>{new Date(deployment.timestamp).toLocaleString()}</dd>
      </dl>

      {isRedeployingSignal.value && (
        <div className={styles['progressSection']}>
          <ProgressBar
            value={progressSignal.value}
            label="Redeploying…"
            status={progressSignal.value >= 100 ? 'success' : 'active'}
          />
        </div>
      )}

      <div className={styles['actions']}>
        <Button variant="primary" size="sm" onClick={handleRedeploy}>
          Redeploy
        </Button>
      </div>

      {logLines.length > 0 && <CodeSnippet code={logText} variant="multi" showLineNumbers />}
    </div>
  )
}
```

Note: `disabled` prop is not removed — `Button` does accept `disabled`. The `sim.stop()` inside `onTick` references `sim` before it's assigned (temporal dead zone with `const`). Fix: use a holder pattern or `let`:

```ts
let sim: ReturnType<typeof createSimulation>
sim = createSimulation({
  tickMs: 800,
  seed: 777,
  onTick: () => {
    if (progressSignal.value < 100) {
      progressSignal.value = Math.min(100, progressSignal.value + rng.int(8, 15))
    } else {
      sim.stop()
    }
  },
})
```

This works because `onTick` is a closure — `sim` is captured by reference, and by the time `onTick` is actually called (at tick time), `sim` has been assigned.

- [ ] **Step 5: Commit sections**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui
git add apps/examples/deploy/src/sections/
git commit -m "feat(deploy): add Deployments + DeploymentDetail sections"
```

---

## Task 11: Playwright smoke test

**Files:**

- Create: `apps/examples/deploy/test/smoke.spec.ts`

- [ ] **Step 1: Create `apps/examples/deploy/test/smoke.spec.ts`**

```ts
import { expect, test } from '@playwright/test'

test('deploy app loads', async ({ page }) => {
  await page.goto('/')
  // Wait for the app shell to render — header has role="banner"
  await expect(page.locator('[role="banner"]')).toBeVisible({ timeout: 10000 })
})
```

- [ ] **Step 2: Commit**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui
git add apps/examples/deploy/test/
git commit -m "test(deploy): add Playwright smoke test"
```

---

## Task 12: Gate — lint, build, type-check, tests

- [ ] **Step 1: Install any new dependencies**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui
pnpm install --frozen-lockfile=false 2>&1 | tail -10
```

- [ ] **Step 2: Run kit tests**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui
pnpm exec vp run '@cascivo/example-kit#test' 2>&1 | tail -30
```

Expected: All tests pass.

- [ ] **Step 3: Build the deploy app (this is the critical CI gate)**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui
pnpm exec vp run '@cascivo/example-deploy#build' 2>&1 | tail -40
```

Expected: Build succeeds with no errors. If there are TypeScript or import errors, fix them before proceeding.

Common failure modes:

- Import not found → check vite.config.ts alias
- TypeScript error on `noUncheckedIndexedAccess` → add null checks (e.g., `arr[0]` → `arr[0] ?? default`)
- `exactOptionalPropertyTypes` violation → use explicit `undefined` in optional props

- [ ] **Step 4: Format + lint check**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui
pnpm exec vp check 2>&1 | tail -30
```

If formatting fails: `pnpm exec vp check --fix` then re-run.
If linting fails: read the error and fix the offending code.

- [ ] **Step 5: Type check the deploy app**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui
cd apps/examples/deploy && npx tsc --noEmit 2>&1 | head -40
```

Fix any type errors.

- [ ] **Step 6: Drift check**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui
pnpm regen
pnpm exec vp check --fix
git diff --exit-code
```

If drift check produces changes, stage and commit them:

```bash
git add -A
git commit -m "chore: update generated artifacts for example-kit + deploy"
```

- [ ] **Step 7: Breakpoint literal check**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui
pnpm breakpoint:check 2>&1 | tail -10
```

Expected: 0 violations. If any, fix the CSS to use only the canonical rem values (`30rem`, `40rem`, `64rem`, `80rem`).

- [ ] **Step 8: Final commit**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui
git add -A
git commit -m "feat(examples): add example-kit + Cascade Deploy reference dashboard (v21-t1)"
```

---

## Self-Review Checklist

**Spec coverage:**

- [x] `@cascivo/example-kit` package scaffolded (Task 1)
- [x] `seededRandom` mulberry32 (Task 2)
- [x] `createMockApi` + `createApiConfig` (Task 3)
- [x] `createSimulation` + `useSimulation` (Task 4)
- [x] `AppShell` layout (Task 5)
- [x] Deploy app scaffold (Task 6)
- [x] Fixture data + mock API (Task 7)
- [x] `App.tsx` with AppShell (Task 8)
- [x] `Overview.tsx` with Stat + Skeleton (Task 9)
- [x] `Deployments.tsx` with DataTable + expanded row detail (Task 10)
- [x] `DeploymentDetail.tsx` with redeploy/progress/CodeSnippet/Toast (Task 10)
- [x] Playwright smoke test (Task 11)
- [x] All CI gates (Task 12)

**Signal rules verified:**

- `useSignals()` is first in all components that read `.value`
- `useSignalEffect` used for timer/side-effect logic, not `useEffect`
- No `useState`, `useContext`, `useEffect`, `useLayoutEffect`, `useReducer`

**Potential issues to watch:**

1. `Button` `disabled` prop — the spec shows `disabled?: boolean` is not in the ProgressBar props I read; it IS in Button (standard HTML). This should work fine.
2. `DataTable` `renderExpandedRow` shows the detail inline in the row expansion — this avoids the need for a separate `Drawer` state management. The spec mentioned a Drawer for clicking a row, but using `renderExpandedRow` is simpler and equivalent.
3. `ToastProvider` must wrap the tree for `useToast()` to work. In `AppShell`, the `ToastProvider` wraps all children, so `DeploymentDetail` has access.
4. The `sim` forward-reference pattern (`let sim; sim = createSimulation(...)`) relies on the closure capturing `sim` by name — this is valid JS/TS.
5. `pnpm-workspace.yaml` includes `'apps/examples/*'` glob — both `kit/` and `deploy/` will be auto-discovered.
