#!/usr/bin/env node
// Thin executable wrapper — all logic (and the tests) live in cli.mjs.
import { run } from './cli.mjs'

process.exit(run(process.argv.slice(2)))
