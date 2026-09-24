import { realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

export type ViewToMarkdown = (
  config: unknown,
  options?: { data?: Record<string, unknown> },
) => string

export type LoadResult =
  | { ok: true; viewToMarkdown: ViewToMarkdown }
  | { ok: false; reason: string }

export const INSTALL_HINT =
  'render_view_as_markdown renders real components, so it runs @cascivo/render from your project ' +
  'rather than bundling React into this server. Install it next to your app, then call the tool ' +
  'again:\n\n  npm install @cascivo/render react react-dom @preact/signals-react'

/**
 * Load `viewToMarkdown` from the project the agent is working in.
 *
 * The server stays a React-free Node binary on purpose (see validate.ts); rendering needs React
 * and every component, which the adopter's project already has once it uses cascivo. Resolving
 * from `cwd` also means the Markdown comes from the exact component versions the project ships.
 */
export async function loadViewToMarkdown(cwd: string): Promise<LoadResult> {
  let resolved: string
  try {
    resolved = createRequire(join(cwd, 'package.json')).resolve('@cascivo/render/text')
  } catch {
    return { ok: false, reason: INSTALL_HINT }
  }
  // Node's resolver also consults NODE_PATH and global folders, which npx and pnpm populate. A
  // copy found there is not the project's, so it would render other component versions.
  if (!insideProjectNodeModules(resolved, cwd)) return { ok: false, reason: INSTALL_HINT }
  let mod: unknown
  try {
    mod = await import(pathToFileURL(resolved).href)
  } catch (err) {
    return {
      ok: false,
      reason: `@cascivo/render/text was found but failed to load: ${(err as Error).message}\n\n${INSTALL_HINT}`,
    }
  }
  if (
    typeof mod === 'object' &&
    mod !== null &&
    'viewToMarkdown' in mod &&
    typeof mod.viewToMarkdown === 'function'
  ) {
    return { ok: true, viewToMarkdown: mod.viewToMarkdown as ViewToMarkdown }
  }
  return {
    ok: false,
    reason: 'The installed @cascivo/render has no viewToMarkdown export — upgrade @cascivo/render.',
  }
}

/** True when `file` sits in a node_modules folder of `cwd` or one of its ancestors. */
function insideProjectNodeModules(file: string, cwd: string): boolean {
  let dir = realpathSync(cwd)
  for (;;) {
    if (file.startsWith(join(dir, 'node_modules') + sep)) return true
    const parent = dirname(dir)
    if (parent === dir) return false
    dir = parent
  }
}
