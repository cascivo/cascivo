# AI components — research, inventory and plan

**Status: Phases 1 and 2 shipped (2026-10-05).** Phases 3–4 are proposals and need sign-off.

**Motivation:** most design systems now ship a recognisable "AI vocabulary": a provenance label,
a tinted AI skeleton, a shimmering "Thinking…" label, a reasoning disclosure and a step/tool
chain. cascivo calls itself AI-first, but its catalogue has none of these as registry
components. The `@cascivo/ai` npm package ships four (`StreamingText`, `AiLabel`, `Terminal`,
`AiChat`). They have no manifests, so the MCP server, `registry.json`, `llms.txt`, the CLI and
the generated docs cannot see them. An agent that can't find a primitive builds a worse one by
hand.

**Outcome:** a set of small AI **registry** components, each with a manifest, in
`@cascivo/react`, and copyable with `cascivo add`. They start with the components that show
work **in progress**, which is the ask that started this. Every one follows one accessibility
contract (§3) that most of the surveyed systems don't meet.

---

## 1. Research summary

Surveyed in shipped source where possible: Carbon (`@carbon/react`, `@carbon/ai-chat`), Vercel
AI Elements, prompt-kit, assistant-ui, Fluent Copilot (`@fluentui-copilot/*`), PatternFly
Chatbot, Ant Design X, GitLab Duo UI. Surveyed from docs: Atlassian Rovo UI, AWS Cloudscape
gen-AI patterns. Low-confidence (docs would not render): SLDS 2, Material/Gemini, Polaris.

### 1.1 Concepts found in three or more systems

| #   | Concept                                                                           | Where                                                                       |
| --- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1   | **Text-shimmer status label** ("Thinking…")                                       | AI Elements `Shimmer`, prompt-kit `TextShimmer`, assistant-ui, Ant X `blink`, Gemini |
| 2   | **Loader / typing dots** in the message slot                                      | nearly all                                                                  |
| 3   | **Reasoning disclosure**: auto-opens while streaming, closes after, "Thought for Ns" | Carbon AI Chat, AI Elements, prompt-kit, assistant-ui, Ant X `Think`        |
| 4   | **Step / status chain** (pending → active → complete / error)                     | Carbon, AI Elements (CoT, Plan, Task), prompt-kit, assistant-ui, Ant X `ThoughtChain`, GitLab |
| 5   | **Tool-call card** with lifecycle states and approval                             | AI Elements `Tool`/`Confirmation`, GitLab, assistant-ui, prompt-kit         |
| 6   | **Sources / citations**                                                           | AI Elements, PatternFly, Ant X, Fluent, GitLab, SLDS                        |
| 7   | **Stop / skip generation** control                                                | Carbon, Fluent `LatencyCancel`, prompt-kit `ThinkingBar` "Answer now", AI Elements |
| 8   | **"May be incorrect" disclaimer**                                                 | Fluent, SLDS, Gemini, Carbon (popover)                                      |
| 9   | **AI presence surface** (gradient border / aura)                                  | Carbon aura and border, Rovo generative border, Copilot flair, Gemini glow  |
| 10  | **AI provenance marker** (sparkle glyph or "AI" pill)                             | Carbon `AILabel`, Cloudscape, SLDS, Fluent, Rovo, Polaris icons             |
| 11  | Prompt input, suggestions / starters, feedback actions                            | universal                                                                   |

Unique to one system, and worth copying: Carbon's **AI skeleton** and **revert-to-AI** state;
Rovo's rule that an animated border **means generation is in progress**, never decoration;
Fluent's announcement state machine; Cloudscape's split between **processing** (nothing yet)
and **generation** (streaming), and its rule to show no loader for work under one second.

### 1.2 What the surveyed systems get wrong (and we must not)

- **Reduced motion.** AI Elements `Shimmer`, prompt-kit `TextShimmer`, Ant X `blink` and Rovo's
  border have no guard. Carbon has a guard on the AI skeleton, but a later rule of equal
  specificity overrides it in the compiled CSS, so the shimmer keeps running.
- **Nothing is announced.** prompt-kit's loaders have sr-only text but no `role="status"`. GitLab's
  rotating "finding / working on / generating" verbs are visual only.
- **Every token is announced.** PatternFly's default `isLiveRegion` puts `aria-live` on the
  streaming message itself.
- **Colour as the only signal.** A gradient or sparkle means nothing to a screen reader. Carbon
  is the exception: it builds the accessible name as "AI Show information".

### 1.3 Visual language

- Blue → violet is the industry default (Carbon, Copilot, Gemini). Rovo is the deliberate
  outlier: flat hues with hard stops.
