---
'@cascivo/i18n': minor
---

Twelve more built-in languages: `fr`, `es`, `it`, `pt`, `nl`, `sv`, `pl`, `ja`, `zh`, `ko`, `ar` and `tr` ship as separate entries (`@cascivo/i18n/locales/<code>`), each translating every built-in component string, so an app pays only for the languages it imports. Register one lazily with `registerCatalog('fr', () => import('@cascivo/i18n/locales/fr'))`. A region-tagged locale now falls back to its language's catalog (`pt-BR` → `pt`); an exact catalog still wins. The new translations were drafted with AI assistance and are awaiting native-speaker review.
