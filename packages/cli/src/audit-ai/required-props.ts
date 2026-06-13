import type { Contract } from '../utils/contract.js'
import {
  extractAttrNames,
  findOpeningTags,
  importedCascadeComponents,
  lineOf,
} from './jsx-props.js'

export interface RequiredPropFinding {
  file: string
  line: number
  component: string
  prop: string
  level: 'error'
  rule: 'missing-prop'
  message: string
}

/**
 * Flag cascade elements that omit a prop the component marks required.
 * Elements using a spread are skipped (the prop may arrive via the spread).
 */
export function findRequiredPropViolations(
  source: string,
  filename: string,
  contract: Contract,
): RequiredPropFinding[] {
  const findings: RequiredPropFinding[] = []
  const tracked = importedCascadeComponents(source)

  for (const comp of tracked) {
    const info = contract.components.get(comp)
    if (!info?.hasRequiredProps) continue

    for (const tag of findOpeningTags(source, comp)) {
      if (tag.hasSpread) continue
      const present = new Set(extractAttrNames(tag.attrs))
      const line = lineOf(source, tag.index)
      for (const req of info.requiredProps) {
        if (present.has(req)) continue
        findings.push({
          file: filename,
          line,
          component: comp,
          prop: req,
          level: 'error',
          rule: 'missing-prop',
          message: `<${comp}> requires "${req}"`,
        })
      }
    }
  }

  return findings
}
