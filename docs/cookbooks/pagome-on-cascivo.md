# Cookbook: Rebuild pagome.com on cascivo (design-preserving)

> **Goal:** Reproduce the exact visual design of [pagome.com](https://pagome.com) — a
> client-rendered SEPA payment-link tool — using `@cascivo/*` components, **without
> changing how the page looks**. No component source edits; design parity is achieved
> entirely through a custom theme (token overrides) plus composing existing primitives.

---

## TL;DR

Pagome's stylesheet (`/assets/index-*.css`) is, structurally, a hand-rolled clone of
cascivo's own architecture: `--pagome-*` semantic tokens, `[data-theme=light|dark]` +
`prefers-color-scheme` theming, and Button variant names (`primary / secondary / ghost /
destructive`) identical to cascivo's. That parity makes the port almost mechanical.

- **Component coverage: complete.** Every reusable primitive on the page exists in cascivo.
- **Design preservation: a custom theme**, not source edits. ~15 token overrides reproduce
  pagome's colors, fonts, radii, and shadows exactly.
- **Bespoke pieces** (landing hero, wizard flow) are page *compositions* you rebuild from
  cascivo layout primitives — no new components required.

---

## 1. Architecture parity — why this is easy

| Concern | pagome | cascivo | Port effort |
| --- | --- | --- | --- |
| Token system | `--pagome-*` semantic CSS vars | `--cascivo-*` semantic CSS vars | Map names |
| Theming | `[data-theme]` + `prefers-color-scheme` | `[data-theme]` + `@layer cascivo.theme` | Same mechanism |
| Dark mode | `[data-theme=dark]` / media query | `[data-theme=dark]` theme file | Same |
| Button variants | `primary/secondary/ghost/destructive` | `primary/secondary/ghost/destructive` | 1:1 |
| Button sizes | `sm/md/lg`, `full` | `sm/md/lg` (+ `style={{ width: '100%' }}`) | 1:1 |
| Breakpoints | **none** (fully fluid, single column) | canonical `sm/md/lg/xl` scale | No conflict |

---

## 2. Component mapping (pagome class → cascivo)

| pagome class | cascivo export | Import |
| --- | --- | --- |
| `.pg-btn` (+ variants/sizes) | `Button` | `@cascivo/react` |
| `.pg-badge` (`default/success/warning/error`) | `Badge` | `@cascivo/react` |
| `.pg-input` (+ `--mono/error/valid`, slots) | `Input` | `@cascivo/react` |
| `.pg-field` `.pg-label` `.pg-helper` `.pg-error-msg` | `Field` (+ `Label`) | `@cascivo/react` |
| `.pg-spinner` (`sm/md/lg`) | `Spinner` | `@cascivo/react` |
| `.pg-sheet` `.pg-sheet-backdrop` `.pg-wizard-sheet` | `Sheet` | `@cascivo/react` |
| `.pg-wizard-profile-menu` | `Menu` / `MenuTrigger` / `MenuItem` | `@cascivo/react` |
| `.pg-wizard-dots` (step dots) | `ProgressIndicator` | `@cascivo/react` |
| `.pg-wizard-qr-canvas` | `QrCode` | `@cascivo/react` |
| `.pg-landing-*`, `.pg-wizard-*` (hero/steps/facts/footer/summary) | `Section` / `Center` / `Stack` + above | `@cascivo/layouts` |

---

## 3. Implementation plan

Each step states a **verify** check (per the project's goal-driven convention).

```
Phase 0 — Scaffold
  1. Vite + React app, install @cascivo/react @cascivo/layouts @cascivo/themes
     → verify: app boots, `import '@cascivo/react/styles.css'` resolves
  2. Add the `pagome` theme file + set <html data-theme>
     → verify: background/foreground match #fafaf8 / #1c1917 in light, dark flips

Phase 1 — Design system parity (no UI yet)
  3. Author packages-local `pagome.css` token overrides (Recipe 1)
     → verify: computed --cascivo-color-accent === #047857 (light)
  4. Self-host DM Sans + DM Mono, point font tokens at them (Recipe 2)
     → verify: body renders in DM Sans, .mono inputs in DM Mono
  5. Add the one missing type token (--cascivo-text-4xl) + radius/shadow map
     → verify: hero heading is 2.375rem; button radius is 10px

Phase 2 — Primitive swap (visual diff should stay ~0)
  6. Buttons → <Button>          → verify: side-by-side matches at sm/md/lg + full
  7. Inputs/labels → <Field><Input/> → verify: focus ring, error, mono slot match
  8. Badges → <Badge>           → verify: success/warning/error colors match
  9. Spinner, Sheet, Menu, QrCode swaps → verify: each recipe below

Phase 3 — Page composition
 10. Landing (hero/steps/facts/footer) via Section/Center/Stack (Recipe 11)
     → verify: layout + spacing match at 320/390/768/1280
 11. Wizard flow (sheet + step dots + summary + QR) (Recipe 9–10)
     → verify: full happy-path generates identical QR + URL box

Phase 4 — Sign-off
 12. Visual regression: overlay screenshots, light + dark, 4 widths
     → verify: pixel diff within antialiasing tolerance; a11y + keyboard pass
```

---

## 4. Recipes

### Recipe 1 — The `pagome` theme (the heart of design preservation)

cascivo themes live in `@layer cascivo.theme` and override the **semantic** token layer
only. Use pagome's exact hex values so color parity is pixel-identical (cascivo's own
themes use OKLCH by convention, but the custom-property layer accepts any color syntax).

`src/theme/pagome.css`:

```css
/* pagome — design-preserving cascivo theme. Values lifted verbatim from
   pagome.com /assets/index-*.css so the look is unchanged. */
@import '@cascivo/tokens';

@layer cascivo.theme {
  [data-theme='pagome'],
  [data-theme='pagome-light'] {
    color-scheme: light;

    /* ── Surface / text ── */
    --cascivo-color-background: #fafaf8;
    --cascivo-color-foreground: #1c1917;
    --cascivo-color-surface: #ffffff;
    --cascivo-color-surface-2: #f5f4f2;
    --cascivo-color-text: #1c1917;
    --cascivo-color-text-muted: #78716c;
    --cascivo-color-text-subtle: #78716c;
    --cascivo-color-border: #e7e5e4;
    --cascivo-border-default: #e7e5e4;
    --cascivo-border-strong: #d6d3d1;

    /* ── Accent (emerald) ── */
    --cascivo-color-accent: #047857;
    --cascivo-color-accent-foreground: #ffffff;
    --cascivo-color-accent-hover: #065f46;
    --cascivo-color-accent-active: #065f46;
    --cascivo-color-accent-subtle: #ecfdf5;
    --cascivo-color-accent-muted: #d1fae5;
    --cascivo-color-primary: #047857;
    --cascivo-color-primary-fg: #ffffff;
    --cascivo-color-primary-hover: #065f46;

    /* ── Status ── */
    --cascivo-color-error: #dc2626;
    --cascivo-color-error-content: #ffffff;
    --cascivo-color-destructive: #dc2626;
    --cascivo-color-destructive-subtle: #fef2f2;

    /* ── Typography (DM Sans / DM Mono — see Recipe 2) ── */
    --cascivo-font-sans: 'DM Sans Variable', 'DM Sans', system-ui, sans-serif;
    --cascivo-font-mono: 'DM Mono', 'Courier New', monospace;
    --cascivo-font-display: var(--cascivo-font-sans);
    --cascivo-text-4xl: 2.375rem; /* pagome hero size; cascivo tops out at 3xl */

    /* ── Radii (pagome: 6/10/14/20) ── */
    --cascivo-radius-control: 10px; /* buttons, inputs */
    --cascivo-radius-input: 10px;
    --cascivo-radius-button: 10px;
    --cascivo-radius-surface: 14px; /* cards */
    --cascivo-radius-card: 14px;
    --cascivo-radius-modal: 20px; /* sheets / overlays */
    --cascivo-radius-indicator: 6px;
    --cascivo-radius-badge: 9999px;
    --cascivo-radius-full: 9999px;

    /* ── Shadows ── */
    --cascivo-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
    --cascivo-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);

    /* ── Focus ring (accent) ── */
    --cascivo-ring-color: color-mix(in srgb, #047857 45%, transparent);
  }

  [data-theme='pagome-dark'] {
    color-scheme: dark;
    --cascivo-color-background: #171412;
    --cascivo-color-foreground: #f5f4f2;
    --cascivo-color-surface: #211d1a;
    --cascivo-color-surface-2: #1c1917;
    --cascivo-color-text: #f5f4f2;
    --cascivo-color-text-muted: #a8a29e;
    --cascivo-color-text-subtle: #a8a29e;
    --cascivo-color-border: #292524;
    --cascivo-border-default: #292524;
    --cascivo-border-strong: #44403c;

    --cascivo-color-accent: #34d399;
    --cascivo-color-accent-foreground: #0f2419;
    --cascivo-color-accent-hover: #10b981;
    --cascivo-color-accent-active: #10b981;
    --cascivo-color-accent-subtle: #064e3b;
    --cascivo-color-accent-muted: #065f46;
    --cascivo-color-primary: #34d399;
    --cascivo-color-primary-fg: #0f2419;

    --cascivo-color-error: #f87171;
    --cascivo-color-destructive: #f87171;
    --cascivo-color-destructive-subtle: #450a0a;
  }
}
```

Wire it in `main.tsx` (order matters — tokens/base first, theme last):

```ts
import '@cascivo/react/styles.css'   // component CSS (layer: cascivo.component)
import '@cascivo/themes/base.css'    // root font + bg/fg
import './theme/pagome.css'          // our overrides (layer: cascivo.theme)
```

Then mirror pagome's runtime theme switch (it toggles `data-theme` + honors
`prefers-color-scheme`):

