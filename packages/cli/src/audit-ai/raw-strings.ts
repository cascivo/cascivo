import type { Contract } from '../utils/contract-pure.js'
import { findOpeningTags, importedCascadeComponents, lineOf } from './jsx-props.js'

export interface RawStringFinding {
  file: string
  line: number
  component: string
  text: string
  level: 'warn'
  rule: 'raw-string'
  message: string
}

/** Looks like English prose worth flagging: ≥2 whitespace-separated words, letters/spaces only. */
function looksLikeProse(text: string): boolean {
  const trimmed = text.trim()
  if (!/^[A-Za-z][A-Za-z\s]*$/.test(trimmed)) return false
  return trimmed.split(/\s+/).length >= 2
}

/**
 * Conservative raw-string check: for cascade components that own user-facing
 * chrome text (intent.content), warn when a literal multi-word English child
 * appears, suggesting the labels prop / i18n. Never errors. Only inspects the
 * immediate text directly after the opening tag (no nested element traversal).
 *
 * Typography primitives (`intent.content.contentPrimitive`) are excluded: their children
 * are page copy, not component chrome.
 */
export function findRawStringViolations(
  source: string,
  filename: string,
  contract: Contract,
): RawStringFinding[] {
  const findings: RawStringFinding[] = []
  const tracked = importedCascadeComponents(source)

  for (const [comp, contractName] of tracked) {
    const info = contract.components.get(contractName)
    if (!info?.hasContent) continue
    // A typography primitive's children ARE the page's authored prose, so "use the labels
    // prop / i18n" is advice with no target — `Text` has no labels prop. Warning here fires
    // once per sentence in a real app, which trains adopters to ignore the rule and buries
    // the chrome-label findings it exists to surface.
    if (info.isContentPrimitive) continue

    for (const tag of findOpeningTags(source, comp)) {
      // Locate the end of this opening tag in the source.
      const openEnd = source.indexOf('>', tag.index)
      if (openEnd === -1) continue
      if (source[openEnd - 1] === '/') continue // self-closing, no children

      // Grab text up to the next tag/expression boundary.
      const after = source.slice(openEnd + 1)
      const stop = after.search(/[<{]/)
      const child = (stop === -1 ? after : after.slice(0, stop)).trim()
      if (!child || !looksLikeProse(child)) continue

      findings.push({
        file: filename,
        line: lineOf(source, openEnd),
        component: comp,
        text: child,
        level: 'warn',
        rule: 'raw-string',
        message: `<${comp}> raw text "${child}" — use the labels prop / i18n`,
      })
    }
  }

  return findings
}
