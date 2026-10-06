---
'@cascivo/core': minor
'@cascivo/react': minor
'@cascivo/ai': minor
'@cascivo/i18n': minor
'@cascivo/mcp': minor
'@cascivo/eslint-plugin': minor
---

AI conversation layer.

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
