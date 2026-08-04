import type { ComponentIntent } from '@cascivo/core'

export type BlockCategory = 'auth' | 'dashboard' | 'marketing' | 'shell'

/**
 * Usage guidance for a block, same shape as `ComponentIntent` (see
 * `packages/core/src/types.ts`) but with only `whenToUse`/`whenNotToUse`
 * required — blocks are page-level compositions and rarely need the full
 * anti-pattern/flexibility detail.
 */
export type BlockIntent = Pick<ComponentIntent, 'whenToUse' | 'whenNotToUse'> &
  Partial<Omit<ComponentIntent, 'whenToUse' | 'whenNotToUse'>>

export type BlockMeta = {
  name: string
  displayName: string
  description: string
  category: BlockCategory
  /**
   * How much client JavaScript this block needs to be correct — same tiers and same
   * derivation rules as `ComponentMeta['clientJs']` (see `packages/core/src/types.ts`),
   * enforced by `scripts/checks/client-js-parity.test.ts`.
   */
  clientJs?: 'none' | 'enhancement' | 'required'
  tags: string[]
  screenshot: {
    light: string
    dark: string
  }
  intent?: BlockIntent
}
