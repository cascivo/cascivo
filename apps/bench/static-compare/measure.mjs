#!/usr/bin/env node
// Measures the same 20-page site built with cascivo-web (rust/) and Astro + @cascivo/astro
// (astro/): cold build, edit→render latency in dev, output bytes, page JS, authored LOC and
// dependency count. Writes results.json next to this file and prints a Markdown table.
//
// Prerequisites: `cargo build --release -p cascivo-web` and `pnpm install` (plus the workspace
// build the Astro app needs). Usage: node apps/bench/static-compare/measure.mjs [--runs 3]
import { spawn, execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, readdirSync, statSync, rmSync, existsSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '../../..')
const RUST = join(HERE, 'rust')
const ASTRO = join(HERE, 'astro')
const BIN = join(ROOT, 'target/release/cascivo-web')
const RUNS = Number(process.argv[process.argv.indexOf('--runs') + 1]) || 3
const EDITS = 5
const POST = 'blog/01-signals/'

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function files(dir, keep = () => true) {
  if (!existsSync(dir)) return []
  const out = []
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === '.astro' || name.startsWith('.'))
      continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...files(p, keep))
    else if (keep(p)) out.push(p)
  }
  return out
}

function allFiles(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...allFiles(p))
    else out.push(p)
  }
  return out
}

function timed(cmd, args, cwd) {
  const t = performance.now()
  execFileSync(cmd, args, { cwd, stdio: 'ignore' })
  return performance.now() - t
}

function coldBuild(site) {
  const ms = []
  for (let i = 0; i < RUNS; i++) {
    rmSync(join(site.dir, 'dist'), { recursive: true, force: true })
    for (const c of site.caches ?? []) rmSync(join(site.dir, c), { recursive: true, force: true })
    ms.push(timed(site.build[0], site.build.slice(1), site.dir))
  }
  return median(ms)
}

