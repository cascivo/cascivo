import { createGzip } from 'node:zlib'
import { createReadStream, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../..', import.meta.url))

const BUDGETS = [
  { pkg: '@cascivo/react', distFile: 'packages/react/dist/index.mjs', maxGzipKB: 50 },
  { pkg: '@cascivo/charts', distFile: 'packages/charts/dist/index.mjs', maxGzipKB: 80 },
  // Lightweight by design: the full editor (engine + all grammars + both React
  // surfaces) tree-shakes to a few KB; one grammar + the engine is far smaller.
  { pkg: '@cascivo/editor', distFile: 'packages/editor/dist/index.js', maxGzipKB: 20 },
]

// @cascivo/ai budget checked separately — it may not have a dist yet
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

const failures: string[] = []

for (const { pkg, distFile, maxGzipKB } of BUDGETS) {
  const fullPath = join(root, distFile)
  try {
    statSync(fullPath)
    const bytes = await gzipSize(fullPath)
    const kb = bytes / 1024
    if (kb > maxGzipKB) {
      failures.push(`${pkg}: ${kb.toFixed(1)} KB gzip > budget ${maxGzipKB} KB`)
    } else {
      console.log(`✓ ${pkg}: ${kb.toFixed(1)} KB gzip (budget: ${maxGzipKB} KB)`)
    }
  } catch {
    console.log(`⚠ ${pkg}: dist not found at ${distFile} — build first`)
  }
}

if (failures.length > 0) {
  console.error('\nBundle budget failures:\n' + failures.map((f) => `  ✗ ${f}`).join('\n'))
  process.exit(1)
}
console.log('\nAll checked bundles within budget.')
