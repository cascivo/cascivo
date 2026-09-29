#!/usr/bin/env node
// `npm create cascivo` runs this file. It is `cascivo create` and nothing else, so the two
// entry points cannot drift: every flag, prompt and framework comes from the CLI.
import { argv } from 'node:process'
import { run } from 'cascivo'

run(['create', ...argv.slice(2)]).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
