import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadRecipe, parseRecipe, recipeFiles } from './recipes.js'

const RECIPES = join(import.meta.dirname, '../../recipes')

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? filesUnder(join(dir, d.name)) : [join(dir, d.name)],
  )
}

const names = readdirSync(RECIPES, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)

describe('recipes on disk', () => {
  it.each(names)('%s lists exactly the files in its directory', (name) => {
    const dir = join(RECIPES, name)
    const onDisk = filesUnder(dir)
      .map((f) => relative(dir, f))
      .filter((f) => f !== 'recipe.json')
      .sort()
    expect([...loadRecipe(name).files].sort()).toEqual(onDisk)
  })

  it('has no dotfiles, which npm drops from a published package', () => {
    const dotfiles = names.flatMap((name) =>
      loadRecipe(name).files.filter((f) => f.split('/').some((part) => part.startsWith('.'))),
    )
    expect(dotfiles).toEqual([])
  })

  it('fills only the known placeholders', () => {
    const vars = { brand: 'Acme Co', appName: 'acme', usageDataset: 'acme_usage' }
    for (const name of names) {
      for (const file of recipeFiles(name, vars)) {
        expect(file.contents, `${name}/${file.path}`).not.toMatch(
          /\{\{(brand|appName|usageDataset)\}\}/,
        )
      }
    }
    const checkout = recipeFiles('checkout', vars).find((f) => f.path === 'src/checkout.ts')
    expect(checkout?.contents).toContain("SHOP_NAME = 'Acme Co'")
    // `{{` is also JSX's object-literal syntax; anything that is not a placeholder stays as written.
    const raw = readFileSync(join(RECIPES, 'board/src/routes/board.tsx'), 'utf8')
    expect(
      recipeFiles('board', vars).find((f) => f.path === 'src/routes/board.tsx')?.contents,
    ).toBe(raw)
  })
})

describe('parseRecipe', () => {
  it.each([
    ['a non-object', 'x'],
    ['a bad name', { name: 'Board', files: ['a.ts'] }],
    ['no files', { name: 'board', files: [] }],
    ['a path outside the app', { name: 'board', files: ['../../.zshrc'] }],
    ['an absolute path', { name: 'board', files: ['/etc/passwd'] }],
  ])('rejects %s', (_label, raw) => {
    expect(() => parseRecipe(raw, 'recipe.json')).toThrow(/recipe\.json/)
  })
})
