/** Types of `@cascivo/css/contract.json` (format 1), the semver surface of this package. */

export type ContractTier = 'static' | 'native' | 'behaviour'

/** Allowed values of one `data-*` attribute: literals, or a free-form type. */
export type ContractDataValues = string[] | 'string' | 'number' | 'boolean'

/** One element of a component's markup. */
export interface ContractPart {
  /** Tag name; an array when the part is polymorphic. */
  element: string | string[]
  /** CSS-module local name. */
  local: string
  /** Contract class (`cv-<unit>-<local>`). */
  class: string
  data?: Record<string, ContractDataValues>
  aria?: string[]
  role?: string
  /** Ordered child part keys; `'$slot'`, `'$text'`, or `'@<unit>'` for an embedded component. */
  children?: string[]
  /** Modifier classes on the same element: local → class and the prop that adds it. */
  modifiers?: Record<string, { class: string; when: string }>
  /** Prop expression the part depends on. */
  when?: string
  emit?: 'auto' | 'manual'
  /** The class this part was renamed to; the old name stays an alias for one major. */
  deprecated?: string
}

export interface ContractAnatomy {
  root: ContractPart
  parts: Record<string, ContractPart>
}

export interface ContractUnit {
  /** Component name (`Button`). */
  name: string
  tier: ContractTier
  /** Root alias class (`cv-button`). */
  alias: string
  /** CSS-module local → contract class. */
  classes: Record<string, string>
  anatomy?: ContractAnatomy
}

export interface Contract {
  $comment: string
  format: number
  /** Unit (kebab-case directory name) → its contract. */
  units: Record<string, ContractUnit>
}
