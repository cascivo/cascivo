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
if (!existsSync(resolve(to, '404.html'))) throw new Error('dist/404.html missing: run the Vite build first')
writeFileSync(resolve(to, 'index.html'), readFileSync(resolve(from, 'index.html')))
if (existsSync(resolve(from, '_cw'))) cpSync(resolve(from, '_cw'), resolve(to, '_cw'), { recursive: true })
console.log('cascivo-web home merged into dist/index.html')
