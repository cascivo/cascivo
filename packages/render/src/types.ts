/** A reference into the host-provided data context: "$data.users" → context.data.users */
export type DataRef = `$data.${string}`
/** A reference into the host-provided actions: "$actions.openUser" */
export type ActionRef = `$actions.${string}`
/** A translatable string reference resolved via @cascivo/i18n translateKey. */
export interface TranslationRef {
  $t: string
  params?: Record<string, string | number>
}

export type PropValue =
  | string
  | number
  | boolean
  | null
  | TranslationRef
  | PropValue[]
  | { [key: string]: PropValue }

export interface ComponentNode {
  /** Registry component name, e.g. "DataTable" (case-insensitive match against registry meta.name). */
  component: string
  props?: Record<string, PropValue>
  /** Prop name → data ref. Bound values come from the host context, never from JSON. */
  bind?: Record<string, DataRef>
  /** Event prop name → action ref. */
  events?: Record<string, ActionRef>
  children?: ComponentNode[] | string | TranslationRef
}

export interface ViewConfig {
  $schema?: string
  version?: 1
  view: {
    /** A layout/block registry name ("dashboard" → layout/dashboard) or "none". */
    layout?: string
    regions: Record<string, ComponentNode[]>
  }
}
