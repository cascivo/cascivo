/**
 * Assistive-technology sweep — drives a real screen reader over each planned
 * component's Storybook story and records what it announces.
 *
 * Runs ONLY on the AT workflow runners (.github/workflows/a11y-at.yml):
 *   - macOS  → VoiceOver (AT_SR=voiceover, AT_STACK_ID=voiceover-safari)
 *   - Windows→ NVDA      (AT_SR=nvda,      AT_STACK_ID=nvda-chrome)
 * via guidepup, which needs a headed browser + the OS screen reader — neither is
 * available on a normal Linux dev box or in the standard test gate.
 *
 * Set AT_SELF_CHECK=1 to exercise the pure pipeline (serve storybook-static,
 * resolve stories, grade, merge, write) with synthesized phrases and NO screen
 * reader — used to verify the harness plumbing off-CI.
 *
 * Output: writes the merged results JSON to AT_OUT (default: the committed
 * apps/site/.../at-results.json). In CI each OS job writes its own stack column;
 * the workflow uploads the file as an artifact for a maintainer to commit.
 */
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { EXPECTED, gradeComponent, mergeStackResults, resolveStories } from './at-lib.mjs'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const STATIC_DIR = join(ROOT, 'storybook-static')
const RESULTS_PATH =
  process.env.AT_OUT ?? join(ROOT, '../site/src/marketing/pages/accessibility/at-results.json')
const SELF_CHECK = process.env.AT_SELF_CHECK === '1'
const SR = process.env.AT_SR ?? (SELF_CHECK ? 'self' : '')
const STACK_ID = process.env.AT_STACK_ID ?? (SELF_CHECK ? 'nvda-chrome' : '')
const RUN_DATE = process.env.AT_DATE // pass an ISO date in CI (no Date.now in committed output otherwise)

if (!STACK_ID) {
  console.error('AT_STACK_ID is required (e.g. nvda-chrome, voiceover-safari).')
  process.exit(2)
}
if (!existsSync(join(STATIC_DIR, 'index.json'))) {
  console.error('storybook-static/index.json not found — run the storybook build first')
  process.exit(2)
}

const index = JSON.parse(readFileSync(join(STATIC_DIR, 'index.json'), 'utf8'))
const resultsFile = JSON.parse(readFileSync(RESULTS_PATH, 'utf8'))
const stories = resolveStories(index, resultsFile.components)

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
const storyUrl = (id) => `http://127.0.0.1:${port}/iframe.html?id=${id}&viewMode=story`

/**
 * Drive the screen reader over one story and return the phrases it spoke. CI-only
 * (guidepup + headed browser). Kept in one place so the rest of the sweep is
 * screen-reader-agnostic.
 */
async function readStory(url) {
  const { voiceOver, nvda } = await import('@guidepup/guidepup')
  const sr = SR === 'voiceover' ? voiceOver : nvda
  const { webkit, chromium } = await import('playwright')
  const engine = SR === 'voiceover' ? webkit : chromium

  const phrases = []
  await sr.start()
  const browser = await engine.launch({ headless: false })
  try {
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })
    await page.waitForTimeout(500)
    // Walk a bounded number of stops from the top of the web content, collecting
    // what is announced. The first interactive stop is the component under test.
    for (let i = 0; i < 6; i++) {
      await sr.next()
      phrases.push(await sr.lastSpokenPhrase())
    }
    // Activate the control and capture the resulting announcement (state change).
    await sr.act()
    phrases.push(await sr.lastSpokenPhrase())
  } finally {
    await browser.close()
    await sr.stop()
  }
  return phrases
}

const graded = {}
try {
  for (const s of stories) {
    let phrases
    if (SELF_CHECK) {
      // Synthesize a passing announcement so the pipeline is exercisable without
      // a screen reader. NOT a real result — AT_SELF_CHECK output is never committed.
      phrases = [`${(EXPECTED[s.name] ?? ['element'])[0]} ${s.name}`]
    } else {
      phrases = await readStory(storyUrl(s.id))
    }
    graded[s.name] = gradeComponent(s.name, phrases)
    console.log(`  ${s.name}: ${graded[s.name].status} — ${graded[s.name].phrase.slice(0, 80)}`)
  }
} finally {
  server.closeAllConnections()
  server.close()
}

const date = SELF_CHECK ? 'self-check' : (RUN_DATE ?? 'unknown')
const merged = mergeStackResults(resultsFile, STACK_ID, graded, date)
writeFileSync(RESULTS_PATH, `${JSON.stringify(merged, null, 2)}\n`, 'utf8')
console.log(`\nWrote ${STACK_ID} results (${stories.length} components) to ${RESULTS_PATH}`)
