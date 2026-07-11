export interface RegistryFile {
  url: string
  target?: string
}

export type RegistryItemType =
  | 'component'
  | 'layout'
  | 'block'
  | 'chart'
  | 'section'
  | 'theme'
  | 'style'
  | 'template'

/** Light/dark preview images for a template, shown in the marketplace gallery. */
export interface TemplateScreenshot {
  /** URL of the light-theme screenshot. */
  light: string
  /** URL of the dark-theme screenshot (optional). */
  dark?: string
  /** Alt text — required for accessibility. */
  alt: string
}

/** The role a template's own file plays once installed. Keyed by `files[].target`. */
export type TemplateFileRole = 'page' | 'fixture' | 'asset' | 'config'

/**
 * Gallery + install metadata carried in a template item's `meta` field.
 *
 * For a `type: 'template'` RegistryItem: the bundled components are listed in
 * `registryDependencies`, the template's own novel source (page/fixtures/assets)
 * is listed in `files` (each with a `target`), and this object describes how to
 * present and install it. Templates ride the existing registry transport — there
 * is no separate manifest format.
 */
export interface TemplateMeta {
  /** One-line description of what the template builds (e.g. "Analytics dashboard"). */
  intent: string
  /** The framework the template's page source targets. */
  framework: 'react-vite' | 'react-next'
  /** Discovery category (e.g. "dashboard", "marketing", "auth"). */
  category: string
  /** Preview images for the gallery — at least one required. */
  screenshots: TemplateScreenshot[]
  /** URL of a live demo (typically the author's GitHub Pages deploy). */
  demoUrl?: string
  /** Maps each `files[].target` to the role it plays once installed. */
  fileRoles: Record<string, TemplateFileRole>
  /** Named pages the template installs, for previews and routing hints. */
  pages?: { name: string; target: string }[]
}

export interface RegistryAdvisory {
  id: string
  severity: 'low' | 'moderate' | 'high' | 'critical'
  affectedVersions: string
  fixedIn?: string
  summary: string
  refs?: string[]
}

/**
 * A single registry item.
 *
 * For `type: 'template'`: `registryDependencies` lists the components the
 * template composes, `files` are the template's *own* source (page/fixtures/
 * assets — not component source), and `meta` is a {@link TemplateMeta}.
 */
export interface RegistryItem {
  schemaVersion: 2
  name: string
  type: RegistryItemType
  description: string
  category?: string
  version: string
  changelog?: { version: string; note: string }[]
  author?: string
  license?: string
  homepage?: string
  files: RegistryFile[]
  install?: string
  /** Stylesheet the npm package requires, e.g. `@cascivo/charts/styles.css`. */
  styles?: string
  dependencies: string[]
  registryDependencies?: string[]
  tags: string[]
  meta?: unknown
  advisories?: RegistryAdvisory[]
}

export interface RegistryIndex {
  schemaVersion: 2
  name: string
  homepage?: string
  items: RegistryItem[]
}

export interface LegacyRegistryEntry {
  name: string
  type: string
  description: string
  category: string
  version: string
  files: string[]
  install?: string
  styles?: string
  dependencies: string[]
  tags: string[]
  meta?: unknown
}

export interface LegacyRegistry {
  version: string
  generatedAt: string
  components: LegacyRegistryEntry[]
}
