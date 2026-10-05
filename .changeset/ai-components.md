---
'@cascivo/react': minor
'@cascivo/tokens': minor
'@cascivo/i18n': minor
'@cascivo/mcp': minor
'@cascivo/eslint-plugin': minor
---

AI components for work in progress. `AiStatus` names what an AI is doing (thinking,
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
