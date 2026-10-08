import { THEMES } from '../utils/config.js'
import type { ThemeName } from '../utils/config.js'
import {
  EXAMPLES,
  FRAMEWORKS,
  RUNTIMES,
  isExample,
  isRuntime,
  parseAuth,
} from '../commands/create.js'
import type { Auth, Example, Framework, Runtime, ScaffoldOptions } from '../commands/create.js'
import { blockNames } from './recipes.js'

/**
 * A blueprint (`cascivo.app.json`) describes an app in the vocabulary of `cascivo create`'s
 * flags, plus one thing the flags cannot say: which registry block each page renders. An
 * agent writes a few hundred bytes of it instead of the app's source; the CLI compiles it.
 */
export interface Blueprint {
  name: string
  framework: Framework
  theme: ThemeName
  pages: BlueprintPage[]
  runtime?: Runtime
  examples?: Example[]
  auth?: Auth
}

export interface BlueprintPage {
  /** The nav label and page heading. The first page is the app's home (`/`). */
  title: string
  /** A block from `blockNames()`; without one the page is a placeholder to build out. */
  block?: string
}

const KEYS = new Set([
  '$schema',
  'name',
  'framework',
  'theme',
  'pages',
  'runtime',
  'examples',
  'auth',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
  source: string,
): T {
  if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) return value as T
  throw new Error(`${source}: "${field}" must be one of: ${allowed.join(', ')}.`)
}

/** Parse a blueprint. `source` names the file in errors; every error names the field. */
export function parseBlueprint(raw: unknown, source: string): Blueprint {
  if (!isRecord(raw)) throw new Error(`${source}: a blueprint must be a JSON object.`)
  const unknown = Object.keys(raw).filter((key) => !KEYS.has(key))
  if (unknown.length > 0) {
    throw new Error(
      `${source}: unknown field ${unknown.map((k) => `"${k}"`).join(', ')}. Fields: ${[...KEYS].slice(1).join(', ')}.`,
    )
  }
  const { name, framework = 'react-vite', theme = 'light', pages, runtime, examples, auth } = raw
  // The name becomes the directory the app is written to, so it must stay one plain segment.
  if (typeof name !== 'string' || !/^[\w.-]+( [\w.-]+)*$/.test(name) || /^\.+$/.test(name)) {
    throw new Error(
      `${source}: "name" must be a project directory name (letters, digits, spaces, ".", "_", "-").`,
    )
  }
  const blueprint: Blueprint = {
    name,
    framework: oneOf(framework, FRAMEWORKS, 'framework', source),
    theme: oneOf(theme, THEMES, 'theme', source),
    pages: [],
  }

  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error(`${source}: "pages" must be a non-empty array of { "title", "block"? }.`)
  }
  const blocks = blockNames()
  for (const [i, page] of pages.entries()) {
    if (!isRecord(page) || typeof page.title !== 'string' || page.title.trim() === '') {
      throw new Error(`${source}: pages[${i}] needs a non-empty "title".`)
    }
    const extra = Object.keys(page).filter((key) => key !== 'title' && key !== 'block')
    if (extra.length > 0) {
      throw new Error(
        `${source}: pages[${i}] has unknown field "${extra[0]}". Fields: title, block.`,
      )
    }
    const { block } = page
    if (block !== undefined && (typeof block !== 'string' || !blocks.includes(block))) {
      throw new Error(
        `${source}: pages[${i}].block ${JSON.stringify(block)} is not a block. Blocks: ${blocks.join(', ')}.`,
      )
    }
    blueprint.pages.push({ title: page.title, ...(block !== undefined ? { block } : {}) })
  }
  if (blueprint.framework === 'astro' && blueprint.pages.some((p) => p.block)) {
    throw new Error(`${source}: blocks need "framework" react-vite or cloudflare.`)
  }

  if (runtime !== undefined) {
    if (typeof runtime !== 'string' || !isRuntime(runtime)) {
      throw new Error(`${source}: "runtime" must be one of: ${RUNTIMES.join(', ')}.`)
    }
    blueprint.runtime = runtime
  }
  if (examples !== undefined) {
    const valid = Array.isArray(examples)
      ? examples.filter((e): e is Example => typeof e === 'string' && isExample(e))
      : []
    if (!Array.isArray(examples) || valid.length !== examples.length) {
      throw new Error(`${source}: "examples" must be an array of: ${EXAMPLES.join(', ')}.`)
    }
    blueprint.examples = valid
  }
  if (auth !== undefined) {
    const parsed = parseAuth(typeof auth === 'string' ? auth : undefined)
    if (parsed === null || parsed === 'invalid') {
      throw new Error(`${source}: "auth" must be one of: access, email, oauth, email,oauth.`)
    }
    blueprint.auth = parsed
  }
  return blueprint
}

/** The scaffold a blueprint compiles to. */
export function blueprintOptions(blueprint: Blueprint): Omit<ScaffoldOptions, 'pm'> {
  return {
    name: blueprint.name,
    framework: blueprint.framework,
    theme: blueprint.theme,
    sections: blueprint.pages.map((p) => p.title),
    blocks: blueprint.pages.map((p) => p.block),
    ...(blueprint.runtime ? { runtime: blueprint.runtime } : {}),
    ...(blueprint.examples ? { examples: blueprint.examples } : {}),
    ...(blueprint.auth ? { auth: blueprint.auth } : {}),
  }
}
