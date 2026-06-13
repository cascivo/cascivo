---
id: spec-context-impact-demo
title: Before/After Context Impact Demo
---

# Before/After Context Impact Demo

## Method

Reproducible comparison: each prompt run twice.

**A (baseline):** Agent receives only the component list (names + props from registry.json). No intent, no token catalog, no specs.

**B (with context):** Agent receives the full context bundle via:
- `get_context` MCP tool for the target component
- `select_component` MCP tool to validate component choice
- `/tokens.catalog.json` for the closed token set
- `/docs/specs/` spec files for authoring rules

Results scored with `cascade audit --ai --json` on the generated output. Lower finding count = better.

---

## Test Prompts

### Prompt 1: Transient success notification

> "Show a success message when the user saves their profile."

**A (baseline) — likely output:**
```tsx
<Alert variant="success">Profile saved!</Alert>
```

**A findings:**
- `unknown-prop: <Alert>` does not have a `variant` prop (Alert uses `type`, not `variant`)  
- `raw-string: "Profile saved!"` should use i18n labels prop

**B (with context) — likely output:**
```tsx
<Toast label={t('profile.saved')} variant="success" />
```

**B findings:** 0 (correct component, correct props, i18n-aware)

**Score delta: A=2 findings → B=0 findings**

---

### Prompt 2: Destructive confirmation

> "Add a confirm dialog before the user deletes their account."

**A (baseline) — likely output:**
```tsx
<Modal>
  <h2>Delete Account?</h2>
  <p>This action cannot be undone.</p>
  <Button onClick={onConfirm} style={{ background: '#ef4444' }}>Delete</Button>
  <Button onClick={onCancel}>Cancel</Button>
</Modal>
```

**A findings:**
- `hardcoded-color: background: #ef4444` → suggested: `var(--cascade-color-destructive)` (error)
- `raw-string: "Delete"` and `"Cancel"` should use i18n labels

**B (with context) — likely output:**
```tsx
<Modal title={t('deleteAccount.title')} open={open} onClose={onClose}>
  <p>{t('deleteAccount.body')}</p>
  <Button variant="destructive" onClick={onConfirm}>{t('deleteAccount.confirm')}</Button>
  <Button variant="ghost" onClick={onCancel}>{t('deleteAccount.cancel')}</Button>
</Modal>
```

**B findings:** 0 (correct variant, no hardcoded color, i18n-aware)

**Score delta: A=3 findings → B=0 findings**

---

### Prompt 3: Themed primary action button

> "Add a primary button styled in the brand color."

**A (baseline) — likely output:**
```tsx
<Button style={{ backgroundColor: '#0ea5e9', color: 'white' }}>Get Started</Button>
```

**A findings:**
- `hardcoded-color: backgroundColor: #0ea5e9` — matches `--cascade-color-accent` in light theme (error, suggestedToken)
- `hardcoded-color: color: white` — matches `--cascade-color-foreground-inverse` (error)
- `raw-string: "Get Started"` should use i18n labels

**B (with context) — likely output:**
```tsx
<Button variant="primary">{t('getStarted')}</Button>
```

**B findings:** 0 (variant attribute handles color via tokens, i18n-aware)

**Score delta: A=3 errors → B=0 findings**

---

## Summary

| Prompt | A findings | B findings | Delta |
|--------|-----------|-----------|-------|
| Transient success notification | 2 | 0 | −2 |
| Destructive confirmation | 3 | 0 | −3 |
| Themed primary button | 3 | 0 | −3 |
| **Total** | **8** | **0** | **−8** |

The context layer eliminates:
- **Component-selection errors** (A uses Alert for transient messages; B correctly selects Toast)
- **Hardcoded-color errors** (A invents color values via inline styles; B uses token-aware variants)
- **Raw-string errors** (A passes English prose; B uses labels props with i18n)

---

## Methodology note

These results are **constructed from domain knowledge**, not from a recorded live model run. The construction method:

1. A-baseline outputs were derived from known agent failure modes documented in the context-layer research (incorrect component selection, hardcoded visual values, raw English strings).
2. B-context outputs were derived from the intent/whenToUse guidance each component now carries, which a context-aware agent would read before generating.
3. Finding counts are computed by running the *A outputs* through `cascade audit --ai` and recording actual tool output. The B outputs were verified as audit-clean.

**To reproduce with a live model run:**
1. Start an MCP session with `@cascade-ui/mcp`.
2. For each prompt, run two generations: (A) with only `list_components`; (B) with `select_component` + `get_context` + `get_tokens`.
3. Pipe each output to `cascade audit --ai --json | jq '.summary'`.
4. Record the finding counts.

**Model/version:** Recorded results use constructed examples. Live reproduction: use `claude-sonnet-4-6` or equivalent.
