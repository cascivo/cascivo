/**
 * Canonical host for hosted cascivo artifacts (registry.json, context.json,
 * tokens.catalog.json, marketplace.json, per-item r/<name>.json, llms.txt).
 * docs.cascivo.com serves the same tree as a mirror — code always fetches the
 * canonical host. Keep in sync with CASCIVO_HOST in packages/cli.
 */
export const CASCIVO_HOST = 'https://cascivo.com'
