import { resolve } from 'node:path'
import { configToCSS, hashToConfig } from '@cascivo/theme-kit'
import { THEMES } from '../utils/config.js'
import { installPackages } from '../utils/exec.js'
import { writeFileSafe } from '../utils/fs.js'

const THEME_NAME_RE = /^[a-z][a-z0-9-]*$/

/** Read a `--key value` or `--key=value` flag from an argv slice. */
function flag(args: string[], key: string): string | undefined {
  const eq = args.find((a) => a.startsWith(`--${key}=`))
  if (eq) return eq.slice(key.length + 3)
  const idx = args.indexOf(`--${key}`)
  const next = idx !== -1 ? args[idx + 1] : undefined
  return next && !next.startsWith('--') ? next : undefined
}

/**
 * `cascivo theme create <name> --from <hash>` — turn a /create theme-builder
 * config (the `#hash` in the builder URL, or its "Copy CLI command" output) into
 * an owned `<name>.theme.css` in the project. Uses the same generator the builder
 * previews with, so the file matches the preview exactly.
 */
async function themeCreate(args: string[], cwd: string): Promise<void> {
  const name = args.find((a) => !a.startsWith('--'))
  const hash = flag(args, 'from')
  const dryRun = args.includes('--dry-run')

  if (!name || !hash) {
    console.error('Usage: cascivo theme create <name> --from <hash> [--out <path>]')
    console.error(
      'Get <hash> from the theme builder at https://cascivo.com/create (Copy CLI command).',
    )
    return
  }
  if (!THEME_NAME_RE.test(name)) {
    console.error(`Invalid theme name "${name}". Use lowercase letters, digits, and dashes.`)
    return
  }

  const config = hashToConfig(hash)
  if (!config) {
    console.error('Could not decode --from. Copy the command again from the theme builder.')
    return
  }

  const css = configToCSS(config, { themeName: name })
  if (dryRun) {
    console.log(css)
    return
  }

  const outPath = resolve(cwd, flag(args, 'out') ?? `${name}.theme.css`)
  await writeFileSafe(outPath, css)

  console.log(`\n✓ Wrote ${name}.theme.css`)
  console.log(`\nImport the base theme and your overlay in your entry CSS:`)
  console.log(`  @import '@cascivo/themes/${config.baseMode}.css';`)
  console.log(`  @import './${name}.theme.css';`)
  console.log(`Then set it on a container:`)
  console.log(`  <div data-theme="${name}">…</div>`)
}

export async function theme(args: string[]): Promise<void> {
  const [sub, name] = args

  if (sub === 'create') {
    await themeCreate(args.slice(1), process.cwd())
    return
  }

  if (sub !== 'add' || !name) {
    console.error(`Usage: cascivo theme add <${THEMES.join('|')}>`)
    console.error(`       cascivo theme create <name> --from <hash>`)
    return
  }
  if (!(THEMES as readonly string[]).includes(name)) {
    console.error(`Unknown theme "${name}". Available: ${THEMES.join(', ')}`)
    return
  }

  installPackages(['@cascivo/themes'])

  console.log(`\nImport the theme in your root CSS or entry file:`)
  console.log(`  import '@cascivo/themes/${name}.css'`)
  console.log(`Then set it on a container:`)
  console.log(`  <div data-theme="${name}">…</div>`)
}
