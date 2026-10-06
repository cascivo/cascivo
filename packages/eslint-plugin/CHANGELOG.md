# @cascivo/eslint-plugin

## 0.3.0

### Minor Changes

- db3f056: AI agent progress components. `ChainOfThought` lists the steps an agent takes. Each step has a
  status from the shared `Progress` vocabulary (`pending | active | complete | error`, the same
  one Timeline and Steps use), which is spoken as text after the title, and can have
  collapsible detail. The list is `aria-busy` while a step is active. `ToolCall` is a card for
  one tool invocation. It shows the tool name and a status badge for the AI SDK lifecycle
  (`pending`, `running`, `awaiting-approval`, `complete`, `error`, `denied`), and puts the input
  and output in a native disclosure that opens itself on error. It has an always-visible
  `actions` slot for approval. Both server-render with no client JS. New
  `builtin.chainOfThought` and `builtin.toolCall` messages (en, de).
  `@cascivo/eslint-plugin`'s vocabulary maps `ThoughtChain`, `AgentSteps`, `Tool` and
  `FunctionCall` to them.
- db3f056: AI components for work in progress. `AiStatus` names what an AI is doing (thinking,
  generating, done, failed, stopped), with a shimmering label and an optional Stop button. It
  announces each phase change once and never announces streamed tokens. `ShimmerText` is the
  "Thinking…" text sweep. `TypingIndicator` is the three-dot placeholder for a reply. `Reasoning`
  is a native `<details>` panel that opens and shimmers while the model reasons, then closes and
  reads "Thought for N seconds". `AiBadge` is the "AI" provenance marker, with an optional
  toggletip explanation. `Skeleton` gains `ai`, which gives a placeholder the AI tint (Carbon's AI
  skeleton). New semantic tokens `--cascivo-color-ai`, `-ai-subtle`, `-ai-border` and `-ai-sheen`
  are derived from each theme's own colours, so every theme gets them. New keyframe
  `cascivo-text-shimmer`. New `builtin.aiStatus`, `builtin.reasoning`, `builtin.aiBadge` and
  `builtin.typingIndicator` messages (en, de). Every loop stops under
  `prefers-reduced-motion`. `@cascivo/eslint-plugin`'s vocabulary maps the foreign names `AILabel`,
  `AISkeleton`, `TextShimmer`, `ThinkingBar` and `TypingDots` to them.
- db3f056: AI conversation layer.

  - **`announce(message, { politeness, batchId })`** (`@cascivo/core`, re-exported from
    `@cascivo/react`) speaks to screen-reader users through one shared live region. A
    `batchId` collapses a burst of announcements into the last one. It is SSR-safe.
  - **New registry components:**
    - `MessageActions`: copy, good/bad as `aria-pressed` toggle buttons that announce
      "Thanks for your feedback", and regenerate.
    - `PromptSuggestions`: starter prompts as pill buttons, with `onSelect(prompt)`.
    - `ContextMeter`: a `role="meter"` showing tokens used out of a context window. It warns
      at 80% and turns destructive at 95%.
  - **`StreamingText` and `Terminal` are now registry components**, also in `@cascivo/react`.
    `@cascivo/ai` re-exports the same implementations.
  - **`Terminal` changes:**
    - It is no longer a live region. The full script is visually hidden text from the first
      render, so screen readers are no longer fed per-character fragments.
    - It follows the editor tokens, so it matches the theme. Set `--cascivo-terminal-bg` /
      `-fg` for an always-dark look.
    - `loop` now really replays. It used to stop on an empty first line.
  - **`AiChat` changes:**
    - Its log is no longer a live region, so a streamed reply is not read out token by token;
      the finished reply is announced once.
    - It shows a `TypingIndicator` until the first token arrives.
    - A new optional `onStop` shows an `AiStatus` with a Stop button.
  - **Deprecation:** `AiLabel` is deprecated in favour of `AiStatus` (since 1.7.0, removed in
    2.0.0).
  - **Messages:** new `builtin.messageActions`, `builtin.promptSuggestions`,
    `builtin.contextMeter` and `builtin.terminal` messages (en, de).

- db3f056: AI presence and provenance.

  - **AI presence:** `Card` and `Modal` take `ai` (`true` or `'generating'`). `Input` and
    `Textarea` take `ai`. `true` gives an AI-tinted edge and a soft aura. `'generating'` adds a
    pulsing inner glow, which stops under reduced motion. The treatment is visual only, so pair
    it with `AiBadge`.
  - **`AiBadge` revert:** new `edited` and `onRevert` props. Once a person edits AI output, the
    mark becomes a "Revert to AI suggestion" button, or disappears when there is no way back.
    `AiBadge` is now `clientJs: 'enhancement'`.
  - **New components:** `AiDisclaimer` is the quiet "AI-generated content may be incorrect"
    note. `Sources` is a collapsible, numbered "Used N sources" list. `InlineCitation` is a
    numbered citation marker that previews its source in a HoverCard.
  - **Safe links:** both components treat model-supplied URLs as untrusted. Only absolute http(s)
    URLs become links, and the new `sourceHref()` export applies the same rule to your own
    markup.
  - **Messages:** new `builtin.sources`, `builtin.inlineCitation` and `builtin.aiDisclaimer`
    messages, plus `builtin.aiBadge.revert` (en, de).

