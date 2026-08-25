import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'

/**
 * Throw unless `target` lands inside `root`.
 *
 * The last line of defense for registry-supplied paths. `parseItem` rejects an
 * unsafe `name`/`target` at the network boundary, but that only protects call
 * sites that go through it — this protects the write itself, so a future code
 * path that resolves a destination some other way still cannot escape the
 * directory it is supposed to write into.
 */
export function assertInside(root: string, target: string): string {
  const base = resolve(root)
  const full = resolve(target)
  if (full !== base && !full.startsWith(base + sep)) {
    throw new Error(`Refusing to write outside ${base}: ${full}`)
  }
  return full
}

/** Resolve where a component file should be written. */
export function resolveOutputPath(
  outputDir: string,
  component: string,
  file: string,
  cwd: string = process.cwd(),
): string {
  const root = resolve(cwd, outputDir)
  return assertInside(root, join(root, component, file))
}

/** Write a file, creating parent directories as needed. */
export async function writeFileSafe(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, content, 'utf8')
}

/** Read a file, returning null if it does not exist. */
export async function readFileSafe(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8')
  } catch {
    return null
  }
}
