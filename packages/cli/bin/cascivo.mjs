#!/usr/bin/env node
// Committed launcher: the package `bin` points here so pnpm can always link the
// command shim at install time, even before `dist/` is built. The actual CLI is
// loaded lazily from the built output (produced earlier in the build graph).
import { argv } from 'node:process'
import { run } from '../dist/index.mjs'

run(argv.slice(2)).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
