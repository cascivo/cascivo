---
'@cascivo/react': minor
---

Standardize change-handler naming on `onValueChange` for value-carrying callbacks.

cascivo now documents one rule (in `docs/AI-RULES.md`, `CLAUDE.md`, and llms.txt): a
handler that receives the component's **value** is `onValueChange`; one that receives a
raw DOM `ChangeEvent` is `onChange`; item activation is `onSelect`. This makes the prop
predictable instead of a per-component guess (2026-07-20 report, #7).

Eight components that exposed a value-carrying `onChange` gain an `onValueChange` prop and
mark `onChange` `@deprecated` (it still works, and takes lower precedence than
`onValueChange`): `Toggle`, `Swap`, `Search`, `TimePicker`, `NumberInput`, `Combobox`,
`DatePicker`, `Filter`. No behavior change for existing code; migrate to `onValueChange`
before the deprecated alias is removed in a future major.
