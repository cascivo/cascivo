// Rewrites apps/site/src/marketing/app-builder.json from the built CLI (see app-builder.ts).
import { existsSync, writeFileSync } from 'node:fs'
import { CLI } from '../starters/starters.ts'
import { DATA_FILE, buildData, serialize } from './app-builder.ts'

if (!existsSync(CLI)) {
  throw new Error(`Built CLI not found at ${CLI}. Run \`vp run cascivo#build\` first.`)
}
writeFileSync(DATA_FILE, serialize(buildData()))
console.log('app-builder: wrote apps/site/src/marketing/app-builder.json')
