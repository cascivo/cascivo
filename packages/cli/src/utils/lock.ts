import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export interface LockEntry {
  registry: string
  version: string
  installedAt: string
  files: Record<string, string>
  conflicted?: true
}

export interface LockFile {
  lockVersion: 1
  items: Record<string, LockEntry>
}

export function sha256(content: string): string {
  return `sha256-${createHash('sha256').update(content).digest('hex')}`
}

const LOCK_FILENAME = 'cascade.lock'

export async function readLock(cwd: string = process.cwd()): Promise<LockFile | null> {
  const path = join(cwd, LOCK_FILENAME)
  if (!existsSync(path)) return null
  try {
    const raw = JSON.parse(await readFile(path, 'utf8')) as unknown
    if (typeof raw !== 'object' || raw === null) return null
    return raw as LockFile
  } catch {
    return null
  }
}

export async function writeLock(lock: LockFile, cwd: string = process.cwd()): Promise<void> {
  const path = join(cwd, LOCK_FILENAME)
  await writeFile(path, `${JSON.stringify(lock, null, 2)}\n`, 'utf8')
}

export function createLock(): LockFile {
  return { lockVersion: 1, items: {} }
}

export function updateLockEntry(lock: LockFile, name: string, entry: LockEntry): LockFile {
  return {
    ...lock,
    items: { ...lock.items, [name]: entry },
  }
}
