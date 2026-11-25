import { writeFileSync } from 'node:fs'
import { customElementsManifest } from '../../elements/src/manifest.ts'
import { generateTypes } from '../src/generate.ts'

writeFileSync(
  new URL('../src/cv-elements.ts', import.meta.url),
  generateTypes(customElementsManifest()),
)
