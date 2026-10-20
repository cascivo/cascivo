import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { prepareStarter, SHADCN_VERSION, shadcnMcpConfig } from './starters.ts'

const slow = !process.env.EVAL_SLOW
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
            args: ['-u', 'ANTHROPIC_API_KEY', 'npx', '-y', `shadcn@${SHADCN_VERSION}`, 'mcp'],
          },
        },
      })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

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

  it('cascivo: no template, the shared tree', { skip: slow, timeout: SLOW_MS }, () => {
    const { template, nodeModules } = prepareStarter('cascivo', log)
    expect(template).toBeNull()
    expect(existsSync(join(nodeModules, '@cascivo/react'))).toBe(true)
  })

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
