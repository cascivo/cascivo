import { join } from 'node:path'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { customElementsManifest } from '../../elements/src/manifest.ts'
import { generateTypes } from './generate.ts'

describe('generateTypes', () => {
  it('committed cv-elements.ts matches the manifest (run `pnpm --filter @cascivo/solid generate`)', () => {
    const file = readFileSync(join(process.cwd(), 'src/cv-elements.ts'), 'utf8')
    expect(file).toBe(generateTypes(customElementsManifest()))
  })

  it('emits typed custom events from the manifest and skips native ones', () => {
    const out = generateTypes(customElementsManifest())
    expect(out).toContain(
      "'on:cv-value-change'?: (event: CustomEvent<{ value: string | undefined }>)",
    )
    expect(out).not.toContain("'on:input'")
    expect(out).toContain("'cv-combobox'")
  })

  it('tolerates a malformed manifest', () => {
    expect(generateTypes(null)).toContain('export interface CvElements {\n}')
  })
})
