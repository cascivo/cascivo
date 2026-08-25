import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { assertInside, readFileSafe, resolveOutputPath, writeFileSafe } from './fs.js'

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

describe('assertInside', () => {
  it('returns the resolved path when it is inside the root', () => {
    expect(assertInside('/proj', '/proj/src/a.tsx')).toBe('/proj/src/a.tsx')
  })

  it('allows the root itself', () => {
    expect(assertInside('/proj', '/proj')).toBe('/proj')
  })

  it.each(['/proj/../etc/passwd', '/etc/passwd', '/projX/sneaky'])('throws for %j', (target) => {
    expect(() => assertInside('/proj', target)).toThrow(/Refusing to write outside/)
  })

  it('is not fooled by a sibling directory sharing the root prefix', () => {
    // '/proj-evil' starts with '/proj' as a string but is not inside it.
    expect(() => assertInside('/proj', '/proj-evil/x')).toThrow(/Refusing to write outside/)
  })
})

describe('resolveOutputPath containment', () => {
  it('refuses a component name that climbs out of the output directory', () => {
    expect(() => resolveOutputPath('src/components/ui', '..', 'x.tsx', '/proj')).toThrow(
      /Refusing to write outside/,
    )
  })
})