function outputStats(dist) {
  const all = allFiles(dist)
  const by = (ext) => all.filter((f) => extname(f) === ext)
  const bytes = (fs) => fs.reduce((n, f) => n + statSync(f).size, 0)
  const gz = (fs) => fs.reduce((n, f) => n + gzipSync(readFileSync(f)).length, 0)
  const page = readFileSync(join(dist, POST, 'index.html'), 'utf8')
  const inline = [...page.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
    .filter((m) => !/\bsrc=/.test(m[0]))
    .reduce((n, m) => n + Buffer.byteLength(m[1]), 0)
  const external = [...page.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].reduce((n, m) => {
    const f = join(dist, m[1].replace(/^\//, ''))
    return n + (existsSync(f) ? statSync(f).size : 0)
  }, 0)
  return {
    pages: all.filter((f) => f.endsWith('index.html')).length,
    totalBytes: bytes(all),
    totalGzip: gz(all),
    htmlBytes: bytes(by('.html')),
    cssBytes: bytes(by('.css')),
    jsFilesBytes: bytes([...by('.js'), ...by('.mjs')]),
    postPageJsBytes: inline + external,
  }
}

function loc(site) {
  const count = (fs) =>
    fs.reduce(
      (n, f) =>
        n +
        readFileSync(f, 'utf8')
          .split('\n')
          .filter((l) => l.trim()).length,
      0,
    )
  const authored = files(site.dir, (f) => !f.endsWith('package.json'))
  const content = authored.filter((f) => site.isContent(f))
  return {
    files: authored.length,
    content: count(content),
    code: count(authored.filter((f) => !site.isContent(f))),
  }
}

async function get(url) {
  try {
    const r = await fetch(url, { cache: 'no-store' })
    return { status: r.status, text: await r.text() }
  } catch {
    return { status: 0, text: '' }
  }
}

async function editLatency(site) {
  const proc = spawn(site.dev[0], site.dev.slice(1), {
    cwd: site.dir,
    stdio: 'ignore',
    detached: true,
  })
  const url = `http://127.0.0.1:${site.port}/${POST}`
  const file = join(site.dir, site.postFile)
  const original = readFileSync(file, 'utf8')
  const ms = []
  try {
    const start = performance.now()
    while ((await get(url)).status !== 200) {
      if (performance.now() - start > 60_000) throw new Error(`${site.name} dev never served`)
      await sleep(100)
    }
    for (let i = 0; i < EDITS; i++) {
      const marker = `edit-marker-${Date.now()}-${i}`
      writeFileSync(file, original.replace('This post covers', `${marker} This post covers`))
      const t = performance.now()
      while (!(await get(url)).text.includes(marker)) {
        if (performance.now() - t > 30_000) throw new Error(`${site.name}: edit never rendered`)
        await sleep(5)
      }
      ms.push(performance.now() - t)
      await sleep(300)
    }
  } finally {
    writeFileSync(file, original)
    // `astro dev` (v7) detaches into a daemon, so the spawned pid may already be gone.
    try {
      process.kill(-proc.pid, 'SIGTERM')
    } catch {}
    if (site.stop)
      execFileSync(site.stop[0], site.stop.slice(1), { cwd: site.dir, stdio: 'ignore' })
  }
  return { median: median(ms), max: Math.max(...ms), samples: ms.map((x) => Math.round(x)) }
}

function depCount(site) {
  try {
    return site.deps()
  } catch {
    return null
  }
}

const sites = [
  {
    name: 'rust (cascivo-web)',
    dir: RUST,
    build: [BIN, 'build', '.', '--out', 'dist'],
    dev: [BIN, 'dev', '.', '--port', '4401'],
    port: 4401,
    postFile: 'content/posts/01-signals.md',
    isContent: (f) => f.includes('/content/'),
    deps: () =>
      new Set(
        execFileSync(
          'cargo',
          ['tree', '-p', 'cascivo-web', '-e', 'normal', '--prefix', 'none', '--no-dedupe'],
          { cwd: ROOT, encoding: 'utf8' },
        )
          .split('\n')
          .filter(Boolean)
          .map((l) => l.split(' ')[0]),
      ).size - 1,
  },
  {
    name: 'astro (@cascivo/astro)',
    dir: ASTRO,
    build: ['pnpm', 'exec', 'astro', 'build'],
    caches: ['.astro', 'node_modules/.vite', 'node_modules/.astro'],
    dev: ['pnpm', 'exec', 'astro', 'dev', '--port', '4402', '--host', '127.0.0.1'],
    stop: ['pnpm', 'exec', 'astro', 'dev', 'stop'],
    port: 4402,
    postFile: 'src/content/posts/01-signals.mdx',
    isContent: (f) => f.includes('/src/content/') && !f.endsWith('content.config.ts'),
    deps: () =>
      new Set(
        execFileSync('pnpm', ['list', '--prod', '--depth', 'Infinity', '--parseable'], {
          cwd: ASTRO,
          encoding: 'utf8',
        })
          .split('\n')
          .filter((l) => l.includes('node_modules')),
      ).size,
  },
]

const results = { date: new Date().toISOString().slice(0, 10), runs: RUNS, sites: {} }
for (const s of sites) {
  const r = { coldBuildMs: Math.round(coldBuild(s)) }
  Object.assign(r, outputStats(join(s.dir, 'dist')))
  r.editToRenderMs = await editLatency(s)
  r.loc = loc(s)
  r.runtimeDeps = depCount(s)
  results.sites[s.name] = r
  console.error(`${s.name}: done`)
}
writeFileSync(join(HERE, 'results.json'), `${JSON.stringify(results, null, 2)}\n`)

const rows = [
  ['cold build (ms, median)', (r) => r.coldBuildMs],
  [
    'edit→render (ms, median / max)',
    (r) => `${Math.round(r.editToRenderMs.median)} / ${Math.round(r.editToRenderMs.max)}`,
  ],
  ['pages', (r) => r.pages],
  ['output bytes (raw / gzip)', (r) => `${r.totalBytes} / ${r.totalGzip}`],
  ['HTML bytes', (r) => r.htmlBytes],
  ['CSS bytes', (r) => r.cssBytes],
  ['JS files bytes', (r) => r.jsFilesBytes],
  ['post page JS bytes', (r) => r.postPageJsBytes],
  ['authored files', (r) => r.loc.files],
  ['authored LOC (code / content)', (r) => `${r.loc.code} / ${r.loc.content}`],
  ['runtime deps (crates / npm packages)', (r) => r.runtimeDeps ?? 'n/a'],
]
const names = Object.keys(results.sites)
console.log(`| metric | ${names.join(' | ')} |\n|---|${names.map(() => '---').join('|')}|`)
for (const [label, f] of rows)
  console.log(`| ${label} | ${names.map((n) => f(results.sites[n])).join(' | ')} |`)
