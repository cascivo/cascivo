/**
 * Media-feature coverage check.
 *
 * Asserts that:
 *   1. Any component CSS with hardcoded animation/transition durations has a
 *      @media (prefers-reduced-motion) guard. Exception: spinner (deliberate opt-out).
 *   2. Interactive components have a @media (forced-colors: active) block.
 *   3. Status-conveying display components (alert, badge) have a
 *      @media (prefers-contrast) block.
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')

function readCss(component: string): string {
  return readFileSync(
    join(REPO_ROOT, `packages/components/src/${component}/${component}.module.css`),
    'utf8',
  )
}

/** True if the CSS contains any transition/animation with a hardcoded duration (e.g. 0.6s, 200ms). */
function hasHardcodedDuration(css: string): boolean {
  return /\d+(\.\d+)?(ms|s)\b/.test(css)
}

/** True if the CSS contains a @media (prefers-reduced-motion…) block. */
function hasReducedMotionGuard(css: string): boolean {
  return /@media\s*\(prefers-reduced-motion/.test(css)
}

/** True if the CSS contains a @media (forced-colors: active) block. */
function hasForcedColorsBlock(css: string): boolean {
  return /@media\s*\(forced-colors:\s*active\)/.test(css)
}

/** True if the CSS contains a @media (prefers-contrast…) block. */
function hasPrefersContrastBlock(css: string): boolean {
  return /@media\s*\(prefers-contrast/.test(css)
}

// ── Reduced-motion ────────────────────────────────────────────────────────────
// Components with hardcoded literal durations must have a per-component guard.
// Components that use only --cascivo-duration-* tokens are covered globally.
// Spinner deliberately uses a literal and has its own guard (animation slowed, not stopped).

const REDUCED_MOTION_EXCEPTION = new Set(['spinner'])

describe('prefers-reduced-motion — hardcoded durations require a guard', () => {
  const animatingComponents = [
    'button',
    'input',
    'textarea',
    'checkbox',
    'radio',
    'toggle',
    'modal',
    'dropdown',
    'tooltip',
    'toast',
    'accordion',
    'spinner',
    'tabs',
    'alert',
    'select',
  ]

  for (const component of animatingComponents) {
    it(`${component}: if hardcoded duration present, must have @media (prefers-reduced-motion)`, () => {
      const css = readCss(component)

      if (!hasHardcodedDuration(css)) {
        // No hardcoded duration — covered by global token collapse; nothing to assert.
        return
      }

      if (REDUCED_MOTION_EXCEPTION.has(component)) {
        // Spinner deliberately uses literal durations for a continuous loading indicator.
        // Its guard slows (not stops) the animation — this is intentional and documented.
        assert.ok(
          hasReducedMotionGuard(css),
          `${component} has hardcoded duration and is an exception, but still needs its own @media (prefers-reduced-motion) guard`,
        )
        return
      }

      assert.ok(
        hasReducedMotionGuard(css),
        `${component} has hardcoded duration(s) but no @media (prefers-reduced-motion) guard`,
      )
    })
  }
})

// ── forced-colors ─────────────────────────────────────────────────────────────
// Interactive components must have a @media (forced-colors: active) block to
// preserve affordances in Windows High Contrast mode.

const INTERACTIVE_COMPONENTS = [
  'button',
  'input',
  'textarea',
  'checkbox',
  'radio',
  'toggle',
  'slider',
  'modal',
  'dropdown',
  'accordion',
  'tabs',
  'select',
  'tooltip',
  'toast',
]

describe('forced-colors — interactive components must have @media (forced-colors: active)', () => {
  for (const component of INTERACTIVE_COMPONENTS) {
    it(`${component}: has @media (forced-colors: active) block`, () => {
      const css = readCss(component)
      assert.ok(
        hasForcedColorsBlock(css),
        `${component} is interactive but has no @media (forced-colors: active) block`,
      )
    })
  }
})

// ── prefers-contrast ──────────────────────────────────────────────────────────
// Components that convey status via color must add @media (prefers-contrast: more)
// to increase border width so meaning is preserved beyond hue.

const CONTRAST_COMPONENTS = ['alert', 'badge']

describe('prefers-contrast — status components must have @media (prefers-contrast) block', () => {
  for (const component of CONTRAST_COMPONENTS) {
    it(`${component}: has @media (prefers-contrast) block`, () => {
      const css = readCss(component)
      assert.ok(
        hasPrefersContrastBlock(css),
        `${component} conveys status via color but has no @media (prefers-contrast) block`,
      )
    })
  }
})
