# v21 Tranche 1 Quality Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix four code quality issues in v21 Tranche 1 — reactive feedback loop in `useSimulation`, missing error handling in `loadData`, unsafe empty-array `pick()`, and hardcoded hex fallbacks in CSS.

**Architecture:** Each fix is in a different file; they are fully independent. Tests exist for simulation and seeded-random; deploy app has no tests yet — we add one for `loadData`. CSS fix is tokens-only (no logic).

**Tech Stack:** TypeScript, Preact Signals (`useSignalEffect`, `useSignals` from `@cascivo/core`), Vitest, vite+ (`vp`).

---

## File Map

| File                                             | Change                                                            |
| ------------------------------------------------ | ----------------------------------------------------------------- |
| `apps/examples/kit/src/simulation.ts`            | Rewrite `useSimulation` — remove `running.value` read from effect |
| `apps/examples/kit/src/simulation.test.ts`       | Add `useSimulation` mount/unmount test                            |
| `apps/examples/deploy/src/data/fixtures.ts`      | Add `loadError` signal + try/catch in `loadData`                  |
| `apps/examples/deploy/src/data/fixtures.test.ts` | New file — test `loadData` error path                             |
| `apps/examples/kit/src/seeded-random.ts`         | Add empty-array guard in `pick()`                                 |
| `apps/examples/kit/src/seeded-random.test.ts`    | Add empty-array throw test                                        |
| `apps/examples/kit/src/app-shell.module.css`     | Replace hex fallbacks with valid token names                      |

---

### Task 1: Fix `useSimulation` feedback loop

**Files:**

- Modify: `apps/examples/kit/src/simulation.ts:47-55`
- Modify: `apps/examples/kit/src/simulation.test.ts`

**Problem:** `useSignalEffect` subscribes to `sim.running.value`, then calls `sim.start()` which writes `sim.running.value = true` — a reactive cycle. The fix: never read `sim.running.value` inside the effect. Mount = start, unmount cleanup = stop.

- [ ] **Step 1: Write the failing test for mount/unmount behavior**

Add to `apps/examples/kit/src/simulation.test.ts` after the existing `describe('createSimulation', ...)` block:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createSimulation, useSimulation } from './simulation'
import { renderHook } from '@testing-library/react'
```

Add a new `describe('useSimulation', ...)` block at the bottom of the file:

```ts
describe('useSimulation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts the sim on mount and stops on unmount', () => {
    const onTick = vi.fn()
    const sim = createSimulation({ tickMs: 100, seed: 0, onTick })
    expect(sim.running.value).toBe(false)

    const { unmount } = renderHook(() => useSimulation(sim))
    expect(sim.running.value).toBe(true)

    unmount()
    expect(sim.running.value).toBe(false)
  })
})
```

- [ ] **Step 2: Check that `@testing-library/react` is available in the kit package**

Run: `grep -r "testing-library" /home/adam/github.com/urbanisierung/cascade-ui/apps/examples/kit/package.json`

If not present, run from workspace root:

```bash
pnpm add -D @testing-library/react --filter @cascivo/example-kit
```

- [ ] **Step 3: Run the test to confirm it fails**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui && pnpm exec vp run @cascivo/example-kit#test 2>&1 | tail -30
```

Expected: test fails because `useSimulation` currently does not start the sim on mount (it only starts when `running.value` is already true).

- [ ] **Step 4: Rewrite `useSimulation` in `apps/examples/kit/src/simulation.ts`**

Replace lines 47-55:

```ts
export function useSimulation(sim: Simulation): void {
  useSignals()
  useSignalEffect(() => {
    sim.start()
    return () => sim.stop()
  })
}
```

The effect no longer reads `sim.running.value`, so there is no reactive cycle. Mount starts, unmount cleanup stops.

- [ ] **Step 5: Run tests — must pass**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui && pnpm exec vp run @cascivo/example-kit#test 2>&1 | tail -30
```

Expected: all tests pass including the new `useSimulation` mount/unmount test.

- [ ] **Step 6: Commit**

```bash
git add apps/examples/kit/src/simulation.ts apps/examples/kit/src/simulation.test.ts
git commit -m "fix(example-kit): remove running.value read from useSimulation — breaks reactive cycle"
```

---

### Task 2: Add error handling to `loadData`

**Files:**

- Modify: `apps/examples/deploy/src/data/fixtures.ts`
- Create: `apps/examples/deploy/src/data/fixtures.test.ts`

**Problem:** `loadData()` has no try/catch. If the mock API rejects, `loading` stays `true` forever and the error is swallowed.

- [ ] **Step 1: Write the failing test**

Create `apps/examples/deploy/src/data/fixtures.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @cascivo/core before importing fixtures (signals need no DOM)
vi.mock('@cascivo/core', () => ({
  signal: (initial: unknown) => {
    let _value = initial
    return {
      get value() {
        return _value
      },
      set value(v: unknown) {
        _value = v
      },
    }
  },
}))

