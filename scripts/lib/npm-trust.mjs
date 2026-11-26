/**
 * True when an `npm trust list --json` payload names `repo` and `workflow`. The JSON
 * shape is not documented, so walk it instead of casting it.
 * @param {unknown} value
 * @param {string} repo `owner/name`
 * @param {string} workflow workflow file name, e.g. `release.yml`
 * @returns {boolean}
 */
export function trustsRepo(value, repo, workflow) {
  if (Array.isArray(value)) return value.some((v) => trustsRepo(v, repo, workflow))
  if (typeof value !== 'object' || value === null) return false
  const values = Object.values(value)
  const strings = values.filter((v) => typeof v === 'string')
  if (strings.includes(repo) && strings.some((s) => s.endsWith(workflow))) return true
  return values.some((v) => trustsRepo(v, repo, workflow))
}

/**
 * Arguments for `npm trust github`. npm 12 refuses the command without a permission
 * flag; release.yml runs a plain `npm publish`, so only `--allow-publish` is granted
 * (staged publishing stays off).
 * @param {string} name package name
 * @param {string} repo `owner/name`
 * @param {string} workflow workflow file name, e.g. `release.yml`
 * @returns {string[]}
 */
export function trustGithubArgs(name, repo, workflow) {
  return ['trust', 'github', name, '--repo', repo, '--file', workflow, '--allow-publish', '--yes']
}
