# Enterprise readiness: frictions → shipped primitives

This guide answers an "enterprise-readiness" report that proposed six architectural
additions after a Vercel-style dashboard dry run. The valuable part of that report is
the list of **frictions** — the recurring pain points an enterprise team (or an LLM
generating their code) hits. The proposed *code*, however, was written against a
generic React/Tailwind mental model, not against cascivo: it reached for `useState`,
`useEffect`, `useContext`, Tailwind utility classes, a `data-cascivo-theme` attribute,
a `@cascivo/theme` package, and dot-notation tokens like `color.background.primary` —
none of which exist here, and most of which this project's [component rules](../CLAUDE.md)
ban outright.

The important finding is that **cascivo already solves five of the six frictions**, and
the sixth (a reusable theme runtime) now ships too. This page maps each friction to the
real primitive, shows the idiomatic code, and calls out the misconception so an agent
reading it never regenerates the banned pattern.

| # | Friction from the report | Real answer in cascivo |
| - | ------------------------ | ---------------------- |
| 1 | Signal vs. React-state cognitive split | `useControllableSignal` + `useSignals` (`@cascivo/core`) |
| 2 | No layout primitives for dense grids | `Grid` / `AutoGrid` / `Flex` / `Columns` / `Center` / `Stack` |
| 3 | Theme switching flashes / fights the cascade | `ThemeProvider` / `useTheme` / `themePreloadScript` (`@cascivo/react`) |
| 4 | Signal leaks across route changes | `useScope` / `createScope` (`@cascivo/core`) |
| 5 | Token names invisible to the LLM context window | `CascivoToken` / `CascivoColorToken` (`@cascivo/tokens/tokens`) |
| 6 | Forms fight signal reactivity | `createForm` / `useForm` / `Form` / `field` (`@cascivo/components`) |

---

## 1 — Signal ↔ React state, without a "cognitive split"

**The friction is real:** an author (or LLM) shouldn't have to hand-wire the
controlled/uncontrolled prop pattern onto a signal every time, and a raw React
`useState` next to a signal does cause double reactivity.

**The report's fix was wrong for cascivo:** its `useSignalState` is built on `useState`
+ `useEffect` + a `forceUpdate({})` — all three hooks are banned in cascivo components,
and it re-introduces the very React render cycle it claims to avoid. The `$isActive={signal}`
JSX directive it proposes doesn't exist and contradicts the owned-code model (there is no
compiler intercepting your JSX).

**The shipped answer** is [`useControllableSignal`](../packages/core/src/controllable.ts) —
it codifies the controlled/uncontrolled bridge once, with no effect:

```tsx
import { useControllableSignal, useSignals } from '@cascivo/core'

function Toggle({ pressed, defaultPressed, onPressedChange }: ToggleProps) {
  useSignals() // subscribe this React component to signal reads (no Babel transform in app code)
  const [on, setOn] = useControllableSignal({
    value: pressed, // controlled when defined; uncontrolled otherwise — fixed for the component's life
    defaultValue: defaultPressed,
    onChange: onPressedChange,
  })
  return <button data-state={on.value ? 'on' : 'off'} onClick={() => setOn(!on.peek())} />
}
```

The rule an agent must internalize: **the signal *is* the state.** You never pair a
signal with `useState`. In React apps that don't run the Babel signals transform
(`apps/examples/*`, any consumer app), a component that reads `signal.value` during
render calls `useSignals()` as its first statement — that is the entire "bridge."

---

## 2 — Layout primitives for dense grids

**The friction is real:** without layout components, an LLM falls back to ad-hoc inline
styles or Tailwind, fragmenting the cascade.

**The report's fix was wrong for cascivo:** it emits Tailwind-style `className` utility
strings (`c-layer-layout`) and imports a `@cascivo/theme` package that doesn't exist.
cascivo bans Tailwind and applies layout via **CSS Modules inside `@layer cascivo.component`**,
with dynamic values passed as scoped custom properties — never utility classes.