- Text shimmer: muted base colour, a brighter band of 20–45% width, 1–4 s, linear, infinite.
- AI skeleton: a blue tint plus a tinted sweep, slightly faster than the neutral skeleton.
- Restraint: a **static** tint marks AI *content*; an **animated** treatment marks AI
  *activity* and stops when generation ends.

---

## 2. Inventory: what cascivo has today

| Need                         | Today                                                      | Gap                                                                       |
| ---------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| Neutral skeleton             | `Skeleton` (registry)                                      | no AI tint                                                                |
| Inline async status          | `InlineLoading` (registry): spinner, success, error        | no processing/generating split, no stop                                   |
| Spinner                      | `Spinner` (registry)                                       | —                                                                         |
| Typing dots                  | the `cascivo-dots` keyframe in `motion.css`                | **nothing uses it**                                                       |
| Generation status pill       | `@cascivo/ai` `AiLabel` (generating/done/error)            | npm-only, no manifest; the name clashes with Carbon's (different) concept |
| Streaming text, terminal, chat | `@cascivo/ai` `StreamingText`, `Terminal`, `AiChat`      | npm-only, no manifest                                                     |
| Chat bubble                  | `ChatBubble` (registry)                                    | —                                                                         |
| Steps / timeline             | `Steps`, `ProgressIndicator`, `Timeline` (registry)        | no AI step chain                                                          |
| Disclosure                   | `Collapsible`, `Accordion` (FSM, `clientJs: 'required'`)   | no reasoning disclosure                                                   |
| Popover info                 | `Toggletip` (registry)                                     | —                                                                         |
| Sparkle icon                 | `@cascivo/icons` `Sparkle` (+7 variants)                   | registry components inline their glyphs                                   |
| AI colour                    | brand gradient tokens only (`--cascivo-brand-gradient-*`) | **no semantic AI tokens**                                                 |

---

## 3. Accessibility contract (applies to every component below)

1. **Render separately from announcing.** No component puts `aria-live` on streaming text. A
   status component announces **transitions** (thinking → generating → done / error), not
   tokens. Its live text is one stable string per status.
2. **`aria-busy`** on the region whose content is still arriving, cleared on completion.
3. **Decorative motion is decoration.** Shimmer, dots, sparkle and sweep are `aria-hidden`
   or purely stylistic. Every loop sits inside `@media (prefers-reduced-motion: no-preference)`
   (`reduced-motion:check`), and the resting state reads correctly on its own.
4. **Provenance goes in the accessible name.** The "AI" marker's name starts with its visible
   text (WCAG 2.5.3 Label in Name).
5. **Forced colours.** Gradients and tints fall back to system colours (`CanvasText`,
   `Highlight`). No information is lost.
6. **Stop is a real button**, reachable by keyboard, outside the live region so pressing it
   doesn't re-announce the status.

---

## 4. Design decisions

- **Registry, not `@cascivo/ai`.** New components go in `packages/components/src/` with
  manifests and ship through `@cascivo/react`. That is where every AI surface (MCP,
  `registry.json`, llms, docs, the CLI) already looks. `@cascivo/ai` is left untouched in
  Phase 1; §6 Phase 4 covers converging it.
- **Category.** `ComponentMeta.category` is a closed union with no `ai` value, and adding one
  ripples through generators and checks. Each component takes its natural category
  (`feedback` / `display`) and the tag **`ai`**. A dedicated docs category can follow later if
  wanted.
- **AI tokens are defined once, in `@cascivo/tokens`.** This keeps theme token parity, the
  same way the editor tokens do it, and a theme can still override them.
  - `--cascivo-color-ai`: one blue-violet (`oklch(0.6 0.2 285)`), mixed 20% toward the
    *lightness* of the theme's text colour. That makes it darker on light themes and brighter
    on dark ones, at the same hue everywhere. It clears AA as text on all twelve backgrounds
    (5.1–6.5:1).
  - `--cascivo-color-ai-subtle`, `-ai-border` and `-ai-sheen`: translucent steps of that hue,
    at 10%, 40% and 22%.
  - Rejected first attempt: deriving the hue from each theme's accent. `minimal`'s near-black
    accent came out maroon, and `warm`'s amber came out pink.
  - Rejected second attempt: tinting with `color-mix` toward the background in `oklch`. That
    swung the hue through the background's meaningless hue and came out peach. Building this
    also turned up the same powerless-hue bug in `@cascivo/email`'s palette resolver, which is
    fixed.
  - Mixing in one flat block, with no per-theme selector, is deliberate. The email palette
    resolver reads token CSS as one flat stream, so a dark-only selector would leak into every
    light palette.
