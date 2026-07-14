---
name: cascivo:create-theme
description: Create a custom cascivo theme from brand colors. Generates a @layer cascivo.theme stylesheet overriding semantic tokens, then verifies WCAG AA contrast.
---

# cascivo:create-theme

## When to use

The user wants to apply their brand colors to cascivo components (e.g. "use our primary color #1a73e8 and surface color #f8f9fa").

## Procedure

### 1. Collect brand colors

Ask the user for:

- Primary / accent color (hex)
- Background / surface color (hex)
- Text color on surfaces (hex)
- (Optional) Secondary / muted color
- (Optional) Destructive / error color
- Theme name (default: `brand`)

### 2. Read the semantic token list

Do NOT use a hardcoded token list. Read the cascivo token documentation at runtime:

- Read `packages/tokens/src/index.css` from the local repo, or
- Fetch `https://cascivo.com/llms.txt` which lists the semantic tokens.

Identify the semantic tokens to override (these are `--cascivo-color-*` custom properties at the semantic layer, not primitive tokens).

### 3. Generate the theme stylesheet

Create a CSS file (e.g. `src/themes/<name>.css`) with the structure:

```css
/* Brand theme for cascivo */
@layer cascivo.theme {
  [data-theme='<name>'] {
    --cascivo-color-accent: <primary-hex>;
    --cascivo-color-accent-hover: <primary-hex-darker>;
    --cascivo-color-bg: <surface-hex>;
    --cascivo-color-bg-subtle: <surface-hex-lighter>;
    --cascivo-color-text: <text-hex>;
    /* ... additional overrides based on brand colors */
  }
}
```

Derive hover/subtle variants by lightening/darkening the base colors by ~10%.

> A theme sets semantic tokens for a `[data-theme]`. For a **one-off override that must
> beat everything** (all themes and components, with no `data-theme` needed), use
> `@layer cascivo.override { :root { … } }` instead — it is the highest cascivo layer.
> Never write the overrides unlayered.

### 4. Verify WCAG AA contrast

Run the contrast-check script from the cascivo repo:

```bash
node scripts/quality/contrast-check.ts src/themes/<name>.css
```

If the script reports failures (text/surface pairs below 4.5:1):

- Adjust the text or surface colors to meet contrast.
- Re-run the check.
- Repeat until all pairs pass.

If `scripts/quality/contrast-check.ts` is not available locally, compute contrast manually using the WCAG formula: ratio = (L1 + 0.05) / (L2 + 0.05) where L1 > L2. Minimum 4.5:1 for normal text, 3:1 for large text (18px+ or 14px bold).

### 5. Apply the theme

Tell the user to:

1. Import the theme CSS: `import './src/themes/<name>.css'`
2. Apply it to their root element: `<div data-theme="<name>">…</div>`
3. Or scope it to a subtree for partial theming.

### 6. Confirm

Show the final CSS file content and the passing contrast check output.
