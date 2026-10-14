/**
 * Storybook story ids, computed from source so the docs site can link to a story without a
 * Storybook build. Mirrors Storybook's CSF rules: the id is `sanitize(title)--sanitize(name)`,
 * where `name` is `storyNameFromExport(exportName)` — the export's start-cased words, not the
 * story's `name` field.
 */

/** Storybook's `sanitize`: lower-case, punctuation and spaces to `-`, collapsed and trimmed. */
export function sanitize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[ ’–—―′¿'`~!@#$%^&*()_|+\-=?;:'",.<>{}[\]\\/]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

/** lodash `startCase` for an export name: `EditedWithRevert2` → `Edited With Revert 2`. */
export function storyNameFromExport(exportName: string): string {
  return exportName
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([A-Za-z])(\d)/g, '$1 $2')
    .replace(/(\d)([A-Za-z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim()
}

export function storyId(title: string, exportName: string): string {
  return `${sanitize(title)}--${sanitize(storyNameFromExport(exportName))}`
}

/**
 * The meta title and first story export of a CSF file. The title is the first `title:` after
 * the default-export meta begins, so a demo helper above it with its own `title` prop is skipped.
 */
export function firstStory(source: string): { title: string; exportName: string } | null {
  const metaStart = source.search(/const meta\b|export default\s*\{/)
  if (metaStart === -1) return null
  // Either quote style: the story generator writes double quotes, the formatter single ones.
  const title = /title:\s*(['"])(.+?)\1/.exec(source.slice(metaStart))?.[2]
  const exportName = /^export const ([A-Za-z_$][\w$]*)/m.exec(source)?.[1]
  return title && exportName ? { title, exportName } : null
}