- **AI skeleton is a prop, not a component.** `<Skeleton ai />` keeps one placeholder with one
  set of shapes. `AiSkeleton` is registered as an alias so searches for Carbon's name land
  here. `variant` is already taken by shape, so this is a boolean.
- **No `AiLabel` in the registry.** That name already means "generation status pill" in
  `@cascivo/ai`. Carbon's provenance marker becomes **`AiBadge`**, and the processing status
  becomes **`AiStatus`**. Two distinct names, no silent clash for anyone importing both packages.
- **`Reasoning` is built on `<details>`.** Open and closed state exists at first paint, it works
  with JS off, and find-in-page can expand it. This is the native-first direction set in
  `details-disclosure-plan.md`. It opens while `streaming` and closes when streaming ends. A
  reader who opens it afterwards is left alone.
- **No timers inside components.** Elapsed time ("Thought for 12 seconds") is a prop. The
  caller owns the clock, which keeps the components deterministic and server-renderable.
- **Text shimmer animates `background-position`.** No compositor-only way exists to sweep a
  gradient *through glyphs*. The new keyframe documents this as a deliberate exception, the
  same as `cascivo-flash`. It is bounded because it only runs on a short label while work is
  in progress.

---

## 5. Component specs: Phase 1 (processing; implementing now)

### 5.1 AI tokens (`@cascivo/tokens`)

As listed in §4. They are defined in `packages/tokens/src/index.css` next to the brand tokens,
and catalogued by `pnpm regen`.

### 5.2 `ShimmerText` (feedback, `clientJs: 'none'`)

A label whose text a bright band sweeps across: the "Thinking…" look.

- Props: `children`, `as` (`'span' | 'p' | 'div'`, default `span`), plus HTML attributes.
- The band is `--cascivo-color-ai`, which is never weaker than the muted base it sweeps over,
  so the sweep never lowers contrast.
- With reduced motion it is plain muted text. In forced colours it is `CanvasText`.
- It is not a live region. It is a visual treatment used inside one (`AiStatus`, `Reasoning`).

### 5.3 `Skeleton` gains `ai` (display, stays `clientJs: 'none'`)

- `ai?: boolean` sets `data-ai`. The bars take `--cascivo-color-ai-subtle`, and the sheen is
  tinted with `--cascivo-color-ai-sheen`.
- The shapes are unchanged, and it stays `aria-hidden`. The surrounding region should carry
  `aria-busy` or an `AiStatus`.

### 5.4 `AiStatus` (feedback, `clientJs: 'enhancement'`)

The "AI is working" line. Covers Carbon's processing label, prompt-kit's `ThinkingBar` and
Cloudscape's two phases.

- `status`: `'thinking' | 'generating' | 'complete' | 'error' | 'stopped'`.
  - `thinking` / `generating`: a sparkle glyph plus `ShimmerText` label.
  - `complete`: a check.
  - `error`: an alert glyph.
  - `stopped`: a neutral glyph.
- `label?: ReactNode` overrides the text; `labels?` overrides each status's default.
  Defaults: "Thinking…", "Generating a response…", "Done", "Something went wrong", "Stopped".
- `onStop?: () => void` renders a **Stop** button while the status is `thinking` or
  `generating`. Its label comes from `labels.stop`.
- A11y:
  - The label sits in a `role="status"` node, so each status change is announced once.
  - The glyph is `aria-hidden`.
  - The Stop button sits outside the status node.
- Why `enhancement`: the status renders and announces with no JS; only Stop needs it.

### 5.5 `TypingIndicator` (feedback, `clientJs: 'none'`)

Three bouncing dots for a message slot that is still processing. It finally uses the shipped
`cascivo-dots` keyframe.

- Props: `ariaLabel` (accessible name, default "Assistant is typing"), with `label` as an alias.
- Renders `role="status"` with the name; the dots are `aria-hidden`.
- With reduced motion it shows three static dots, which still read as an ellipsis.

### 5.6 `Reasoning` (display, `clientJs: 'none'`)

A collapsible "chain of thought" panel.

- `<details>` and `<summary>`. While `streaming` the summary reads "Thinking…" in
  `ShimmerText`. Afterwards it reads "Thought for {count} seconds" when `duration` is given,
  else "Reasoning". `label` overrides both, and `labels` localises them.
- `open` follows `streaming`: it opens when streaming starts and closes when it ends.
- The content region carries `aria-busy` while streaming. Nothing in it is a live region.

### 5.7 `AiBadge` (display, `clientJs: 'required'` when it has content, otherwise static)

The provenance marker, Carbon's AI label: a small "AI" pill in the AI tint.

