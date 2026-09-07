/**
 * Where a module's directive prologue ends, and whether it opens with `'use client'`.
 *
 * Three places used to answer this by splitting on newlines and testing whether a line was
 * *only* a directive: the two CSS-edge plugins (`scripts/build/css-import-edge.ts`,
 * `packages/react/vite.config.ts`) and the RSC guard (`scripts/checks/rsc-boundary.test.ts`).
 * That assumption held only because the published chunks were never whitespace-minified.
 *
 * When they were (2026-09), a whole minified module became one line, so:
 *
 *  - The single-entry CSS plugin found no directive line and spliced `import './x.css';`
 *    *before* `"use client"` in charts, editor, flow and ai. A directive that is not the
 *    first statement is not a directive — those four packages silently stopped being client
 *    modules.
 *  - The RSC guard decided nothing in the library was a client module, so it had nothing
 *    left to check and passed, cheerfully, while that was happening.
 *
 * Scanning the code as a string instead is what makes all three correct at any whitespace.
 */

/** One directive at the current offset: optional leading whitespace, a string, optional `;`. */
const DIRECTIVE_AT = /^\s*(['"])use [\w-]+\1[ \t]*;?/

/** The offset just past the module's directive prologue (0 when it has none). */
export function prologueEnd(code: string): number {
  let at = 0
  for (;;) {
    const match = DIRECTIVE_AT.exec(code.slice(at))
    if (!match) return at
    at += match[0].length
  }
}

/**
 * Insert `statement` immediately after the directive prologue, so directives stay first.
 *
 * On its own line in every case. The prologue's `;` is optional in the grammar, so a
 * statement glued to a directive without one (`"use client"import './x.css';`) would not
 * parse; and the CSS-stripping half of the node twin matches whole lines.
 */
export function insertAfterDirectives(code: string, statement: string): string {
  const at = prologueEnd(code)
  const head = code.slice(0, at)
  const body = code.slice(at).replace(/^\n/, '')
  return head === '' ? `${statement}\n${body}` : `${head}\n${statement}\n${body}`
}

/** Collapse a repeated directive (`'use client';'use client';`) to its first occurrence. */
export function dedupeDirectives(code: string): string {
  const end = prologueEnd(code)
  if (end === 0) return code
  const seen = new Set<string>()
  const kept: string[] = []
  for (const [directive] of code.slice(0, end).matchAll(/(['"])use [\w-]+\1[ \t]*;?/g)) {
    const key = directive.replace(/['"; \t]/g, '')
    if (seen.has(key)) continue
    seen.add(key)
    kept.push(directive.trim().replace(/;?$/, ';'))
  }
  return kept.join('') + code.slice(end).replace(/^\n/, '\n')
}

/** Whether the module's first statement is `'use client'` — i.e. it is a client module. */
export function isClientCode(code: string): boolean {
  return /^\s*(['"])use client\1/.test(code)
}
