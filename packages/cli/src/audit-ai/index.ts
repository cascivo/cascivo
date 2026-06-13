/**
 * Pure, browser-importable audit-ai analyzers.
 * No Node.js dependencies — safe to import from the docs app (Preact/Vite).
 */
export type { LiteralFinding } from './css-literals.js'
export { findCssLiteralViolations } from './css-literals.js'

export type { OpeningTag, PropFinding } from './jsx-props.js'
export {
  extractAttrNames,
  findJsxPropViolations,
  findOpeningTags,
  importedCascadeComponents,
  lineOf,
} from './jsx-props.js'

export type { RequiredPropFinding } from './required-props.js'
export { findRequiredPropViolations } from './required-props.js'

export type { RawStringFinding } from './raw-strings.js'
export { findRawStringViolations } from './raw-strings.js'

export type {
  BuildContractInput,
  ComponentInfo,
  Contract,
  PropInfo,
} from '../utils/contract-pure.js'
export { buildContract, normalizeValue } from '../utils/contract-pure.js'
