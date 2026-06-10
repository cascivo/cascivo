import { installPackages } from '../utils/exec.js'

const THEMES = ['light', 'dark', 'warm']

export async function theme(args: string[]): Promise<void> {
  const [sub, name] = args
  if (sub !== 'add' || !name) {
    console.error('Usage: cascade theme add <light|dark|warm>')
    return
  }
  if (!THEMES.includes(name)) {
    console.error(`Unknown theme "${name}". Available: ${THEMES.join(', ')}`)
    return
  }

  installPackages(['@cascade-ui/themes'])

  console.log(`\nImport the theme in your root CSS or entry file:`)
  console.log(`  import '@cascade-ui/themes/${name}.css'`)
  console.log(`Then set it on a container:`)
  console.log(`  <div data-theme="${name}">…</div>`)
}
