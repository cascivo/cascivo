/**
 * Types for the two modules `src/plugin.mjs` generates at dev-server start.
 *
 * They have no file on disk, so `tsc` needs telling what they are. Keeping the shape here
 * rather than inferring it also means the plugin and the UI have one written contract
 * between them: change the generated code and this fails, which is the point.
 */
declare module 'virtual:cascivo-email-templates' {
  import type { EmailTheme, Palette } from '@cascivo/email'
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
    /** The file's `theme` export — the palette it is designed for — or `null`. */
    theme: EmailTheme | Palette | null
    /** The file's `allow` export, waived in the conformance panel, or `null`. */
    allow: Readonly<Record<string, string>> | null
  }

  /** The directory that was scanned, or `null` for the built-in templates. */
  export const source: string | null
  export const templates: PreviewTemplate[]
}

declare module 'virtual:cascivo-email-themes' {
  import type { Palette } from '@cascivo/email'

  /** Named palettes from `--theme <file>`. Empty when the flag was not passed. */
  export const custom: Record<string, Palette>
}

declare module 'virtual:cascivo-email-allow' {
  /** Slug → reason from `--allow <file>`, merged into the panel's allowlist. */
  const allow: Readonly<Record<string, string>>
  export default allow
}

declare module 'virtual:cascivo-caniemail' {
  /** The matrix as downloaded, or `null` when none was supplied. */
  const data: unknown
  export default data
}