```ts
const mq = window.matchMedia('(prefers-color-scheme: dark)')
const apply = () =>
  document.documentElement.setAttribute(
    'data-theme',
    localStorage.theme ?? (mq.matches ? 'pagome-dark' : 'pagome'),
  )
apply()
mq.addEventListener('change', apply)
```

**Verify:** `getComputedStyle(document.documentElement).getPropertyValue('--cascivo-color-accent')`
returns `#047857` in light and `#34d399` in dark.

---

### Recipe 2 — Self-host DM Sans + DM Mono

pagome preloads `dm-sans-*.woff2`. Reuse the same `@fontsource` packages so glyphs match.

```sh
npm i @fontsource-variable/dm-sans @fontsource/dm-mono
```

```ts
// main.tsx
import '@fontsource-variable/dm-sans'
import '@fontsource/dm-mono/400.css'
import '@fontsource/dm-mono/500.css'
```

The font *tokens* are already pointed at these families in Recipe 1, so every component
inherits them automatically. **Verify:** body computed `font-family` starts with `"DM Sans Variable"`.

---

### Recipe 3 — Buttons (`.pg-btn` → `Button`)

```tsx
import { Button } from '@cascivo/react'

// .pg-btn .pg-btn--primary .pg-btn--lg .pg-btn--full
<Button variant="primary" size="lg" style={{ width: '100%' }}>
  Generate link
</Button>

// .pg-btn--secondary / --ghost / --destructive map 1:1
<Button variant="ghost" size="sm">Back</Button>
```

