export interface StateConfig {
  on?: Record<string, string>
}

export interface MachineConfig<S extends string = string, I extends S = S> {
  initial: I
  states: Record<S, StateConfig>
}

export interface Machine<S extends string = string> {
  initial: S
  states: Record<S, StateConfig>
}

export interface PropMeta {
  name: string
  type: string
  required: boolean
  default?: string
  description?: string
}

/**
 * WCAG conformance level with explicit version.
 * 'AA' / 'AAA' are deprecated aliases for '2.1-AA' / '2.1-AAA' — migrate to versioned form.
 */
export type WcagLevel = '2.1-AA' | '2.2-AA' | '2.2-AAA' | 'AA' | 'AAA'

export interface AccessibilityMeta {
  role: string
  /** WCAG conformance level. Use versioned form: '2.1-AA' | '2.2-AA'. */
  wcag: WcagLevel
  keyboard: string[]
  /**
   * ARIA Authoring Practices Guide pattern this component conforms to.
   * E.g. 'tabs', 'dialog-modal', 'combobox', 'accordion', 'slider'.
   * Omit for components that don't map to an APG pattern (charts, composites).
   */
  apgPattern?: string
  /**
   * True if the component explicitly handles forced-colors (Windows High Contrast)
   * via @media (forced-colors: active) CSS rules.
   */
  forcedColors?: boolean
  /**
   * True if the component explicitly respects prefers-reduced-motion.
   * Omit/false for components with no animation.
   */
  reducedMotion?: boolean
}

export interface ExampleMeta {
  title: string
  code: string
  description?: string
}

export interface ComponentMeta {
  name: string
  description: string
  category:
    | 'inputs'
    | 'display'
    | 'overlay'
    | 'navigation'
    | 'feedback'
    | 'layout'
    | 'block'
    | 'chart'
  states: string[]
  variants: string[]
  sizes: string[]
  props: PropMeta[]
  tokens: string[]
  accessibility: AccessibilityMeta
  examples: ExampleMeta[]
  dependencies: string[]
  tags: string[]
  intent?: ComponentIntent
}

export interface IntentAntiPattern {
  bad: string
  good?: string
  why: string
}

export type IntentRelationship = 'alternative' | 'pairs-with' | 'contains' | 'contained-by'

export interface IntentRelated {
  name: string
  relationship: IntentRelationship
  reason: string
}

export interface IntentFlexibility {
  area: string
  level: 'strict' | 'flexible'
  note: string
}

export interface IntentContent {
  tone: string
  notes?: string
}

export interface ComponentIntent {
  whenToUse: string[]
  whenNotToUse: string[]
  antiPatterns: IntentAntiPattern[]
  related: IntentRelated[]
  a11yRationale: string
  content?: IntentContent
  flexibility: IntentFlexibility[]
}