**The shipped answer** is the [`@cascivo/layouts`](../packages/layouts) primitive set,
re-exported from `@cascivo/react`. Gaps are token-scaled; column counts are responsive
objects:

```tsx
import { Grid, GridItem, AutoGrid, Flex } from '@cascivo/react'

// Dashboard card grid: 1 col on phones → 4 on desktop, gap from the space scale.
<Grid cols={{ base: 1, md: 2, lg: 4 }} gap={4}>
  <GridItem span={{ base: 1, lg: 2 }}>{/* wide KPI tile */}</GridItem>
</Grid>

// Self-sizing card wall — no breakpoints, tracks wrap at a min width.
<AutoGrid min="16rem" gap={4}>{cards}</AutoGrid>
```

`gap` is constrained to the token scale (`1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12` →
`--cascivo-space-*`), so there is no arbitrary spacing to hallucinate. See
[the layout cookbook](cookbooks/layout-and-spacing.md) for the full set (`Columns`,
`Center`, `Spacer`, `Stack`, `Section`, `SplitView`, `Masonry`) and the page/app
scaffolds (`AppShell`, `dashboard-layout`, `console-app`).

---

## 3 — Theme switching that never flashes or fights the cascade

**The friction is real, and this was the one genuine gap.** Every consumer app had to
hand-roll the "persist the choice, mirror it onto `data-theme`, and pre-paint it to avoid
a flash" wiring; only an app-local copy existed in `apps/site/src/theme.ts`.

**The report's fix was wrong for cascivo:** it uses `useEffect` (banned) and writes a
`data-cascivo-theme` attribute the themes don't read — cascivo themes are scoped by
`[data-theme='…']`. FOUC isn't solved by a React effect at all; it's solved by a
pre-paint script in the document head.

**The shipped answer** is [`ThemeProvider`](../packages/react/src/theme.tsx), now exported
from `@cascivo/react`. It packages the exact reference wiring, rules-compliant: the DOM
write happens in `useSignalEffect` (not `useEffect`), the active theme is a module-level
signal (not React context), and it drives the real `data-theme` attribute.

```tsx
import { ThemeProvider, useTheme, themePreloadScript } from '@cascivo/react'

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="app-theme">
      <ThemeToggle />
    </ThemeProvider>
  )
}

function ThemeToggle() {
  const [theme, setTheme] = useTheme() // reactive [signal, setter]; the hook calls useSignals() for you
  return (
    <button onClick={() => setTheme(theme.value === 'dark' ? 'light' : 'dark')}>
      {theme.value === 'dark' ? '☀︎' : '☾'}
    </button>
  )
}
```

For SSR / Next.js, inline the pre-paint script so the persisted theme paints on the
first byte — no flash on a hard reload:

```tsx
// app/layout.tsx  (before the app bundle)
<head>
  <script dangerouslySetInnerHTML={{ __html: themePreloadScript({ storageKey: 'app-theme' }) }} />
</head>
```

`ThemeProvider` is uncontrolled (persists to `localStorage`) by default; pass `value` to
control it from server state, `target` to scope a subtree to its own theme, and `attribute`
if you drive a non-default attribute. See [THEMING.md](THEMING.md) for the cascade model
these hook into.

---

## 4 — Signal lifecycles that don't leak across routes

**The friction is real:** a global signal that outlives the screen that created it shows
stale state when the user navigates back.

**The report's fix was wrong for cascivo:** its `useComponentSignals` registry disposes
inside `useEffect` (banned), and Preact signals have no `.dispose()`/`.reset()` — only
*effects* hold subscriptions worth tearing down, and a plain signal is garbage-collected
with the component that owns it.

**The shipped answer** is [`useScope` / `createScope`](../packages/core/src/scope.ts) — a
disposable owner for a set of effects, torn down on unmount via `useSignalEffect`, no
`useEffect` anywhere:

