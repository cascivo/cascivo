#!/usr/bin/env node
/**
 * Run a command, retrying it only when it died from a transient process-spawn
 * failure on the runner.
 *
 * Why: on 2026-08-11 the 0.17.0 release aborted inside `build:release` with
 * `✗ Failed to spawn process: Resource temporarily unavailable (os error 11)`
 * — a fork(2) EAGAIN from the GitHub runner while starting the next build
 * step, not a build error. The version bump was already on `main`, so the
 * whole release sat published-nowhere until a human re-ran the workflow.
 *
 * A real failure (type error, failing guard, lint) must still fail on the
 * first attempt, so the retry is keyed to the spawn-failure signature in the
 * command's output, never to the exit code alone.
 *
 * Usage: node scripts/release/retry-transient.mjs <command> [...args]
 */
import { spawn } from 'node:child_process'

const ATTEMPTS = 3
const DELAY_MS = Number(process.env.RETRY_TRANSIENT_DELAY_MS ?? 5000)

// fork(2)/posix_spawn EAGAIN, as reported by vp (Rust) and by Node.
const TRANSIENT = /Failed to spawn process|Resource temporarily unavailable|\bEAGAIN\b/

/** Run once, streaming output through while keeping a copy to match against. */
function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ['inherit', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => {
      output += chunk
      process.stdout.write(chunk)
    })
    child.stderr.on('data', (chunk) => {
      output += chunk
      process.stderr.write(chunk)
    })
    child.on('error', (error) => resolve({ code: 1, output: `${output}${error.message}` }))
    child.on('close', (code) => resolve({ code: code ?? 1, output }))
  })
}

const [command, ...args] = process.argv.slice(2)
if (!command) {
  console.error('usage: retry-transient.mjs <command> [...args]')
  process.exit(2)
}

for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
  const { code, output } = await run(command, args)
  if (code === 0) process.exit(0)
  if (attempt === ATTEMPTS || !TRANSIENT.test(output)) process.exit(code)
  console.error(
    `\n✗ transient spawn failure — retrying \`${command} ${args.join(' ')}\` (attempt ${attempt + 1}/${ATTEMPTS}) in ${DELAY_MS}ms\n`,
  )
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS))
}