// Mock @cascivo/example-kit createMockApi
vi.mock('@cascivo/example-kit', () => ({
  createMockApi: () => ({
    getPipelines: vi.fn(),
    getEnvironments: vi.fn(),
    getMetrics: vi.fn(),
    wrap: (fn: () => unknown) => async () => {
      return fn()
    },
  }),
}))

describe('loadData', () => {
  it('sets loadError and loading=false on rejection', async () => {
    // We need to re-import after setting up mocks, use dynamic import
    const mod = await import('./fixtures')

    // Reset state
    mod.loading.value = false
    mod.loadError.value = null

    // Make the api throw — re-export api so we can spy on it
    // Instead: test via the exported api mock by replacing wrap
    // Simpler: use the fact that createMockApi.wrap calls the fn and we can mock getPipelines
    // Actually the cleanest approach: spy on the module-level api
    // Since we can't easily re-mock after import, test the signal contract instead:
    // Manually invoke loadData with a forced rejection scenario via vi.spyOn

    // Force getPipelines to reject via the api export
    vi.spyOn(mod.api, 'wrap').mockImplementation(() => async () => {
      throw new Error('network failure')
    })

    await mod.loadData()

    expect(mod.loadError.value).toBe('network failure')
    expect(mod.loading.value).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails (loadError doesn't exist yet)**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui && pnpm exec vp run @cascivo/example-deploy#test 2>&1 | tail -30
```

Expected: error — `mod.loadError` is undefined.

**Note:** If `@cascivo/example-deploy` has no `test` script, add one to its `package.json`:

```json
"test": "vp test"
```

- [ ] **Step 3: Add `loadError` signal and try/catch to `apps/examples/deploy/src/data/fixtures.ts`**

Replace the file content:

```ts
import { signal } from '@cascivo/core'
import { createMockApi } from '@cascivo/example-kit'
import type { Pipeline, Environment, Metrics } from '@cascivo/example-kit'

export const api = createMockApi(42, { latencyMs: [400, 800], errorRate: 0 })

// Reactive state — sections subscribe to these
export const loading = signal(true)
export const loadError = signal<string | null>(null)
export const pipelines = signal<Pipeline[]>([])
export const environments = signal<Environment[]>([])
export const metrics = signal<Metrics | null>(null)

// Load all data via the mock API's async wrap — call once at app startup
export async function loadData(): Promise<void> {
  loading.value = true
  loadError.value = null
  try {
    const [p, e, m] = await Promise.all([
      api.wrap(() => api.getPipelines())(),
      api.wrap(() => api.getEnvironments())(),
      api.wrap(() => api.getMetrics())(),
    ])
    pipelines.value = p
    environments.value = e
    metrics.value = m
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
}
```

- [ ] **Step 4: Show the error in `App.tsx`**

Add an error banner after the existing `useSignalEffect` call in `apps/examples/deploy/src/App.tsx`. Import `loadError` from fixtures:

```tsx
import { loadData, loadError } from './data/fixtures'
```

Add inside the JSX, before `<main>`:

```tsx
{
  loadError.value && (
    <div
      role="alert"
      style={{
        padding: '0.5rem 1rem',
        background: 'var(--cascivo-color-destructive-subtle)',
        color: 'var(--cascivo-color-error)',
      }}
    >
      {loadError.value}
    </div>
  )
}
```

- [ ] **Step 5: Check deploy app package.json has a test script**

```bash
cat /home/adam/github.com/urbanisierung/cascade-ui/apps/examples/deploy/package.json
```

If no `"test"` script, add `"test": "vp test"` to the scripts block.

- [ ] **Step 6: Run tests**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui && pnpm exec vp run @cascivo/example-deploy#test 2>&1 | tail -40
```

Expected: the `loadData` error test passes.

- [ ] **Step 7: Verify deploy app still builds**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui && pnpm exec vp run @cascivo/example-deploy#build 2>&1 | tail -20
```

Expected: build succeeds.

- [ ] **Step 8: Commit**

```bash
git add apps/examples/deploy/src/data/fixtures.ts apps/examples/deploy/src/data/fixtures.test.ts apps/examples/deploy/src/App.tsx apps/examples/deploy/package.json
git commit -m "fix(example-deploy): add loadError signal and try/catch to loadData"
```

---

### Task 3: Guard `pick()` against empty arrays

**Files:**

- Modify: `apps/examples/kit/src/seeded-random.ts:28`
- Modify: `apps/examples/kit/src/seeded-random.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `apps/examples/kit/src/seeded-random.test.ts` inside the existing `describe('mulberry32', ...)` block or in a new block after it:

```ts
import { seededRandom } from './seeded-random'

describe('seededRandom', () => {
  it('pick() throws on empty array', () => {
    const rng = seededRandom(1)
    expect(() => rng.pick([])).toThrow('seededRandom.pick: empty array')
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui && pnpm exec vp run @cascivo/example-kit#test 2>&1 | tail -20
```

Expected: test fails — currently `pick([])` returns `undefined` cast as T instead of throwing.

- [ ] **Step 3: Add the guard in `apps/examples/kit/src/seeded-random.ts`**

Replace line 28:

```ts
    pick: <T>(arr: T[]) => arr[Math.floor(rng() * arr.length)] as T,
```

With:

```ts
    pick: <T>(arr: T[]): T => {
      if (arr.length === 0) throw new Error('seededRandom.pick: empty array')
      return arr[Math.floor(rng() * arr.length)] as T
    },
```

- [ ] **Step 4: Run tests — must pass**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui && pnpm exec vp run @cascivo/example-kit#test 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/examples/kit/src/seeded-random.ts apps/examples/kit/src/seeded-random.test.ts
git commit -m "fix(example-kit): throw on empty array in seededRandom.pick()"
```

---

### Task 4: Replace hardcoded hex fallbacks in CSS

**Files:**

- Modify: `apps/examples/kit/src/app-shell.module.css:23-24`

**Context:** The themes define `--cascivo-color-warning-subtle` (background) and `--cascivo-color-warning-foreground` (text/foreground). The tokens `--cascivo-color-warning-bg` and `--cascivo-color-warning-text` do not exist. Replace the hex fallbacks with the correct token names.

- [ ] **Step 1: Replace the hex fallbacks**

In `apps/examples/kit/src/app-shell.module.css`, replace:

```css
background: var(--cascivo-color-warning-bg, #fef3c7);
color: var(--cascivo-color-warning-text, #92400e);
```

With:

```css
background: var(--cascivo-color-warning-subtle);
color: var(--cascivo-color-warning-foreground);
```

No hex fallback — the theme tokens always exist once a theme is applied.

- [ ] **Step 2: Run `vp check` to confirm no lint/format issues**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui && pnpm exec vp check 2>&1 | tail -20
```

Expected: passes cleanly.

- [ ] **Step 3: Commit**

```bash
git add apps/examples/kit/src/app-shell.module.css
git commit -m "fix(example-kit): use valid warning tokens — drop hex fallbacks from app-shell CSS"
```

---

### Task 5: Final verification gate

- [ ] **Step 1: Run all kit tests**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui && pnpm exec vp run @cascivo/example-kit#test 2>&1 | tail -30
```

Expected: all pass.

- [ ] **Step 2: Run deploy build**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui && pnpm exec vp run @cascivo/example-deploy#build 2>&1 | tail -20
```

Expected: succeeds.

- [ ] **Step 3: Run full check**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui && pnpm exec vp check 2>&1 | tail -20
```

Expected: passes.

- [ ] **Step 4: Run drift check**

```bash
cd /home/adam/github.com/urbanisierung/cascade-ui && pnpm regen && pnpm exec vp check --fix && git diff --exit-code
```

Expected: no diff (or commit any regenerated artifacts).

---

## Self-Review

**Spec coverage:**

- Fix 1 (useSimulation feedback loop) → Task 1 ✓
- Fix 2 (loadData error handling) → Task 2 ✓
- Fix 3 (pick() empty array) → Task 3 ✓
- Fix 4 (hex fallbacks in CSS) → Task 4 ✓
- Tests for each change → Tasks 1, 2, 3 ✓

**Token names verified** against `packages/themes/src/flat.css` lines 82 and 86:

- `--cascivo-color-warning-subtle` → line 82: `oklch(0.96 0.04 75)` ✓ (background)
- `--cascivo-color-warning-foreground` → line 86: `oklch(0.5 0.14 75)` ✓ (text)

**No placeholders found.**
