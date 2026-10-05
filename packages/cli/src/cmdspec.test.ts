/**
 * `cmdspec.json` describes this CLI to agents (`docspack sync` indexes it from the installed
 * package) and `--help` describes it to people. Both are hand-written, so this holds them to the
 * same commands and the same flags — a flag added to one and not the other fails here, not in an
 * agent that runs a command line the CLI does not accept.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { validate } from '@docspack/cmdspec/validate'
import type { Command, CommandBody } from '@docspack/cmdspec'
import { run } from './index.js'

const spec: unknown = JSON.parse(readFileSync(join(import.meta.dirname, '../cmdspec.json'), 'utf8'))

const result = validate(spec)
if (!result.valid) {
  throw new Error(
    `cmdspec.json is not valid cmdspec:\n${result.problems.map((p) => `  ${p.at}: ${p.message}`).join('\n')}`,
  )
}
const document = result.document

/** Every spelling a command and its subcommands accept, minus the inherited `--help`. */
function spellings(command: CommandBody): Set<string> {
  const out = new Set<string>()
  const visit = (body: CommandBody): void => {
    for (const option of body.options ?? []) {
      // A `$ref` would hide its spellings from this check; this document has none.
      if (!('name' in option)) throw new Error('cmdspec.json: resolve $ref options inline')
      for (const name of [option.name, ...(option.aliases ?? [])]) out.add(name)
    }
    for (const child of body.commands ?? []) visit(child)
  }
  visit(command)
  out.delete('--help')
  out.delete('-h')
  return out
}

/** Option spellings written in help text: `--dry-run`, `-y` — never `react-vite` or a bare `-`. */
function flagsIn(text: string): Set<string> {
  // `npx -y @cascivo/mcp` quotes another program's command line; its `-y` is npx's.
  const own = text.replaceAll('npx -y ', 'npx ')
  return new Set(own.match(/(?<![\w-])--?[a-z][a-z-]*/g) ?? [])
}

let logs: string[]

beforeEach(() => {
  logs = []
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    logs.push(args.join(' '))
  })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  process.exitCode = undefined
})

async function helpOf(args: string[]): Promise<string> {
  logs = []
  await run(args)
  return logs.join('\n')
}

const commands = document.commands ?? []

describe('cmdspec.json', () => {
  it('names exactly the commands the root --help lists', async () => {
    const help = await helpOf(['--help'])
    const listed = [...help.matchAll(/^ {2}([a-z]+)\b/gm)].map((match) => match[1])
    expect(commands.map((command) => command.name).sort()).toEqual([...new Set(listed)].sort())
  })

  for (const command of commands) {
    it(`${command.name}: declares the same flags as its --help`, async () => {
      const help = await helpOf([command.name, '--help'])
      expect([...spellings(command)].sort()).toEqual([...flagsIn(help)].sort())
    })
  }

  it('describes every command with a summary, stated effects and an example', () => {
    const gaps: string[] = []
    const visit = (body: Command, path: string): void => {
      const children = body.commands ?? []
      if (children.length > 0) {
        for (const child of children) visit(child, `${path} ${child.name}`)
        return
      }
      if (body.summary === undefined) gaps.push(`${path}: summary`)
      if (body.effects === undefined) gaps.push(`${path}: effects`)
      // A stub that does nothing has nothing worth showing.
      if ((body.examples ?? []).length === 0 && body.stability !== 'experimental')
        gaps.push(`${path}: examples`)
    }
    for (const command of commands) visit(command, `cascivo ${command.name}`)
    expect(gaps).toEqual([])
  })
})
