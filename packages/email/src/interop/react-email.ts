/**
 * React Email interop.
 *
 * The migration path for a project already using [React Email](https://react.email). It is
 * an escape hatch, not the product: a template written against these primitives is a cascivo
 * template, themed by cascivo tokens and checked by the cascivo conformance lint. What this
 * module does is let the two coexist while a codebase moves, in both directions.
 *
 * **No dependency on `@react-email/components` is added.** This maps *names*, so it works
 * whether or not React Email is installed, and adds nothing to the bundle of a project that
 * has already finished migrating.
 */

/**
 * React Email primitive → the cascivo equivalent, with what changes.
 *
 * `null` means there is no equivalent and why. The list is the honest shape of the
 * migration: most of React Email's surface maps one-to-one, and the gaps are deliberate.
 */
export const REACT_EMAIL_MAP: Readonly<Record<string, { cascivo: string | null; note?: string }>> =
  {
    Html: { cascivo: 'Html' },
    Head: { cascivo: 'Head' },
    Body: { cascivo: 'Body' },
    Preview: { cascivo: 'Preview' },
    Container: { cascivo: 'Container' },
    Section: { cascivo: 'Section' },
    Row: { cascivo: 'Row' },
    Column: { cascivo: 'Column' },
    Heading: {
      cascivo: 'Heading',
      note: "React Email's `as` prop is `level` here — a number, so the semantic level and the default size move together.",
    },
    Text: { cascivo: 'Text' },
    Link: { cascivo: 'Link' },
    Button: {
      cascivo: 'Button',
      note: 'Takes `variant` rather than bare styles, so a button is themed rather than hand-painted.',
    },
    Img: {
      cascivo: 'Img',
      note: '`alt` and `width` are required by the type. An unlabelled image is missing content in the clients that block images by default.',
    },
    Hr: { cascivo: 'Hr' },
    Font: {
      cascivo: null,
      note: 'No equivalent, deliberately. `@font-face` does not load in Gmail or Outlook, so cascivo ships email-safe stacks (`EMAIL_FONTS`) instead of a component that promises a web font it cannot deliver.',
    },
    Markdown: {
      cascivo: null,
      note: 'No equivalent. Rendering arbitrary Markdown produces arbitrary HTML, which the conformance lint cannot vouch for; compose the primitives instead.',
    },
    CodeBlock: {
      cascivo: null,
      note: 'No equivalent yet. Syntax highlighting means many spans of inline colour, which is a real byte cost worth designing for rather than inheriting.',
    },
    CodeInline: { cascivo: null, note: 'Use `Text` with a `fontFamily` of `EMAIL_FONTS.mono`.' },
    Tailwind: {
      cascivo: null,
      note: 'Not applicable. cascivo emits resolved theme tokens directly, so there is no class-to-inline-style step to perform.',
    },
  }

export interface MigrationReport {
  /** Imports with a direct cascivo equivalent. */
  mapped: { from: string; to: string; note?: string }[]
  /** Imports with no equivalent, each with the reason. */
  unmapped: { from: string; note: string }[]
  /** Imported names this module does not recognise. */
  unknown: string[]
}

/**
 * Report what a React Email template would need in order to become a cascivo one.
 *
 * Takes the imported names rather than source text: extracting imports is the caller's job
 * and every project's build already knows how, whereas parsing TSX here would mean a parser
 * this package does not have.
 */
export function planMigration(importedNames: readonly string[]): MigrationReport {
  const report: MigrationReport = { mapped: [], unmapped: [], unknown: [] }

  for (const name of importedNames) {
    const entry = REACT_EMAIL_MAP[name]
    if (!entry) {
      report.unknown.push(name)
      continue
    }
    if (entry.cascivo === null) {
      report.unmapped.push({ from: name, note: entry.note ?? 'No equivalent.' })
      continue
    }
    report.mapped.push({
      from: name,
      to: entry.cascivo,
      ...(entry.note === undefined ? {} : { note: entry.note }),
    })
  }

  return report
}

/** Render a {@link MigrationReport} as plain text. */
export function formatMigration(report: MigrationReport): string {
  const lines: string[] = []
  if (report.mapped.length) {
    lines.push('Direct equivalents:')
    for (const m of report.mapped) {
      lines.push(`  ${m.from} → ${m.to}${m.note ? `\n      ${m.note}` : ''}`)
    }
  }
  if (report.unmapped.length) {
    lines.push('', 'No equivalent:')
    for (const u of report.unmapped) lines.push(`  ${u.from}\n      ${u.note}`)
  }
  if (report.unknown.length) {
    lines.push('', `Unrecognised: ${report.unknown.join(', ')}`)
  }
  return lines.join('\n')
}
