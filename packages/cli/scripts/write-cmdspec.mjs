// Writes dist/cmdspec.json: the hand-written ../cmdspec.json with `info.version` set to this
// package's version. `docspack sync` skips a description whose version differs from the one
// installed, and changesets bumps package.json only — so the version is stamped here rather
// than kept in the source, where it would go stale on every release.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const root = new URL('..', import.meta.url)
const { version } = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'))
const spec = JSON.parse(readFileSync(new URL('cmdspec.json', root), 'utf8'))
spec.info.version = version

mkdirSync(new URL('dist/', root), { recursive: true })
writeFileSync(new URL('dist/cmdspec.json', root), `${JSON.stringify(spec, null, 2)}\n`)
