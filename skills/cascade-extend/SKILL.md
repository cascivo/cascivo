---
name: cascade:extend
description: Scaffold a new component in a user project following cascade authoring rules — signals not hooks, tokens-only CSS, FSM only when justified.
---

# cascade:extend

## When to use

The user wants to create a new component that follows cascade's authoring conventions (signals, CSS tokens, a11y) but doesn't exist in the registry — e.g. a custom `FileUpload`, `ColorPicker`, or `RatingStars`.

## Procedure

### 1. Read the authoring rules

Before writing any code, read the authoring rules at runtime:

- Fetch `https://cascade-ui.dev/llms.txt` (or local `apps/docs/public/llms.txt`) and locate the "Component authoring rules" section.

Internalise and strictly follow those rules throughout this skill. Never use `useState`, `useEffect`, `useContext`, `useLayoutEffect`, or `useReducer`.

### 2. Fetch a reference component

Pick the most structurally similar component from the registry. For interactive components, `button` is a good reference. For disclosure components, `accordion`. For overlay, `modal`.

Read the reference component's `/llms/<name>.md` file for its structure, then fetch its source files from the registry entry's `files` URLs. This gives you the four-file pattern to follow:

- `<name>.tsx` — component + export
- `<name>.module.css` — CSS custom properties + layer rules
- `<name>.meta.ts` — ComponentMeta manifest
- `<name>.test.tsx` — unit + interaction tests

### 3. Clarify the component spec

Ask the user for:

- Component name (PascalCase)
- Purpose (one sentence)
- Props (name, type, required/optional, default)
- Visual variants (if any)
- Sizes (if any)
- States that CSS pseudo-classes cannot express (e.g. `loading`, `error`, `uploading`) — only these get `data-state` attributes
- Keyboard interactions required
- Any brand tokens to expose

### 4. Scaffold the four files

Create the files at the user's chosen location (e.g. `src/components/<name>/`).

**`<name>.tsx`**

- `'use client'` at the top (RSC compatibility)
- Import `useSignal`, `useComputed`, `useSignalEffect` from `@cascade-ui/core` — not React hooks
- Use `useRef<HTMLElement>(null)` only for DOM element references
- Use `useMachine` only if the component itself drives transitions (user interaction inside the component causes state changes — not external props)
- Sync controlled props into signals during render: `signal.value = prop`
- DOM side effects via `useSignalEffect`, never `useEffect`
- `data-state` attribute only for non-CSS-expressible states
- Logical CSS properties in className / style (none — all styling in the CSS module)

**`<name>.module.css`**

- `@layer cascade.component { … }` wrapping all rules
- All values from CSS custom properties: `--cascade-<component>-<property>`
- Default values reference semantic tokens: `var(--cascade-color-accent)`
- Hover/focus/active/disabled via CSS pseudo-classes only — no JS tracking
- RTL via logical properties: `margin-inline-start`, `padding-block`, etc.
- Motion: `@media (prefers-reduced-motion: reduce)` wrapping all transitions

**`<name>.meta.ts`**

Fill in the `ComponentMeta` shape (name, description, category, states, variants, sizes, props, tokens, accessibility, examples, dependencies, tags).

**`<name>.test.tsx`**

- Render test (snapshot or existence check)
- Interaction test for each keyboard key listed in accessibility.keyboard
- Controlled prop test (if applicable)
- No timing-dependent assertions

### 5. Authoring rules checklist (verify before presenting)

- [ ] No `useState`, `useContext`, `useEffect`, `useLayoutEffect`, `useReducer` anywhere
- [ ] Every machine transition is reachable by code inside the component (not only by external props)
- [ ] DOM side effects use `useSignalEffect`, not `useEffect`
- [ ] All styling in the CSS module — no inline styles, no Tailwind classes
- [ ] Visual states (hover/focus/active/disabled) handled by CSS pseudo-classes only
- [ ] `data-state` used only for states CSS cannot express
- [ ] RTL-safe: logical CSS properties throughout
- [ ] Motion: transitions wrapped in `prefers-reduced-motion: reduce`
- [ ] WCAG 2.1 AA: role, keyboard interactions, focus visible

### 6. Present the result

Show each generated file. Tell the user how to import and use the component, and remind them to add it to their local component index if they have one.
