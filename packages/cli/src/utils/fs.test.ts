import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readFileSafe, resolveOutputPath, writeFileSafe } from './fs.js'

describe('resolveOutputPath', () => {
  it('joins cwd, outputDir, component, and file', () => {
    expect(resolveOutputPath('src/components/ui', 'button', 'button.tsx', '/proj')).toBe(
      '/proj/src/components/ui/button/button.tsx',
    )
  })
})

describe('writeFileSafe / readFileSafe', () => {
  let dir: string
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'cascade-fs-'))
  })
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('creates parent directories and writes the file', async () => {
    const path = join(dir, 'a', 'b', 'button.tsx')
    await writeFileSafe(path, 'hello')
    expect(await readFile(path, 'utf8')).toBe('hello')
  })

  it('readFileSafe returns null for a missing file', async () => {
    expect(await readFileSafe(join(dir, 'missing.txt'))).toBeNull()
  })
})