- With `children`, the pill is a `Toggletip` trigger whose popover explains the AI involvement
  (model, sources, confidence). The accessible name is "AI – {labels.explain}", so it starts
  with the visible text.
- Without `children` it renders a static marker, `<span>` "AI", whose name expands through
  `labels.description` ("AI-generated").
- `labels`: `text` (default "AI"), `explain` (default "Show AI explanation"), `description`.

Each component gets a manifest with a full `intent`, tests, an `@cascivo/react` export, a site
demo, visual baselines, i18n keys (en + de) under `builtin.ai*`, and a changeset.

---

## 6. Later phases (proposed, not started)

### Phase 2: agentic progress (shipped)

- **`ChainOfThought`** (display, `clientJs: 'none'`): an ordered list of agent steps.
  - It is a separate component rather than a `Timeline` variant. Timeline is a dated activity
    feed. The chain needs a shimmering active title, a status spoken after each title, an
    optional per-step `<details>` disclosure, and `aria-busy` on the list while a step is
    active.
  - It does reuse the catalogue's `Progress` vocabulary (`pending | active | complete | error`,
    plus `current` / `upcoming`) and `normalizeProgress`, so one enum drives Timeline, Steps
    and the chain.
  - It has no `stopped` status. Adding one would fork that shared vocabulary. After a Stop, a
    step that never ran stays `pending`, and the overall outcome is reported by
    `AiStatus status="stopped"`.
  - Named after Vercel's and Carbon's term. `ThoughtChain` (Ant X), `AgentSteps` and
    `ReasoningSteps` are aliases.
- **`ToolCall`** (display, `clientJs: 'none'`): a card for one invocation.
  - It shows the tool name in monospace and a `Badge` status, toned by lifecycle. The six
    statuses map onto the AI SDK tool-part states: `pending`, `running`, `awaiting-approval`,
    `complete`, `error` and `denied`.
  - Input, output and error sit in a native `<details>` that opens itself on `error`. A string
    payload renders preformatted; a node renders as given.
  - `actions` (for example Approve / Deny) renders *outside* the disclosure, so a pending
    approval is always visible.
  - It is not a live region, by the §3 contract. Progress is announced with `AiStatus`.
- **Stop / regenerate**: no new component. `AiStatus.onStop` covers Stop, and "Regenerate" is
  an ordinary `Button` next to the message. A message-actions component (copy, regenerate,
  feedback) stays in Phase 4.

### Phase 3: AI presence and provenance

- **AI presence surfaces**: an `ai` boolean on `Card`, `Tile`, `Input`/`Textarea`, `Modal`,
  `Sheet` and `DataTable` rows. It adds a static gradient border and aura (Carbon), with an
  `ai="generating"` option that animates the border (Rovo's rule: activity only).
- **Revert-to-AI** on `AiBadge` (`onRevert`, Carbon's edited state).
- **`AiDisclaimer`**: "AI-generated content may be incorrect" (Fluent, SLDS, Gemini).
- **`Sources` / `InlineCitation`**: numbered citations with a hover card.

### Phase 4: conversation layer and convergence

- **Announcer primitive** in `@cascivo/core` (`useAnnouncer`): one shared polite region with
  batch clearing, Fluent-style. It needs a `HEADLESS.md` entry.
- **Prompt suggestions / starters**, **message actions** (copy, good/bad with "recorded"
  label swap), **context / token meter**.
- **Converge `@cascivo/ai`**: rebuild `AiChat` on `TypingIndicator`, `AiStatus` and
  `Reasoning`. Point `AiLabel` at `AiStatus` and deprecate it on the documented schedule. Move
  `StreamingText` and `Terminal` into the registry with manifests.

---

## 7. Phase 1 execution plan

1. Tokens: add them to `index.css`, then `pnpm regen`. → verify: `token-catalog`, theme parity.
2. `ShimmerText` + keyframe `cascivo-text-shimmer`. → verify: `audit:animation`,
   `reduced-motion:check`, unit tests.
3. `Skeleton ai`. → verify: skeleton tests, `props-parity`.
4. `TypingIndicator`, `AiStatus`, `Reasoning`, `AiBadge`. → verify: unit tests,
   `client-js-parity`, `i18n:check`, `apg:check`.
5. Wire up: `packages/components/package.json` exports, `packages/react/src/index.ts`,
   `_all-metas.ts`, `aliases.json`, `apps/site/src/demos.tsx`, the enhancement fixture, and a
   changeset.
6. `pnpm regen`, build, `pnpm api:snapshot`, visual baselines (Playwright against the built
   site, or the `visual.yml` dispatch).
7. `pnpm ready`.
