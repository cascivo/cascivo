import { findUnlayeredRules } from '../utils/css-layers.js'

export interface UnlayeredFinding {
  file: string
  line: number
  selector: string
  level: 'warn'
  rule: 'unlayered-css'
  message: string
}

const MESSAGE =
  'Unlayered CSS beats every cascivo layer regardless of specificity. ' +
  'For a one-off override use `@layer cascivo.override { … }`; for app styles declare ' +
  'an app layer (e.g. cascivo.example) in your order statement. See docs/CSS-LAYERS-PITFALL.md.'

/**
 * Warn on top-level style rules that live outside any `@layer` block. This is the
 * consumer-facing half of the zero-unlayered guard: it teaches the fix rather than
 * failing the build, because `docs/USING-WITH-TAILWIND.md` blesses deliberate
 * unlayered CSS as a valid interop escape hatch. Accessibility-guarantee media
 * queries (`forced-colors`, `prefers-contrast`, …) are exempt — see css-layers.ts.
 */
export function findUnlayeredViolations(source: string, filename: string): UnlayeredFinding[] {
  return findUnlayeredRules(source).map((rule) => ({
    file: filename,
    line: rule.line,
    selector: rule.selector,
    level: 'warn',
    rule: 'unlayered-css',
    message: MESSAGE,
  }))
}