## 0.2.1

### Patch Changes

- a076a68: Editor: line numbers, the current-line highlight and the left gutter all survive a soft wrap

  Reported from an adopter running `CodeEditor` with `wrap` over markdown, and reproduced in
  Chromium against the shipped CSS: with soft wrap on, a single long line broke the whole left
  edge of the editor.

  - **Line numbers drifted one row per wrap.** The gutter was a separate column whose rows were
    one line box each, while the code column's rows grew with the text. A line that wrapped to two
    visual rows put `6` next to the continuation of line 5, and the last line got no number at all.
    The number and its line are now adjacent cells of **one CSS grid row**, so the row grows once
    and both grow with it — there is nothing left to keep in sync.
  - **The current-line highlight lit only the first visual row** of a wrapped line: it was
    positioned by `caretLine * 1lh` and was `1lh` tall. Under wrap it is now placed on the caret's
    grid row and takes that row's height, so it covers every visual row of the line. Not wrapping,
    where rows are uniform and large documents window to a slice, keeps the arithmetic.
  - **The gap between the border and the code could collapse to nothing.** It was padding on the
    gutter and on the highlight/edit layers, and a host reset — Tailwind Preflight's
    `* { padding: 0 }` is the one that hit — outranks `@layer cascivo.component`. The gutter's
    width is now a grid track, the gap after it a `column-gap`, and the textarea's alignment an
    `inset-inline-start`. A `padding: 0` reset can collapse none of the three, so the editing
    surface also cannot drift off the layer it is overlaid on.

  Two new override points come with it, both documented on `CodeEditor` and `Highlight`:
  `--cascivo-editor-gutter-width` (default: as wide as the widest line number) and
  `--cascivo-editor-gutter-gap`. Line numbers stay `aria-hidden` and unselectable, so they are
  neither announced nor copied with the code, and they now stay visible in forced-colors mode,
  where the highlight layer used to be hidden wholesale.

## 0.2.0

### Minor Changes

- 00c1a9e: Enforce the styling contract: a `--cascivo-*` token or `data-cascivo-*` hook that does not
  exist is now reported instead of silently doing nothing.

  CSS drops an unknown custom property without a word, and a selector that matches nothing is
  not an error either — so a misspelled token had no diagnostic anywhere in the toolchain. It
  found `--cascivo-button-bg`, taught as the worked example of the override ladder's first rung
  in four guides and defined by no stylesheet in the repo.

  - **`@cascivo/eslint-plugin`** adds `cascivo/token-values`, which reports an unknown
    `--cascivo-*` custom property in a JSX `style` prop (through the `as CSSProperties` cast
    React forces) and names the token that exists, including when the words are in the wrong
    order (`--cascivo-text-color` → `--cascivo-color-text`).
  - **`@cascivo/eslint-config`** enables it at `warn` as `cascivoTokenValues`.
  - **`@cascivo/tokens`** publishes `./style-contract` and `./style-contract.json`:
    `CascivoComponentToken`, `CascivoAnyToken`, `CascivoStyleHook`, and `CascivoTokenStyle` for
    `satisfies`-checking an inline style before the cast erases the name.
  - **`cascivo`** adds the `unknown-token` and `unknown-style-hook` audit rules at error level,
    covering CSS files as well as TSX.

  All four read one generated name set, so they cannot disagree with each other or with the
  shipped CSS.

  **Button gains the per-variant background tokens the docs had been promising.**
  `--cascivo-button-{primary,secondary,ghost,destructive}-bg`, plus `-bg-hover` for each and
  `-bg-active` for primary, each falling back to the semantic default it replaced — so nothing
  changes until you set one. This is the rung-1 lever for restyling one button family without
  moving `--cascivo-color-primary` under every other primary surface in the subtree. The
  foreground deliberately stays on the semantic tier: a background light enough to need dark
  text still needs `--cascivo-color-primary-fg` set alongside it.

## 0.1.1

### Patch Changes

- a0bb1cf: Release every published package.

  This changeset names all twenty published packages so the next release cuts a version for each
  of them, including the four that no other pending changeset touches (`@cascivo/docs`,
  `@cascivo/docspack`, `@cascivo/eslint-plugin`, `@cascivo/vite-plugin`).

  The bump is `patch` everywhere; where another pending changeset asks for a `minor` or `major`,
  that higher bump still wins.
