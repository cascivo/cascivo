import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import os from 'node:os'
import { join } from 'node:path'
import type { Results } from './types.ts'

export function collectMeta(repoRoot: string): Results['meta'] {
  return {
    date: new Date().toISOString().slice(0, 10),
    cpu: os.cpus()[0]?.model ?? 'unknown',
    cores: os.cpus().length,
    memGb: Math.round(os.totalmem() / 1024 ** 3),
    os: `${os.platform()} ${os.release()}`,
    node: process.version,
    chrome: 'n/a',
    cpuThrottle: 4,
    lockfileHash: createHash('sha256')
      .update(readFileSync(join(repoRoot, 'pnpm-lock.yaml')))
      .digest('hex')
      .slice(0, 12),
    source: process.env['CI'] ? 'ci' : 'local',
  }
}
