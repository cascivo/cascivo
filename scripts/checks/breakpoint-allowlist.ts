/**
 * Allowlist of off-scale width literals in @media/@container conditions.
 *
 * Entries are DEBT — they exist before v20. Later tranches migrate them onto
 * the canonical scale (sm=30rem md=40rem lg=64rem xl=80rem) and delete the entry.
 * Each entry must document WHY it is exempted.
 *
 * Format: { file: relative path from repo root, value: the literal, reason: string }
 */
export interface AllowlistEntry {
  file: string
  value: string
  reason: string
}

export const BREAKPOINT_ALLOWLIST: AllowlistEntry[] = [
  {
    file: 'packages/components/src/pagination/pagination.module.css',
    value: '28rem',
    reason:
      'pre-v20 pagination range-label collapse — sits between sm(30rem) and md(40rem); migrate to 30rem in T7',
  },
  {
    file: 'packages/layouts/src/dashboard-layout/dashboard-layout.module.css',
    value: '56rem',
    reason:
      'pre-v20 dashboard two-column breakpoint — sits between md(40rem) and lg(64rem); migrate to 64rem in T7',
  },
  {
    file: 'packages/layouts/src/sections/hero/hero.module.css',
    value: '48rem',
    reason:
      'pre-v20 hero split-variant breakpoint — sits between md(40rem) and lg(64rem); migrate to 64rem in T7',
  },
]
