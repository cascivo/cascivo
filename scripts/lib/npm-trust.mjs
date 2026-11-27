/**
 * True when a registry version document (`GET /<name>/latest`) was published through a
 * trusted publisher. npm records that in `_npmUser.trustedPublisher`, and it is public,
 * so no login or 2FA is needed to tell which names still lack one.
 * @param {unknown} doc
 * @returns {boolean}
 */
export function publishedByTrustedPublisher(doc) {
  if (typeof doc !== 'object' || doc === null || !('_npmUser' in doc)) return false
  const user = doc._npmUser
  return typeof user === 'object' && user !== null && 'trustedPublisher' in user
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
