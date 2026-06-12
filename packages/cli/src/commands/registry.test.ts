import { rm, readFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { registryBuild } from './registry.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const FIXTURE = join(HERE, '../../test/fixtures/registry-author')
const TMP_OUT = join(FIXTURE, '__out__')

beforeEach(async () => {
  await mkdir(TMP_OUT, { recursive: true })
})

afterEach(async () => {
  await rm(TMP_OUT, { recursive: true, force: true })
  process.exitCode = 0
})

describe('cascade registry build', () => {
  it('builds valid fixture registry to output dir', async () => {
    await registryBuild(['--in', join(FIXTURE, 'cascade-registry.json'), '--out', TMP_OUT])
    expect(process.exitCode).toBeFalsy()

    const index = JSON.parse(await readFile(join(TMP_OUT, 'registry.json'), 'utf8')) as {
      schemaVersion: number
      items: { name: string }[]
    }
    expect(index.schemaVersion).toBe(2)
    expect(index.items.map((i) => i.name).sort()).toEqual(['callout', 'step-list'])

    const callout = JSON.parse(await readFile(join(TMP_OUT, 'callout.json'), 'utf8')) as {
      name: string
      version: string
    }
    expect(callout.name).toBe('callout')

    await readFile(join(TMP_OUT, 'callout@1.0.0.json'), 'utf8')
  })

  it('exits non-zero when file does not exist', async () => {
    await registryBuild(['--in', join(FIXTURE, 'does-not-exist.json'), '--out', TMP_OUT])
    expect(process.exitCode).toBe(1)
  })
})
