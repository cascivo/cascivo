import type { Plugin } from 'vite'

export interface WorkbenchOptions {
  /** The directory to scan for `*.meta.ts` and `*.preview.tsx`. */
  dir: string
  /** Stylesheets the project's app loads, imported before any entry renders. */
  styles?: string[]
  /** The project root the stylesheets are resolved from first (default: the cwd). */
  project?: string
}

export function cascivoWorkbench(options: WorkbenchOptions): Plugin
export function scan(dir: string): { metas: string[]; previews: string[] }

/** A page of the app's `cascivo.app.json` that renders a block. */
export interface BlueprintPage {
  /** `app/<page index>-<slug>`. */
  id: string
  title: string
  /** The block's source, `src/blocks/<block>.tsx` beside the blueprint. */
  file: string
  /** The component the block exports. */
  name: string
}

export interface Found {
  metas: string[]
  previews: string[]
  pages?: BlueprintPage[]
}

export function findBlueprint(root: string, project: string): string | null
export function blueprintPages(file: string | null): BlueprintPage[]
export function tagNames(code: string): string[]
export function scopeModule(metas: string[]): string
export function isExpression(code: string): Promise<boolean>
export function examplesModule(examples: unknown[], own?: string | null): Promise<string>
export function entriesModule(root: string, found: Found): string
export function stylesModule(from: string | string[], extra?: string[]): string
export function resolver(from: string | string[]): (specifier: string) => string | null
export function textModule(from: string | string[]): string
export function embedUrl(hash: string, theme?: string): string

export interface IndexEntry {
  /** `<component path>/<example index>`, the preview's path, or the app page's id. */
  id: string
  kind: 'component' | 'preview' | 'page'
  component: string
  title: string
  /** False for an example that is a snippet rather than one JSX expression. */
  renders: boolean
  /** Renders the entry alone; add `&theme=` to change its theme. */
  url: string
}

export function entryIndex(
  root: string,
  found: Found,
  load: (file: string) => Promise<Record<string, unknown>>,
): Promise<{ v: 1; entries: IndexEntry[] }>
