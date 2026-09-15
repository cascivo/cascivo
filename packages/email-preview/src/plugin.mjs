/**
 * The two virtual modules that make this app work outside the cascivo monorepo.
 *
 * The UI cannot import an adopter's templates by path — it does not know where they are
 * until the bin is run — and it cannot import the Can I email matrix by a relative path
 * either, because that path only exists inside this repo. Both arrive as virtual modules
 * the plugin generates from what the bin resolved.
 *
 * Vite, rather than a bespoke loader, is doing the real work here: an adopter's templates
 * are `.tsx`, Node cannot load those, and the whole value of a preview is the edit / look /
 * edit loop, which is HMR. Putting their files in Vite's module graph gets both for free.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const TEMPLATES_ID = 'virtual:cascivo-email-templates'
const CANIEMAIL_ID = 'virtual:cascivo-caniemail'

/** Files that can hold a template. `.jsx` included: not every project is TypeScript. */
const TEMPLATE_FILE = /\.(tsx|jsx)$/

/** Skip what is never a template, so a stray test file does not become a preview entry. */
const IGNORED = /(\.test\.|\.spec\.|\.stories\.|^_)/

function walk(dir, out = []) {
  for (const entry of readdirSync(dir).sort()) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (TEMPLATE_FILE.test(entry) && !IGNORED.test(entry)) out.push(full)
  }
  return out
}

/** `emails/weekly/issue.tsx` → `weekly/issue`. Stable, readable, and unique per file. */
function idFor(root, file) {
  return relative(root, file).replace(TEMPLATE_FILE, '').replaceAll('\\', '/')
}

/**
 * Generate the templates module.
 *
 * Each file contributes its default export as the element to render, plus two optional
 * named exports: `subject` (string) and `previewProps` (props to render it with). That is
 * React Email's convention, and an adopter porting a directory of templates should not have
 * to learn a second one.
 */
function templatesModule(dir) {
  if (!dir) {
    // No directory given — the built-in templates, which is what the monorepo dev server and
    // a first `npx` with no arguments should show rather than an empty sidebar.
    return `
import { PasswordReset, passwordResetSubject, Receipt, receiptSubject, Welcome, welcomeSubject } from '@cascivo/email'
export const source = null
export const templates = [
  { id: 'welcome', name: 'Welcome', Component: Welcome, subject: welcomeSubject(), props: {} },
  { id: 'password-reset', name: 'Password reset', Component: PasswordReset, subject: passwordResetSubject(), props: {} },
  { id: 'receipt', name: 'Receipt', Component: Receipt, subject: receiptSubject(), props: {} },
]
`
  }

  const files = walk(dir)
  const imports = files
    .map((file, i) => `import * as m${i} from ${JSON.stringify(file)}`)
    .join('\n')
  const entries = files
    .map(
      (file, i) =>
        `  { id: ${JSON.stringify(idFor(dir, file))}, name: ${JSON.stringify(idFor(dir, file))},` +
        ` Component: m${i}.default, subject: m${i}.subject ?? '', props: m${i}.previewProps ?? {} }`,
    )
    .join(',\n')

  return `${imports}\nexport const source = ${JSON.stringify(dir)}\nexport const templates = [\n${entries}\n].filter((t) => typeof t.Component === 'function')\n`
}

/**
 * Serve the templates and the conformance matrix as virtual modules.
 *
 * @param {{ dir?: string | null, caniemail?: string | null }} options
 */
export function cascivoEmailPreview({ dir = null, caniemail = null } = {}) {
  const templatesDir = dir ? resolve(dir) : null
  return {
    name: 'cascivo-email-preview',
    resolveId(id) {
      if (id === TEMPLATES_ID || id === CANIEMAIL_ID) return `\0${id}`
      return null
    },
    load(id) {
      if (id === `\0${TEMPLATES_ID}`) return templatesModule(templatesDir)
      if (id === `\0${CANIEMAIL_ID}`) {
        // Absent rather than fatal: the conformance panel is the best thing in the preview,
        // but a missing 483 KB dataset is no reason to refuse to render a template at all.
        // The UI shows how to supply it instead.
        if (!caniemail) return 'export default null'
        return `export default ${readFileSync(caniemail, 'utf8')}`
      }
      return null
    },
    configureServer(server) {
      if (!templatesDir) return
      // Vite watches its own root, and the templates are somewhere else entirely.
      server.watcher.add(templatesDir)

      // Editing a template is an ordinary module change and Vite handles it. Adding or
      // deleting one is not: the generated module lists the files the scan found, and Vite
      // tracks a module's dependencies rather than the scan that produced it, so nothing
      // tells it the list is stale. `handleHotUpdate` does not help — it fires on `change`,
      // never on `add`, which is why a new template used to need a restart.
      const rescan = (file) => {
        if (!TEMPLATE_FILE.test(file) || IGNORED.test(file)) return
        const mod = server.moduleGraph.getModuleById(`\0${TEMPLATES_ID}`)
        if (mod)
          server.moduleGraph.invalidateModule(mod)
          // A changed template list is a changed sidebar, which no HMR patch can express.
          // `hot` is the current channel and `ws` the older name for it.
        ;(server.hot ?? server.ws)?.send({ type: 'full-reload' })
      }
      server.watcher.on('add', rescan)
      server.watcher.on('unlink', rescan)
    },
  }
}