`ButtonProps` = `variant?: 'primary'|'secondary'|'ghost'|'destructive'`, `size?: 'sm'|'md'|'lg'`,
plus all native `<button>` attributes. There is no `full` prop — pagome's `--full` is just
`width:100%`, applied via `style`. (pagome's `--pulse` animation is decorative; add a one-line
keyframe in app CSS if you want it.)

**Verify:** overlay a primary lg button against the live site — fill `#047857`, radius `10px`,
height `56px` all match.

---

### Recipe 4 — Inputs & fields (`.pg-input` / `.pg-field` → `Field` + `Input`)

`Field` owns the label/description/error wiring; `Input` is the control. `Input` also accepts
`label`/`hint`/`error` directly, but use `Field` to mirror pagome's `.pg-field` grouping.

```tsx
import { Field, Input } from '@cascivo/react'

<Field label="IBAN" error={ibanError} required>
  <Input
    inputMode="text"
    placeholder="DE00 0000 0000 0000 0000 00"
    className="mono"          /* mirror .pg-input--mono via --cascivo-font-mono */
    aria-invalid={!!ibanError}
  />
</Field>
```

`InputProps` extends native input (minus `size`) with `label?`, `hint?`, `error?`,
`size?: 'sm'|'md'|'lg'`. For pagome's left/right slot icons (`.pg-input-slot--left/right`),
wrap with `InputGroup` (exported from `@cascivo/react`). The mono variant is just the mono
font token — add `.mono { font-family: var(--cascivo-font-mono) }` or pass it through.

**Verify:** focus a field — ring color is emerald, error state borders `#dc2626`, helper text
is muted `#78716c`.

---

### Recipe 5 — Badges (`.pg-badge` → `Badge`)

