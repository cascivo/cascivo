import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

/** Resolve where a component file should be written. */
export function resolveOutputPath(
  outputDir: string,
  component: string,
  file: string,
  cwd: string = process.cwd(),
): string {
  return join(resolve(cwd, outputDir), component, file)
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
