import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { app, applyBlueprint } from './app.js'
import { CLI_VERSION } from '../generated/versions.js'
import { create } from './create.js'

const dirs: string[] = []

afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
  process.exitCode = undefined
  vi.restoreAllMocks()
})

/** Create an app from a blueprint and return its directory. */
async function scaffold(framework: 'react-vite' | 'cloudflare'): Promise<string> {
  const cwd = mkdtempSync(join(tmpdir(), 'cascivo-app-'))
  dirs.push(cwd)
  vi.spyOn(console, 'log').mockImplementation(() => {})
  writeFileSync(
    join(cwd, 'cascivo.app.json'),
    JSON.stringify({ name: 'acme', framework, pages: [{ title: 'Home', block: 'stats-cards' }] }),
  )
  await create(['--from', 'cascivo.app.json'], cwd)
  expect(process.exitCode).toBeUndefined()
  return join(cwd, 'acme')
}

const read = (dir: string, path: string) => readFileSync(join(dir, path), 'utf8')

describe('cascivo app add page', () => {
  it('writes the page, its block and its nav entry, and records it in the blueprint', async () => {
    const dir = await scaffold('react-vite')
    await app(['add', 'page', 'Team', '--block', 'users-table-page'], dir)
    expect(process.exitCode).toBeUndefined()
    expect(read(dir, 'src/sections/Team.tsx')).toContain('return <UsersTablePage />')
    expect(existsSync(join(dir, 'src/blocks/users-table-page.tsx'))).toBe(true)
    expect(read(dir, 'src/App.tsx')).toContain("label: 'Team'")
    const blueprint: unknown = JSON.parse(read(dir, 'cascivo.app.json'))
    expect(blueprint).toMatchObject({
      pages: [{ title: 'Home' }, { title: 'Team', block: 'users-table-page' }],
    })
  })

  it('keeps your edits to a generated file', async () => {
    const dir = await scaffold('react-vite')
    const app0 = read(dir, 'src/App.tsx')
    writeFileSync(
      join(dir, 'src/App.tsx'),
      app0.replace("'use client'\n", "'use client'\n// mine\n"),
    )
    await app(['add', 'page', 'Team'], dir)
    const merged = read(dir, 'src/App.tsx')
    expect(merged).toContain('// mine')
    expect(merged).toContain("label: 'Team'")
    expect(merged).not.toContain('<<<<<<<')
  })

  it('leaves conflict markers, and fails, when your edit and the change meet', async () => {
    const dir = await scaffold('react-vite')
    const app0 = read(dir, 'src/App.tsx')
    writeFileSync(
      join(dir, 'src/App.tsx'),
      app0.replace("type Section = 'home'", "type Section = 'home' | 'x'"),
    )
    vi.spyOn(console, 'log').mockImplementation(() => {})
    await app(['add', 'page', 'Team'], dir)
    expect(read(dir, 'src/App.tsx')).toContain('<<<<<<<')
    expect(process.exitCode).toBe(1)
  })

  it('adds a route the router and the route table know (cloudflare)', async () => {
    const dir = await scaffold('cloudflare')
    await app(['add', 'page', 'Charts', '--block', 'dashboard-charts'], dir)
    expect(read(dir, 'src/routes/charts.tsx')).toContain('export default function Charts()')
    expect(read(dir, 'src/routes.gen.ts')).toContain("'/charts'")
    // The block brings its package.
    expect(read(dir, 'package.json')).toContain('"@cascivo/charts"')
  })

  it('refuses an unknown block and changes nothing', async () => {
    const dir = await scaffold('react-vite')
    const before = read(dir, 'cascivo.app.json')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await app(['add', 'page', 'Charts', '--block', 'kpi-wall'], dir)
    expect(process.exitCode).toBe(1)
    expect(read(dir, 'cascivo.app.json')).toBe(before)
    expect(existsSync(join(dir, 'src/sections/Charts.tsx'))).toBe(false)
  })

  it('explains itself outside a blueprint app', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'cascivo-app-'))
    dirs.push(cwd)
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    await app(['add', 'page', 'Team'], cwd)
    expect(process.exitCode).toBe(1)
    expect(error.mock.calls.join(' ')).toContain('No cascivo.app.json here')
  })
})

describe('every scaffold is a blueprint app', () => {
  it('records the flags it was created with, stamped with this CLI', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'cascivo-app-'))
    dirs.push(cwd)
    vi.spyOn(console, 'log').mockImplementation(() => {})
    await create(['acme', '--yes', '--theme', 'dark', '--sections', 'Overview, Billing'], cwd)
    const dir = join(cwd, 'acme')
    expect(JSON.parse(read(dir, 'cascivo.app.json'))).toEqual({
      name: 'acme',
      framework: 'react-vite',
      theme: 'dark',
      pages: [{ title: 'Overview' }, { title: 'Billing' }],
      cascivo: CLI_VERSION,
    })
    await app(['add', 'page', 'Team', '--block', 'users-table-page'], dir)
    expect(process.exitCode).toBeUndefined()
    expect(read(dir, 'src/sections/Team.tsx')).toContain('UsersTablePage')
  })
})

describe('cascivo app add example', () => {
  it('adds a cloudflare example: its files, nav entry and route', async () => {
    const dir = await scaffold('cloudflare')
    await app(['add', 'example', 'crud'], dir)
    expect(process.exitCode).toBeUndefined()
    expect(existsSync(join(dir, 'worker/customers.ts'))).toBe(true)
    expect(read(dir, 'src/App.tsx')).toContain("label: 'Customers'")
    expect(read(dir, 'src/routes.gen.ts')).toContain("'/customers'")
    expect(JSON.parse(read(dir, 'cascivo.app.json'))).toMatchObject({ examples: ['crud'] })
  })

  it('holds the change to the flags’ rules', async () => {
    const dir = await scaffold('react-vite')
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    await app(['add', 'example', 'crud'], dir)
    expect(process.exitCode).toBe(1)
    expect(error.mock.calls.join(' ')).toContain('--framework cloudflare')
  })
})

describe('cascivo app upgrade', () => {
  it('says so when the app is already on this version', async () => {
    const dir = await scaffold('react-vite')
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    await app(['upgrade'], dir)
    expect(log.mock.calls.join(' ')).toContain(`Already generated by cascivo@${CLI_VERSION}`)
  })

  it('brings in template changes and keeps your edits', async () => {
    const dir = await scaffold('react-vite')
    const blueprint: unknown = JSON.parse(read(dir, 'cascivo.app.json'))
    const current = read(dir, 'src/App.tsx')
    // Pretend the old CLI generated App.tsx without its `useSignals()` call, and that the
    // adopter has since added a line of their own to that old output.
    const oldTemplate = current.replace('  useSignals()\n', '')
    writeFileSync(
      join(dir, 'src/App.tsx'),
      oldTemplate.replace("'use client'\n", "'use client'\n// mine\n"),
    )
    // Every other file is unchanged between the versions, so only App.tsx is in the old output.
    const original = () => new Map([['src/App.tsx', oldTemplate]])
    const stamped = { ...(blueprint as object), cascivo: '0.0.1' }
    const changes = await applyBlueprint(dir, stamped, stamped, original)
    const merged = read(dir, 'src/App.tsx')
    expect(merged).toContain('// mine')
    expect(merged).toContain('useSignals()')
    expect(changes.find((c) => c.path === 'src/App.tsx')?.outcome).toBe('merged')
    expect(JSON.parse(read(dir, 'cascivo.app.json'))).toMatchObject({ cascivo: CLI_VERSION })
  })
})
