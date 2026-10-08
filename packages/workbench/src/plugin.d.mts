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
export function tagNames(code: string): string[]
export function scopeModule(metas: string[]): string
export function isExpression(code: string): Promise<boolean>
export function examplesModule(examples: unknown[], own?: string | null): Promise<string>
export function entriesModule(root: string, found: { metas: string[]; previews: string[] }): string
export function stylesModule(from: string | string[], extra?: string[]): string