```tsx
import { useScope } from '@cascivo/core'

function DeploymentSettings() {
  const scope = useScope() // disposed automatically when this route unmounts
  // Every effect started through the scope stops firing at once on navigate-away —
  // no orphaned subscriptions running against unmounted UI.
  scope.effect(() => {
    document.title = `Editing ${projectName.value}`
  })
  return /* … */
}
```

Use one scope per tenant boundary (a workspace, an org, a repo group): on switch, call
`dispose()` and create a fresh one. This is the enterprise SPA pattern the report asked
for, minus the leak the `useEffect` version would itself introduce.

---

## 5 — Token names the LLM can see in its context window

**The friction is real:** if the model has to open a `.css` file to learn which tokens
exist, it hallucinates class names like `text-vercel-black`.

**The report's fix was wrong for cascivo:** it invents a dot-notation union
(`'color.background.primary'`) that maps to nothing in this codebase and would drift from
the CSS the moment either side changed.

**The shipped answer** is a **generated** union that reflects the real custom properties,
so it can't drift — [`packages/tokens/src/tokens.d.ts`](../packages/tokens/src/tokens.d.ts),
regenerated by `pnpm tokens:generate`:

```ts
import type { CascivoToken, CascivoColorToken } from '@cascivo/tokens/tokens'

// Both are string-literal unions of every shipped `--cascivo-*` property.
// A prop typed `CascivoColorToken` gives the LLM exact autocomplete with no CSS lookup:
interface SwatchProps {
  token: CascivoColorToken // e.g. '--cascivo-color-accent' | '--cascivo-color-surface' | …
}
```

Because the manifest is auto-generated from the token CSS, the type is always in sync with
what actually ships — the opposite of a hand-authored union. See [TOKENS.md](TOKENS.md)
for the three-tier catalog these names come from.

---

## 6 — Forms that don't fight signal reactivity

**The friction is real:** React-state form managers re-render on every keystroke and don't
observe signal updates.

**The report's fix was close in spirit** — a `createForm` / `Field` API — but cascivo
already ships a superset.

**The shipped answer** is [`createForm` / `useForm` / `Form` / `field`](../packages/components/src/form/form.tsx):
a signal-backed store (`values`, `errors`, `touched`, `submitting` are all signals), with
optional [Standard Schema](https://standardschema.dev) validation (zod, valibot, arktype)
in addition to a plain `validate` function:

```tsx
import { useForm, Form, Field, Input } from '@cascivo/react'

function DomainForm() {
  const form = useForm({
    initialValues: { domain: '' },
    validate: (v) => (v.domain.includes('.') ? {} : { domain: 'Invalid domain format' }),
  })
  const domain = form.field('domain') // { value, onChange, onBlur, error }
  return (
    <Form form={form} onValid={(v) => save(v)}>
      <Field label="Domain" error={domain.error}>
        <Input value={domain.value} onChange={(e) => domain.onChange(e.target.value)} />
      </Field>
    </Form>
  )
}
```

Validation runs against the signal store, so keystroke-frequency updates never trigger a
React re-render of the whole form. `Field` wires the label, description, and `aria-invalid`
/ `role="alert"` accessibility for you.

---

## The meta-lesson

The report's premise — "these frictions prove cascivo isn't enterprise-ready" — inverted
the truth: the primitives existed; they were just **undiscoverable at the point of need**,
so a capable developer regenerated inferior, rules-violating versions of things that
already ship. That is a discoverability problem, and this document (plus the new
`ThemeProvider` that closed the one true gap) is the fix. When you build on cascivo, reach
for the primitives above before writing behavior by hand — and never port a `useState` /
`useEffect` / Tailwind snippet in verbatim; it will fail the [component rules](../CLAUDE.md)
gate, and there is almost always a signal-native primitive that does it better.
