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

export interface TypeFieldMeta {
  name: string
  type: string
  required: boolean
  description?: string
}

/**
 * The shape of an object-valued prop type (e.g. `PieChartDatum`, `BarChartSeries`).
 * Props whose `type` references a named object should declare that object's fields
 * here so the field list — not just the type string — is machine-readable to the
 * registry, MCP, and llms.txt surfaces.
 */
export interface TypeDefMeta {
  /** The named type as written in a prop's `type` (e.g. 'PieChartDatum'). */
  name: string
  description?: string
  fields: TypeFieldMeta[]
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
  /** Field shapes for object-valued props (datums, series, callback args). */
  typeDefs?: TypeDefMeta[]
  tokens: string[]
  accessibility: AccessibilityMeta
  examples: ExampleMeta[]
  dependencies: string[]
  /**
   * Other **registry** components this one needs at install time — shared hooks/
   * utils or sibling components imported by relative path (e.g. a component that
   * imports `../popover/use-popover` declares `['popover']`). The CLI installs
   * these transitively so the component compiles standalone. Distinct from
   * `dependencies` (npm packages).
   */
  registryDependencies?: string[]
  /**
   * Symbols to import in the generated Install example, when the display `name`
   * is not itself an export (compound/imperative modules — e.g. SkipNav ships
   * `SkipNavLink`/`SkipNavTarget`, Toast ships `ToastProvider`/`useToast`).
   * Rendered verbatim inside `import { … }`. Defaults to `name`.
   */
  importSymbols?: string
  /**
   * Stable `data-cascivo-*` attributes this component stamps on its internal elements, as
   * a public styling contract.
   *
   * CSS Modules hash every internal class name, so a consumer who needs to reach an inner
   * element has no selector at all — one adopter shipped
   * `div:has(> div > nav[aria-label='…'])` to stop `AppShell`'s sidebar shrinking, which
   * breaks the moment the nesting changes (2026-07-28 report C14). These attributes are
   * the supported alternative and are semver-covered.
   *
   * Declaring them here is what makes them discoverable: they flow into `registry.json`,
   * `llms/<name>.md` and the docs site by regeneration. The `style-hooks` parity guard
   * asserts this list matches the `data-cascivo-*` attributes in the component's TSX in
   * both directions, so a renamed or dropped hook cannot ship silently.
   *
   * Prose lives in `docs/STYLING-INTERNALS.md`.
   */
  styleHooks?: string[]
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
  /**
   * True when the component is a **typography primitive** whose children are the page's
   * authored prose, not chrome text the component owns.
   *
   * `cascivo audit --ai`'s `raw-string` rule warns on literal English inside a
   * content-declaring component, to steer chrome labels ("Cancel", "No results") toward
   * the `labels` prop / i18n. Applied to `Text`, `Heading` and friends it fires on every
   * sentence of every page — `<Text>Automatic deployments</Text>` is page copy, not a
   * component label — which trains adopters to ignore the rule and buries the real
   * findings. The distinction is not recoverable from the string, so it is declared here.
   */
  contentPrimitive?: boolean
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
