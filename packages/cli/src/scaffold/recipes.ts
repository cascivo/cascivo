import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isSafeRelativePath } from '@cascivo/registry'

/**
 * A recipe is one feature of a scaffold as data: a directory under `packages/cli/recipes/`
 * holding a `recipe.json` and the files it adds, at the paths they take in the app. The files
 * are the app's real source rather than template literals, so composing a scaffold is choosing
 * recipes, not threading conditionals through one generator.
 */
export interface Recipe {
  name: string
  /** App-relative paths, each a file in the recipe's directory. */
  files: string[]
  /** Side-nav entries for the pages the recipe adds, in the order they appear. */
  nav: RecipeNavItem[]
}

export interface RecipeNavItem {
  label: string
  /** An app path, starting with `/`. */
  href: string
}

/** The values a recipe file may reference as `{{key}}`. Unknown keys are left as written. */
export interface RecipeVars {
  /** The app's display name, as `brandName` derives it. */
  brand: string
  /** The project name with quotes and backslashes removed, for a single-quoted string. */
  appName: string
  /** The Workers Analytics Engine dataset the `usage` recipe writes to. */
  usageDataset: string
}

const HERE = dirname(fileURLToPath(import.meta.url))

/** `recipes/` beside `dist/` in the published package, or beside `src/` in the repo. */
function recipesDir(): string {
  for (const candidate of [join(HERE, '..', 'recipes'), join(HERE, '..', '..', 'recipes')]) {
    if (existsSync(join(candidate, 'cloudflare', 'recipe.json'))) return candidate
  }
  throw new Error(`cascivo: the scaffold recipes are missing (looked beside ${HERE}).`)
}

/** Parse a `recipe.json`. `source` names the file in errors. */
export function parseRecipe(raw: unknown, source: string): Recipe {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error(`${source}: a recipe must be an object.`)
  }
  const { name, files, nav = [] } = raw as Record<string, unknown>
  if (typeof name !== 'string' || !/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error(`${source}: "name" must be a lower-case kebab-case string.`)
  }
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error(`${source}: "files" must be a non-empty array of paths.`)
  }
  const paths: string[] = []
  for (const file of files) {
    if (!isSafeRelativePath(file)) {
      throw new Error(`${source}: "${String(file)}" is not a safe relative path.`)
    }
    paths.push(file)
  }
  if (!Array.isArray(nav)) throw new Error(`${source}: "nav" must be an array.`)
  const items: RecipeNavItem[] = []
  for (const item of nav) {
    const { label, href } = (typeof item === 'object' && item !== null ? item : {}) as Record<
      string,
      unknown
    >
    if (
      typeof label !== 'string' ||
      label === '' ||
      typeof href !== 'string' ||
      !href.startsWith('/')
    ) {
      throw new Error(
        `${source}: each "nav" entry needs a "label" and an "href" starting with "/".`,
      )
    }
    items.push({ label, href })
  }
  return { name, files: paths, nav: items }
}

const cache = new Map<string, Recipe>()

export function loadRecipe(name: string): Recipe {
  const cached = cache.get(name)
  if (cached) return cached
  const source = join(recipesDir(), name, 'recipe.json')
  const recipe = parseRecipe(JSON.parse(readFileSync(source, 'utf8')) as unknown, source)
  if (recipe.name !== name) throw new Error(`${source}: "name" must be "${name}".`)
  cache.set(name, recipe)
  return recipe
}

const PLACEHOLDER = /\{\{(brand|appName|usageDataset)\}\}/g

/** The files a recipe adds, with `{{key}}` placeholders filled from `vars`. */
export function recipeFiles(name: string, vars: RecipeVars): { path: string; contents: string }[] {
  const dir = join(recipesDir(), name)
  return loadRecipe(name).files.map((path) => ({
    path,
    contents: readFileSync(join(dir, path), 'utf8').replace(
      PLACEHOLDER,
      (_, key: keyof RecipeVars) => vars[key],
    ),
  }))
}

/** The registry blocks a blueprint page can render: each has a `block-<name>` recipe. */
export function blockNames(): string[] {
  return readdirSync(recipesDir())
    .filter((dir) => dir.startsWith('block-'))
    .map((dir) => dir.slice('block-'.length))
    .sort()
}
