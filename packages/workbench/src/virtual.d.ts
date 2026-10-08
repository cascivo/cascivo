declare module 'virtual:cascivo-workbench-entries' {
  import type { ComponentType } from 'react'

  export const source: string
  /**
   * One per manifest; `render[i]` renders `meta.examples[i]`, `null` for a snippet. `meta` is
   * whatever the file exports: `parseManifest` reads it.
   */
  export const components: {
    id: string
    meta: unknown
    render: ((() => unknown) | null)[]
    /** Per example, the tags it uses that no copied component exports. */
    unresolved: string[][]
  }[]
  export const previews: {
    id: string
    Component: ComponentType<Record<string, unknown>>
    props: Record<string, unknown>
  }[]
}

declare module 'virtual:cascivo-workbench-styles' {
  /** Stylesheets the project does not have installed. */
  export const missing: string[]
}

declare module 'virtual:cascivo-workbench-text' {
  /** From the project's `@cascivo/text`, or `null` when it is not installed. */
  export const elementToMarkdown: ((el: Element) => string) | null
}
