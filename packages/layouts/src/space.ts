/**
 * A step on cascivo's spacing scale, mapping to the `--cascivo-space-*` design
 * tokens. Used by the `gap` (and related) props of the layout primitives.
 *
 * The scale is deliberately non-linear and **skips 7** — it mirrors the token
 * scale (`--cascivo-space-1 … -6, -8, -10, -12`), which has no `space-7`. So
 * `gap={7}` is a type error by design; use `6` or `8`.
 *
 * Note the props take a **number**, not a string: write `gap={4}`, not `gap="4"`
 * (a string is not assignable to `SpaceStep`).
 *
 * Single source of truth: this type is declared once and shared by every layout
 * primitive, so the published `@cascivo/react` declarations name it `SpaceStep`
 * everywhere instead of the dts bundler's deduped `SpaceStep$N` aliases.
 */
export type SpaceStep = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12
