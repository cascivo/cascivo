/**
 * Axe sweep over every built Storybook story.
 *
 * Serves storybook-static, loads each story in isolation
 * (iframe.html?id=<id>), and runs axe-core with WCAG 2.x A/AA tags. This is
 * the gate behind the "zero axe violations across all component stories"
 * claim — the bench a11y gate only covers four interaction states.
 *
 * Usage: pnpm --filter @cascivo/storybook build && pnpm --filter @cascivo/storybook test:axe
 * Env:   AXE_SHARD=1/3 to split the run; AXE_MAX_STORIES for a quick sample.
 */
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { AxeBuilder } from '@axe-core/playwright'
import { chromium } from '@playwright/test'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const STATIC_DIR = join(ROOT, 'storybook-static')
const CONCURRENCY = 4
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

// Stories whose DOM is too large for a specific rule to finish inside the
// per-story budget. Everything else still runs against the full tag set. The
// large-document editor story holds 50k lines in a textarea + highlight <pre>;
// color-contrast over that DOM blows the 45s guard below.
const RULE_EXCEPTIONS = {
  'editor-codeeditor--large-document': ['color-contrast'],
}

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
}

if (!existsSync(join(STATIC_DIR, 'index.json'))) {
  console.error('storybook-static/index.json not found — run the storybook build first')
  process.exit(2)
}

const index = JSON.parse(readFileSync(join(STATIC_DIR, 'index.json'), 'utf8'))
let stories = Object.values(index.entries).filter((e) => e.type === 'story')

const maxStories = Number(process.env.AXE_MAX_STORIES ?? 0)
if (maxStories > 0) stories = stories.slice(0, maxStories)
const shard = process.env.AXE_SHARD
if (shard) {
  const [n, of] = shard.split('/').map(Number)
  stories = stories.filter((_, i) => i % of === n - 1)
}

const server = createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const file = join(STATIC_DIR, urlPath === '/' ? 'index.html' : urlPath)
  try {
    const body = readFileSync(file)
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404)
    res.end()
  }
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const port = server.address().port

// CHROMIUM_PATH lets CI/sandboxes point at a preinstalled binary instead of
// the playwright-managed download.
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
)
const failures = []
let done = 0

async function auditStory(story) {
  const context = await browser.newContext()
  const page = await context.newPage()
  try {
    await page.goto(`http://127.0.0.1:${port}/iframe.html?id=${story.id}&viewMode=story`, {
      waitUntil: 'networkidle',
      timeout: 30_000,
    })
    // Give signal-driven mount effects a beat to settle.
    await page.waitForTimeout(150)
    // @storybook/addon-a11y bundles its own axe-core into the preview iframe and
    // parks it on window.axe. AxeBuilder injects its own copy; a stale global
    // from the addon triggers "unknown rule" version-mismatch errors. Start clean.
    await page.evaluate(() => {
      delete window.axe
    })
    // analyze() has no internal timeout and can hang on animation-heavy
    // stories — bound it so one story can never stall the sweep.
    let builder = new AxeBuilder({ page }).withTags(TAGS)
    const excludedRules = RULE_EXCEPTIONS[story.id]
    if (excludedRules) builder = builder.disableRules(excludedRules)
    const results = await Promise.race([
      builder.analyze(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('axe analyze timed out (45s)')), 45_000),
      ),
    ])
    if (results.violations.length > 0) {
      failures.push({
        id: story.id,
        title: story.title,
        violations: results.violations.map((v) => ({
          rule: v.id,
          impact: v.impact,
          nodes: v.nodes.length,
          help: v.help,
        })),
      })
    }
  } catch (e) {
    failures.push({ id: story.id, title: story.title, error: String(e).slice(0, 200) })
  } finally {
    await context.close()
    done++
    if (done % 50 === 0) console.log(`  ${done}/${stories.length} stories audited…`)
  }
}

console.log(`Auditing ${stories.length} stories with tags [${TAGS.join(', ')}]…`)
const queue = [...stories]
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) await auditStory(queue.shift())
  }),
)

await browser.close()
// closeAllConnections: keep-alive sockets otherwise hold the event loop open
// and the process never exits after the report.
server.closeAllConnections()
server.close()

if (failures.length > 0) {
  console.error(
    `\n${failures.length} of ${stories.length} stories have axe violations or errors:\n`,
  )
  for (const f of failures) {
    if (f.error) {
      console.error(`  ${f.id}: LOAD ERROR ${f.error}`)
    } else {
      for (const v of f.violations) {
        console.error(`  ${f.id}: ${v.rule} (${v.impact}, ${v.nodes} node(s)) — ${v.help}`)
      }
    }
  }
  process.exit(1)
}
console.log(`\nZero axe violations across ${stories.length} stories.`)
process.exit(0)
