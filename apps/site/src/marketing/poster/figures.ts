/**
 * Every number the poster page prints, derived once at build time.
 *
 * Nothing here is a literal: bundle sizes, the partial-update speed-up and the
 * axe count come from the committed cross-library benchmark (`virtual:bench`),
 * the parity split from `public/parity.json`, and the catalog counts from the
 * registry via Vite `define`. A figure that cannot be derived is `undefined`,
 * and the section that would print it drops the line rather than inventing one.
 */
import bench from 'virtual:bench'
import parity from '../../../public/parity.json'

const bundle = bench.bundle
const partialUpdate = bench.runtime?.['update-every-10th']

const cascadeUpdateMs = partialUpdate?.cascade?.median
const shadcnUpdateMs = partialUpdate?.shadcn?.median

/** Total gzip (JS + CSS) of the full benchmark app, per library. */
export const gzip = bundle
  ? {
      cascivo: bundle.apps.cascade.totalGzKb,
      shadcn: bundle.apps.shadcn.totalGzKb,
      carbon: bundle.apps.carbon.totalGzKb,
    }
  : undefined

/** Median wall-clock for "update every 10th row of 1,000", in ms. */
export const partial =
  cascadeUpdateMs && shadcnUpdateMs
    ? {
        cascivoMs: Math.round(cascadeUpdateMs),
        shadcnMs: Math.round(shadcnUpdateMs),
        speedup: shadcnUpdateMs / cascadeUpdateMs,
      }
    : undefined

/** axe violations across the four benchmark app states. */
export const axeViolations = bench.a11y?.cascade.violations

/** shadcn components with a cascivo equivalent, out of the matrix total. */
export const shadcnParity = (
  parity as { competitors: { shadcn: { total: number; covered: number } } }
).competitors.shadcn

export const componentCount = __CASCIVO_COMPONENT_COUNT__
export const themeCount = __CASCIVO_THEME_COUNT__

/** One decimal, the way every bundle figure on the site is written. */
export const kb = (n: number) => `${n.toFixed(1)} KB`
