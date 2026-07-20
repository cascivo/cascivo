/**
 * Canonical (and only) host for hosted cascivo artifacts (registry.json, context.json,
 * tokens.catalog.json, marketplace.json, per-item r/<name>.json, llms.txt). The legacy
 * docs.cascivo.com subdomain is retired and 301s here. Keep in sync with CASCIVO_HOST
 * in packages/cli.
 */
export const CASCIVO_HOST = 'https://cascivo.com'
