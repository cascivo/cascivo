/**
 * Vendor the Can I email matrix into the package.
 *
 * The preview reads it to show conformance findings, and the copy this repo already keeps
 * lives in `scripts/email/vendor/` — outside every package, so a published tarball cannot
 * reach it. Copying at pack time keeps one source of truth (the reviewed snapshot that the
 * CI lint also reads) while letting the published tool work offline.
 *
 * Missing source is a warning rather than an error: it only means the preview opens with
 * the panel explaining how to supply one, which is the same state an adopter is in before
 * they download it.
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkg = dirname(fileURLToPath(new URL('.', import.meta.url)))
const source = join(pkg, '..', '..', 'scripts', 'email', 'vendor', 'caniemail.json')
const target = join(pkg, 'vendor', 'caniemail.json')

if (!existsSync(source)) {
  console.warn(`copy-caniemail: no matrix at ${source} — preview will ask for one`)
  process.exit(0)
}
mkdirSync(dirname(target), { recursive: true })
copyFileSync(source, target)
console.log('copy-caniemail: vendored the Can I email matrix')
