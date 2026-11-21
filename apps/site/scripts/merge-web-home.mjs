// Put the cascivo-web home over the Vite build: dist-web/index.html replaces dist/index.html
// ("/") and dist-web/_cw/** (hashed cascivo-web assets) lands in dist/_cw/. Nothing else is
// copied — sitemap.xml and every other route stay the SPA's. Unknown routes are unaffected:
// Cloudflare Pages serves dist/404.html (the SPA shell) for them, not index.html.
import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const site = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const from = resolve(site, 'dist-web')
const to = resolve(site, 'dist')
if (!existsSync(resolve(from, 'index.html'))) throw new Error('dist-web/index.html missing')
if (!existsSync(resolve(to, '404.html')))
  throw new Error('dist/404.html missing: run the Vite build first')
// Guard: Vite app builds drop entry exports unless `preserveEntrySignatures` keeps them; an
// island chunk without `default` leaves its static fallback on the page with no error.
const manifest = JSON.parse(readFileSync(resolve(to, '.vite/manifest.json'), 'utf8'))
for (const [src, entry] of Object.entries(manifest)) {
  if (!src.startsWith('src/marketing/islands/') || !src.endsWith('.tsx')) continue
  const js = readFileSync(resolve(to, entry.file), 'utf8')
  if (!/export\s*\{[^}]*\bas default\b/.test(js))
    throw new Error(`${entry.file} (${src}) has no default export`)
}
writeFileSync(resolve(to, 'index.html'), readFileSync(resolve(from, 'index.html')))
if (existsSync(resolve(from, '_cw')))
  cpSync(resolve(from, '_cw'), resolve(to, '_cw'), { recursive: true })
console.log('cascivo-web home merged into dist/index.html')
