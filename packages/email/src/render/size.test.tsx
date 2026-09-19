/**
 * Every email template stays inside its byte budget.
 *
 * `docs/specs/email-target.md` §6 asks for output that is not merely small but **provably**
 * small. This is the proof: a committed ceiling per template, measured on the real render,
 * failing the build when it is exceeded. Same shape as
 * `scripts/checks/sparkline-subpath-size.test.ts`, which exists for the same reason — a
 * size promise nothing measures stops being true without anyone noticing.
 *
 * Two directions are checked, and the second is the one that keeps this honest:
 *
 *  1. **Ceiling.** Encoded size must not exceed the budget.
 *  2. **Slack.** The budget must not sit far above actual. Without this, one generous
 *     budget absorbs every future regression and the check silently stops meaning anything.
 *
 * Budgets are stated in **encoded** bytes. Gmail measures the quoted-printable body, not the
 * raw string, and a budget on raw bytes under-reports by up to a third — which is how a
 * green size check ships clipped mail.
 *
 * When a change moves a template legitimately, update `BUDGETS` in the same commit; the
 * diff is the review.
 *
 * Lives in the package rather than `scripts/checks/` because it has to render React, and
 * `scripts/` has no React to resolve. It runs in CI all the same, under `pnpm test`.
 *
 * Run: `pnpm email:size:check`.
 */
import { describe, expect, it } from 'vitest'
import { CLIP_BUDGETS, renderEmail } from './render.tsx'
import { PasswordReset, Receipt, Welcome } from '../templates/index.ts'
import { EMAIL_THEMES } from '../tokens/palettes.generated.ts'

/**
 * Encoded-byte ceilings, per template.
 *
 * Every shipped template targets the **strict** tier (~20 KB, iOS Gmail) rather than the
 * desktop 102 KB: a transactional email that clips on a phone has failed at the moment it
 * matters most. The headroom below is deliberate — a template is content plus chrome, and
 * the chrome is what this budget governs.
 */
const BUDGETS: Record<string, number> = {
  welcome: 9 * 1024,
  'password-reset': 9 * 1024,
  receipt: 12 * 1024,
}

/** How far above actual a budget may sit before it stops being a real constraint. */
const MAX_SLACK = 1.6

const TEMPLATES = [
  ['welcome', <Welcome />],
  ['password-reset', <PasswordReset />],
  ['receipt', <Receipt />],
] as const

/** The theme with the largest output — budgets are checked against the worst case. */
function worstEncoded(element: React.ReactElement): { bytes: number; theme: string } {
  let worst = { bytes: 0, theme: '' }
  for (const theme of EMAIL_THEMES) {
    const { stats } = renderEmail(element, { theme, tier: 'strict' })
    if (stats.encodedBytes > worst.bytes) worst = { bytes: stats.encodedBytes, theme }
  }
  return worst
}

describe('email size budgets', () => {
  for (const [name, element] of TEMPLATES) {
    const budget = BUDGETS[name]!
    const { bytes, theme } = worstEncoded(element)
    const kb = (n: number) => `${(n / 1024).toFixed(2)} KB`

    it(`${name} stays under ${(budget / 1024).toFixed(0)} KB encoded`, () => {
      expect(
        bytes,
        `${name} is ${kb(bytes)} encoded in the ${theme} theme. Reduce the template, or ` +
          'raise BUDGETS in the same commit so the increase is reviewed.',
      ).toBeLessThanOrEqual(budget)
    })

    it(`${name}'s budget is not slack`, () => {
      expect(
        budget,
        `${name} uses ${kb(bytes)} of a ${kb(budget)} budget — more than ${MAX_SLACK}× ` +
          'headroom. Tighten BUDGETS so the ceiling still catches a regression.',
      ).toBeLessThanOrEqual(bytes * MAX_SLACK)
    })

    it(`${name} clears the strict tier`, () => {
      // The tier is the real-world constraint; the budget above is the tighter house rule.
      expect(bytes, `${name} is ${kb(bytes)}, at the iOS Gmail clip threshold`).toBeLessThan(
        CLIP_BUDGETS.strict,
      )
    })
  }
})
