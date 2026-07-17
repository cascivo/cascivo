#!/usr/bin/env node
/**
 * Publishes docs/GETTING-STARTED.md as a plain, statically-fetchable markdown
 * file at apps/site/public/docs/getting-started.md, so an agent or `curl` can
 * read the install steps without running the client-rendered docs SPA (the
 * report's #8 friction). Single source: the docs/ file — this only reframes it
 * with a canonical-URL header. Kept in sync by the regen drift check.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = join(here, '..', '..')
const SOURCE = join(ROOT, 'docs', 'GETTING-STARTED.md')
const OUT_DIR = join(ROOT, 'apps', 'site', 'public', 'docs')
const OUT = join(OUT_DIR, 'getting-started.md')

const source = readFileSync(SOURCE, 'utf8')

const header = [
  '<!--',
  '  Generated from docs/GETTING-STARTED.md — do not edit here; run `pnpm regen`.',
  '  Canonical: https://cascivo.com/docs/getting-started.md',
  '-->',
  '',
].join('\n')

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(OUT, header + source)
console.log(`getting-started: wrote ${OUT}`)
