/** A reference into the host-provided data context: "$data.users" → context.data.users */
export type DataRef = `$data.${string}`
/** A reference into view-local state declared in `ViewConfig.state`: "$state.searchQuery". */
export type StateRef = `$state.${string}`
/** A reference into the host-provided actions: "$actions.openUser" */
export type ActionRef = `$actions.${string}`
/** A write handler bound to view-local state: "$state.set.searchQuery" | "$state.toggle.open". */
export type StateActionRef = `$state.set.${string}` | `$state.toggle.${string}`
/** Initial values for view-local state — primitives only (complex data belongs to host `data`). */
export type StateValue = string | number | boolean | null
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
  /** Prop name → a host-data ref ("$data.*") or a view-state ref ("$state.<key>"). */
  bind?: Record<string, DataRef | StateRef>
  /** Event prop name → a host-action ref ("$actions.*") or a state writer ("$state.set|toggle.<key>"). */
  events?: Record<string, ActionRef | StateActionRef>
  children?: ComponentNode[] | string | TranslationRef
}

export interface ViewConfig {
  $schema?: string
  version?: 1
  /** Declarative view-local state — initial primitive values keyed by name. Bind reads with
   * "$state.<key>"; write via events "$state.set.<key>" / "$state.toggle.<key>". */
  state?: Record<string, StateValue>
  view: {
    regions: Record<string, ComponentNode[]>
  }
}