```tsx
import { Badge } from '@cascivo/react'

<Badge variant="success">Paid</Badge>     {/* .pg-badge--success */}
<Badge variant="warning">Pending</Badge>  {/* .pg-badge--warning */}
<Badge variant="destructive">Failed</Badge>{/* .pg-badge--error   */}
<Badge variant="default">SEPA</Badge>     {/* .pg-badge--default */}
```

`BadgeProps`: `variant?: 'default'|'secondary'|'success'|'warning'|'destructive'|'outline'`,
`size?: 'sm'|'md'`. (pagome's `error` ≙ cascivo `destructive`.)

---

### Recipe 6 — Spinner (`.pg-spinner` → `Spinner`)

```tsx
import { Spinner } from '@cascivo/react'
<Spinner size="md" label="Generating…" />
```

`SpinnerProps`: `size?: 'sm'|'md'|'lg'`, `label?`. pagome's color modifiers
(`--accent/--muted/--current`) become `style={{ color: 'var(--cascivo-color-accent)' }}` since
the spinner inherits `currentColor`.

---

### Recipe 7 — Bottom sheet (`.pg-sheet` / `.pg-wizard-sheet` → `Sheet`)

```tsx
import { Sheet } from '@cascivo/react'

<Sheet open={open} onClose={() => setOpen(false)} title="Payment details" side="end">
  {/* wizard contents */}
</Sheet>
```

`SheetProps`: `open`, `onClose`, `title?`, `children`, `side?: 'start'|'end'`. pagome's sheet
slides from the bottom on mobile; cascivo's `side` is inline-axis. If you need pagome's exact
bottom-sheet slide + top-rounded corners, that's a CSS detail — override
`--cascivo-radius-modal` (already 20px) and, if a true bottom anchor is required, use `Drawer`
(also exported) or a thin app-CSS rule. Note its API drives off the `open` **prop** (no internal
FSM), consistent with the project's controlled-overlay rule.

---

### Recipe 8 — Profile menu (`.pg-wizard-profile-menu` → `Menu`)

```tsx
import { Menu, MenuTrigger, MenuItem, MenuSeparator } from '@cascivo/react'

<Menu>
  <MenuTrigger aria-label="Profile">⋯</MenuTrigger>
  <MenuItem onSelect={editProfile}>Edit profile</MenuItem>
  <MenuItem onSelect={clearData}>Clear saved data</MenuItem>
  <MenuSeparator />
  <MenuItem onSelect={toggleTheme}>Toggle theme</MenuItem>
</Menu>
```

`MenuItem` takes `onSelect`, `disabled`. Keyboard + focus management is built in.

---

### Recipe 9 — QR code (`.pg-wizard-qr-canvas` → `QrCode`)

cascivo ships a dependency-free QR renderer — encode the same EPC/GiroCode payload pagome builds.

```tsx
import { QrCode } from '@cascivo/react'

<QrCode
  value={girocodePayload}   /* the EPC QR string */
  size={220}
  errorCorrection="M"
  radius="14px"             /* matches pagome's rounded canvas */
  fill="var(--cascivo-color-foreground)"
  background="var(--cascivo-color-surface)"
/>
```

`QrCodeProps`: `value`, `size?` (px, default 128), `errorCorrection?`, `radius?`, `fill?`,
`background?`, `label?`. Defaults inherit `currentColor`, so it auto-themes for dark mode.

**Verify:** scan the generated code with a banking app — it pre-fills the same IBAN/amount/reference
as the live site.

---

### Recipe 10 — Wizard step dots (`.pg-wizard-dots` → `ProgressIndicator`)

```tsx
import { ProgressIndicator } from '@cascivo/react'
<ProgressIndicator current={step} total={3} />
```

Drives the `.pg-wizard-dot--active` state. If you want pagome's exact dot styling, override the
indicator's tokens — no component change.

---

### Recipe 11 — Landing composition (`.pg-landing-*` → layout primitives)

The hero/steps/facts/footer are page-specific compositions, not components. Build them from
`@cascivo/layouts`:

```tsx
import { Section, Center, Stack } from '@cascivo/layouts'
import { Button } from '@cascivo/react'

// .pg-landing-hero
<Section width="content" gap={8}>
  <Center maxWidth="40rem">
    <Stack gap={6} align="center">
      <h1 style={{ fontSize: 'var(--cascivo-text-4xl)' }}>
        SEPA payment links in seconds
      </h1>
      <p className="sub">No account, no app — your IBAN never leaves your device.</p>
      <Stack direction="horizontal" gap={3} justify="center">  {/* .pg-landing-hero-actions */}
        <Button variant="primary" size="lg">Create a link</Button>
        <Button variant="ghost" size="lg">How it works</Button>
      </Stack>
    </Stack>
  </Center>
</Section>
```

- `Section`: `width?: 'content'|'wide'|'full'`, `gap?: SpaceStep` (`content` = 72rem max).
- `Center`: `maxWidth?` (default `48rem`).
- `Stack`: `direction?`, `gap?`, `align?`, `justify?`, `wrap?`.

The `.pg-landing-steps` / `.pg-landing-facts` grids map to `Grid` / `AutoGrid` from
`@cascivo/layouts`. The footer is a `Section width="full"` with a `Stack`.

---

## 5. Token mapping reference

| pagome token | cascivo token | Note |
| --- | --- | --- |
| `--pagome-bg` | `--cascivo-color-background` | exact hex |
| `--pagome-fg` | `--cascivo-color-foreground` | exact hex |
| `--pagome-surface` / `-alt` | `--cascivo-color-surface` / `-2` | exact |
| `--pagome-muted` | `--cascivo-color-text-muted` | exact |
| `--pagome-border` / `-strong` | `--cascivo-color-border` / `--cascivo-border-strong` | exact |
| `--pagome-accent*` | `--cascivo-color-accent*` / `-primary*` | exact emerald |
| `--pagome-error` / `-subtle` | `--cascivo-color-error` / `--cascivo-color-destructive-subtle` | exact |
| `--pagome-font-sans` / `-mono` | `--cascivo-font-sans` / `-mono` | DM Sans / DM Mono |
| `--pagome-text-xs … 4xl` | `--cascivo-text-xs … 4xl` | add `4xl` (2.375rem) |
| `--pagome-space-1 … 20` | `--cascivo-space-*` scale | matches |
| `--pagome-radius-sm/md/lg/xl` (6/10/14/20) | `--cascivo-radius-indicator/control/surface/modal` | map per Recipe 1 |
| `--pagome-shadow-sm/md` | `--cascivo-shadow-sm/md` | exact |
| `--pagome-duration-*` / `-ease` | `--cascivo-duration-*` / motion tokens | near-match; override if needed |

---

## 6. Gaps & gotchas

1. **Not zero-config.** Out of the box cascivo is blue + system font + tighter radii. Design
   parity *requires* the `pagome` theme in Recipe 1. That's the supported path and touches no
   component code — but it is real work, not a drop-in.
2. **`--cascivo-text-4xl` doesn't exist by default** — pagome's hero uses `2.375rem`. Add the
   token (done in Recipe 1) or set the hero font-size inline.
3. **Bottom-sheet anchor.** cascivo `Sheet.side` is inline-axis. pagome's mobile sheet slides
   from the bottom with top-rounded corners; reproduce with `Drawer` or a small app-CSS rule.
   This is the only place where exact motion may need a few lines of CSS.
4. **`Button` has no `full`/`pulse`.** `full` = `style={{ width:'100%' }}`; `pulse` is a decorative
   keyframe to add in app CSS if desired.
5. **Decorative wizard micro-interactions** (`.pg-wizard-checkmark` draw-on, `.pg-qr-enter`
   keyframe) are page flourishes, not library concerns — port the keyframes as-is into app CSS.
6. **Motion durations differ slightly** (pagome `.1/.16/.22s`); override `--cascivo-duration-*`
   if you want them identical.

---

## 7. Verification checklist (definition of done)

- [ ] `--cascivo-color-accent` resolves to `#047857` (light) / `#34d399` (dark).
- [ ] Body renders in DM Sans; mono inputs in DM Mono.
- [ ] Primary `lg` button: fill `#047857`, radius `10px`, height `56px`.
- [ ] Field focus ring is emerald; error border `#dc2626`; helper text `#78716c`.
- [ ] Badge success/warning/error colors match the live site.
- [ ] Generated GiroCode scans to the same payment in a banking app.
- [ ] Light + dark, at 320 / 390 / 768 / 1280 — screenshot overlay diff within AA tolerance.
- [ ] Keyboard nav + WCAG AA pass (cascivo components ship this; verify the compositions).

---

### Source of truth

Design tokens above are lifted verbatim from `https://pagome.com/assets/index-*.css`
(retrieved 2026-06-20). Component APIs are from this repo: `packages/components/src/*`,
`packages/layouts/src/*`, `packages/themes/src/warm.css` (template for Recipe 1).
