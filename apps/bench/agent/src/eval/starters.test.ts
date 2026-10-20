import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { removeStaleBuilds, renameIntoPlace } from '../env.ts'
import { prepareStarter, SHADCN_VERSION, shadcnMcpConfig } from './starters.ts'

const slow = !process.env.EVAL_SLOW

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const SLOW_MS = 20 * 60_000

describe('shadcn MCP config', () => {
  it('pins the shadcn CLI and runs its mcp server', () => {
    const dir = mkdtempSync(join(tmpdir(), 'starters-test-'))
    try {
      const path = shadcnMcpConfig(join(dir, 'shadcn.json'))
      expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual({
        mcpServers: {
          shadcn: {
            command: 'env',
            args: [
              '-u',
              'ANTHROPIC_API_KEY',
              'npx',
              '--prefix',
              dir,
              '-y',
              `shadcn@${SHADCN_VERSION}`,
              'mcp',
              // Only where shadcn loads .env files from; its tools still read the session's
              // components.json from the process's working directory.
              '--cwd',
              dir,
            ],
          },
        },
      })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  // shadcn loads the .env files of `--cwd` through dotenvx, which runs `$(…)` in a value.
  it(
    'starts without running a $(…) in a .env of the session directory',
    { skip: slow, timeout: SLOW_MS },
    () => {
      const dir = mkdtempSync(join(tmpdir(), 'starters-env-'))
      try {
        const session = join(dir, 'session')
        mkdirSync(session)
        const marker = join(session, 'ran')
        for (const file of ['.env', '.env.local', '.env.development', '.env.development.local'])
          writeFileSync(join(session, file), `FOO="$(touch ${marker})"\n`)
        const parsed: unknown = JSON.parse(
          readFileSync(shadcnMcpConfig(join(dir, 'shadcn.json')), 'utf8'),
        )
        const servers = isRecord(parsed) ? parsed['mcpServers'] : undefined
        const server = isRecord(servers) ? servers['shadcn'] : undefined
        const command = isRecord(server) ? server['command'] : undefined
        const args = isRecord(server) ? server['args'] : undefined
        if (
          typeof command !== 'string' ||
          !Array.isArray(args) ||
          !args.every((a) => typeof a === 'string')
        )
          throw new Error('no shadcn server in the config')
        // Stdin closed: the server loads its env files, starts, and exits.
        spawnSync(command, args, { cwd: session, input: '', timeout: 120_000 })
        expect(existsSync(marker)).toBe(false)
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    },
  )

  it('pins an exact version, never a range or a tag', () => {
    expect(SHADCN_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })
})

// Real installs from the network: run with EVAL_SLOW=1.
describe('prepareStarter', () => {
  const log = () => {}

  it(
    'shadcn: a Vite app with every shadcn component, and its own node_modules',
    {
      skip: slow,
      timeout: SLOW_MS,
    },
    () => {
      const { template, nodeModules } = prepareStarter('shadcn', log)
      if (template === null) throw new Error('shadcn needs a template')
      expect(existsSync(join(template, 'components.json'))).toBe(true)
      expect(existsSync(join(template, 'src/components/ui/button.tsx'))).toBe(true)
      expect(existsSync(join(template, 'node_modules'))).toBe(false)
      expect(existsSync(join(nodeModules, 'react'))).toBe(true)
      expect(nodeModules).toContain(join('.cache', 'shadcn'))
    },
  )

  it(
    'cascivo: the create-app scaffold with its AI context, minus the published MCP config',
    { skip: slow, timeout: SLOW_MS },
    () => {
      const { template, nodeModules } = prepareStarter('cascivo', log)
      if (template === null) throw new Error('cascivo needs a template')
      expect(existsSync(join(template, 'AGENTS.md'))).toBe(true)
      expect(existsSync(join(template, 'CLAUDE.md'))).toBe(true)
      expect(existsSync(join(template, '.mcp.json'))).toBe(false)
      expect(existsSync(join(template, 'src/App.tsx'))).toBe(true)
      const manifest: unknown = JSON.parse(readFileSync(join(template, 'package.json'), 'utf8'))
      expect(manifest).toMatchObject({
        dependencies: { '@cascivo/react': expect.stringMatching(/^file:.*cascivo-react-/) },
      })
      expect(existsSync(join(nodeModules, '@cascivo/react'))).toBe(true)
      // The same scaffold as cascivo-bare: the arms differ only in the AI context.
      const bare = prepareStarter('cascivo-bare', log).template
      if (bare === null) throw new Error('cascivo-bare needs a template')
      expect(readFileSync(join(bare, 'src/App.tsx'), 'utf8')).toBe(
        readFileSync(join(template, 'src/App.tsx'), 'utf8'),
      )
    },
  )

  it(
    'cascivo-bare: the create-app scaffold on packed tarballs, without the AI context',
    { skip: slow, timeout: SLOW_MS },
    () => {
      const { template, nodeModules } = prepareStarter('cascivo-bare', log)
      if (template === null) throw new Error('cascivo-bare needs a template')
      const manifest = JSON.parse(readFileSync(join(template, 'package.json'), 'utf8')) as {
        dependencies: Record<string, string>
        devDependencies: Record<string, string>
      }
      expect(manifest.dependencies['@cascivo/react']).toMatch(/^file:.*cascivo-react-/)
      expect(manifest.devDependencies['@cascivo/eslint-config']).toBeUndefined()
      for (const aiContext of ['AGENTS.md', 'CLAUDE.md', '.mcp.json']) {
        expect(existsSync(join(template, aiContext))).toBe(false)
      }
      expect(existsSync(join(template, 'src/App.tsx'))).toBe(true)
      expect(existsSync(join(nodeModules, '@cascivo/react'))).toBe(true)
    },
  )
})

describe('cache builds', () => {
  it('moves a finished build into place, or keeps the one another build already put there', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cache-build-'))
    try {
      const target = join(dir, 'scaffold')
      const first = join(dir, 'scaffold-a')
      mkdirSync(first)
      writeFileSync(join(first, 'from'), 'a')
      renameIntoPlace(first, target)
      expect(readFileSync(join(target, 'from'), 'utf8')).toBe('a')

      const second = join(dir, 'scaffold-b')
      mkdirSync(second)
      writeFileSync(join(second, 'from'), 'b')
      renameIntoPlace(second, target)
      expect(readFileSync(join(target, 'from'), 'utf8')).toBe('a')
      expect(existsSync(second)).toBe(false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('removes build directories left for over an hour, and only those', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cache-stale-'))
    try {
      for (const name of ['scaffold-old', 'scaffold-new', 'scaffold', 'deps']) {
        mkdirSync(join(dir, name))
      }
      const twoHoursAgo = new Date(Date.now() - 2 * 3_600_000)
      utimesSync(join(dir, 'scaffold-old'), twoHoursAgo, twoHoursAgo)
      utimesSync(join(dir, 'deps'), twoHoursAgo, twoHoursAgo)
      removeStaleBuilds(dir, 'scaffold-')
      expect(readdirSync(dir).sort()).toEqual(['deps', 'scaffold', 'scaffold-new'])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
