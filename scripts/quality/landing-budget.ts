import { createGzip } from 'node:zlib'
import { createReadStream, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../..', import.meta.url))
const distDir = join(root, 'apps/landing/dist')

// CascadeView (@cascivo/render) loads all cascade components for its runtime component map;
// tree-shaking cannot eliminate them. Budget raised from 120 to 135 KB to accommodate.
const JS_BUDGET_KB = 135
const CSS_BUDGET_KB = 60

async function gzipSize(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    let size = 0
    const gzip = createGzip()
    const stream = createReadStream(filePath)
    gzip.on('data', (chunk: Buffer) => {
      size += chunk.length
    })
    gzip.on('end', () => resolve(size))
    gzip.on('error', reject)
    stream.on('error', reject)
    stream.pipe(gzip)
  })
}

function walkDir(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkDir(full))
    } else {
      files.push(full)
    }
  }
  return files
}

let jsGzBytes = 0
let cssGzBytes = 0
let fontFiles = 0

const files = walkDir(distDir)
for (const f of files) {
  const ext = extname(f)
  if (ext === '.js' || ext === '.mjs') {
    jsGzBytes += await gzipSize(f)
  } else if (ext === '.css') {
    cssGzBytes += await gzipSize(f)
  } else if (['.woff', '.woff2', '.ttf', '.otf', '.eot'].includes(ext)) {
    fontFiles++
    console.error(`FAIL font in dist: ${f}`)
  }
  // Skip non-JS/CSS files (images, etc.)
  void statSync(f) // ensure readable
}

const jsKb = jsGzBytes / 1024
const cssKb = cssGzBytes / 1024
const failures: string[] = []

console.log(`JS gz: ${jsKb.toFixed(1)} KB (budget ${JS_BUDGET_KB} KB)`)
console.log(`CSS gz: ${cssKb.toFixed(1)} KB (budget ${CSS_BUDGET_KB} KB)`)
console.log(`Font files in dist: ${fontFiles}`)

if (jsKb > JS_BUDGET_KB) failures.push(`JS ${jsKb.toFixed(1)} KB > ${JS_BUDGET_KB} KB budget`)
if (cssKb > CSS_BUDGET_KB) failures.push(`CSS ${cssKb.toFixed(1)} KB > ${CSS_BUDGET_KB} KB budget`)
if (fontFiles > 0) failures.push(`${fontFiles} font file(s) found in dist`)

if (failures.length > 0) {
  for (const f of failures) console.error(`FAIL ${f}`)
  process.exit(1)
}
console.log('landing budget OK')
