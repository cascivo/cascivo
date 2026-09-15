/**
 * Types for the two modules `src/plugin.mjs` generates at dev-server start.
 *
 * They have no file on disk, so `tsc` needs telling what they are. Keeping the shape here
 * rather than inferring it also means the plugin and the UI have one written contract
 * between them: change the generated code and this fails, which is the point.
 */
declare module 'virtual:cascivo-email-templates' {
  import type { ComponentType } from 'react'

  export interface PreviewTemplate {
    /** Path-derived and unique — `weekly/issue` for `emails/weekly/issue.tsx`. */
    id: string
    name: string
    /** The file's default export. */
    Component: ComponentType<Record<string, unknown>>
    /** The file's `subject` export, or an empty string. */
    subject: string
    /** The file's `previewProps` export, or `{}`. */
    props: Record<string, unknown>
  }

  /** The directory that was scanned, or `null` for the built-in templates. */
  export const source: string | null
  export const templates: PreviewTemplate[]
}

declare module 'virtual:cascivo-caniemail' {
  /** The matrix as downloaded, or `null` when none was supplied. */
  const data: unknown
  export default data
}
