#!/usr/bin/env node
/**
 * Brand guard — fail if the old "cascade" brand reappears in shipped artifacts.
 *
 * The project was renamed cascade → cascivo (v37 T1). This guard prevents the
 * brand from regressing into surfaces a consumer actually sees:
 *
 *   1. `@layer cascade.*` declarations in any packages/<pkg>/src CSS (the public
 *      CSS layer API leaks the old brand into consumers' stylesheets).
 *   2. `cascade` in package.json `description` fields (npm registry copy).
 *   3. brand phrases in shipped JS/TS source JSDoc (e.g. "cascade component").
 *
 * It is a brand rename, NOT a dictionary purge: legitimate CSS-domain uses
 * ("the CSS cascade", "cascading layers", "@layer cascivo") are exempt.
 *
 * Scope: shipped surfaces only. docs/, CHANGELOG*, tests, and prose are exempt.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const REPO_ROOT = join(import.meta.dirname, '..')
const PACKAGES_DIR = join(REPO_ROOT, 'packages')

/** @type {{ file: string; line: number; text: string; rule: string }[]} */
const violations = []

function walk(dir, exts, onFile) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist') continue
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, exts, onFile)
    else if (exts.includes(extname(entry))) onFile(full)
  }
}

// 1. @layer cascade.* in shipped CSS.
const LAYER_BRAND = /@layer\s+cascade\b/
for (const pkg of readdirSync(PACKAGES_DIR)) {
  const srcDir = join(PACKAGES_DIR, pkg, 'src')
  try {
    statSync(srcDir)
  } catch {
    continue
  }
  walk(srcDir, ['.css'], (file) => {
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((text, i) => {
        if (LAYER_BRAND.test(text)) {
          violations.push({ file, line: i + 1, text: text.trim(), rule: '@layer cascade.*' })
        }
      })
  })
}

// 2. "cascade" brand in package.json descriptions.
for (const pkg of readdirSync(PACKAGES_DIR)) {
  const pkgJson = join(PACKAGES_DIR, pkg, 'package.json')
  let json
  try {
    json = JSON.parse(readFileSync(pkgJson, 'utf8'))
  } catch {
    continue
  }
  if (typeof json.description === 'string' && /\bcascade\b/i.test(json.description)) {
    violations.push({
      file: pkgJson,
      line: 0,
      text: `"description": ${JSON.stringify(json.description)}`,
      rule: 'package description brand',
    })
  }
}

// 3. Brand phrases in the published @cascivo/react entry JSDoc.
// This is the exact surface the boringtools feedback cited ("the prebuilt
// distribution of every cascade component"). Scoped narrowly to the published
// distribution package's entry so it can't regress; broader internal mentions
// (i18n catalog keys, the CascadeView render export, CLI output) are pre-existing
// API/identifiers, not in v37's rename scope.
const BRAND_PHRASE = /\bcascade\b/i
const EXEMPT_PHRASE = /css cascade|cascade layer|@layer\s+cascade|cascading/i
const REACT_ENTRY = join(PACKAGES_DIR, 'react', 'src', 'index.ts')
try {
  readFileSync(REACT_ENTRY, 'utf8')
    .split('\n')
    .forEach((text, i) => {
      if (BRAND_PHRASE.test(text) && !EXEMPT_PHRASE.test(text)) {
        violations.push({
          file: REACT_ENTRY,
          line: i + 1,
          text: text.trim(),
          rule: 'shipped JSDoc/JS brand (@cascivo/react entry)',
        })
      }
    })
} catch {
  // entry not present — skip
}

if (violations.length > 0) {
  console.error('✗ brand guard: found old "cascade" brand in shipped artifacts:\n')
  for (const v of violations) {
    const loc = v.line ? `${relative(REPO_ROOT, v.file)}:${v.line}` : relative(REPO_ROOT, v.file)
    console.error(`  [${v.rule}] ${loc}`)
    console.error(`    ${v.text}`)
  }
  console.error(
    `\n${violations.length} violation(s). Rename to "cascivo" (the brand is cascivo, not cascade).`,
  )
  console.error('Legitimate CSS-domain uses ("the CSS cascade", "cascading layers") are exempt.')
  process.exit(1)
}

console.log('✓ brand guard: no "cascade" brand in shipped CSS layers / descriptions / JSDoc')
