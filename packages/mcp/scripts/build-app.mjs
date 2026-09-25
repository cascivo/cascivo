/**
 * Build the `show_view` MCP App into dist/view.html: one self-contained page, because an MCP
 * host renders it in a sandboxed iframe with no network — nothing can be fetched at runtime.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(PKG_ROOT, 'dist-app')
const isWin = process.platform === 'win32'

execFileSync('pnpm', ['exec', 'vp', 'build', '--config', 'app/vite.config.ts'], {
  cwd: PKG_ROOT,
  stdio: 'inherit',
  shell: isWin,
})

const js = readFileSync(join(OUT, 'view.js'), 'utf8')
const css = readFileSync(join(OUT, 'view.css'), 'utf8')
// `</script` inside the bundle would end the inline script early.
const safeJs = js.replace(/<\/script/gi, '<\\/script')
const html = `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>cascivo view</title>
<style>${css}</style>
</head>
<body>
<div id="root"></div>
<script type="module">${safeJs}</script>
</body>
</html>
`
mkdirSync(join(PKG_ROOT, 'dist'), { recursive: true })
writeFileSync(join(PKG_ROOT, 'dist', 'view.html'), html)
rmSync(OUT, { recursive: true, force: true })
console.log(`build-app: dist/view.html (${(html.length / 1024).toFixed(0)} KB)`)
