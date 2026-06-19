First-party themes for cascade — `light.css`, `dark.css`, `warm.css`, and more. Apply via `data-theme` on any container; themes override the semantic token layer only, leaving component and primitive tokens unchanged.

## Per-theme fonts

A theme can carry its own **display** (headline/brand) face via `--cascivo-font-display`. The token defaults to `var(--cascivo-font-sans)` (so themes that don't override it look unchanged) and is declared in every theme to keep token parity. The `Heading` component renders in the display face, so an override is visible wherever headings appear — e.g. `terminal` maps it to the mono stack and `brutalist` to a heavy grotesk. `--cascivo-font-sans`/`-mono` remain the global body/code defaults.
