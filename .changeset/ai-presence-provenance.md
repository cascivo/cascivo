---
'@cascivo/react': minor
'@cascivo/i18n': minor
'@cascivo/mcp': minor
'@cascivo/eslint-plugin': minor
---

AI presence and provenance.

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
