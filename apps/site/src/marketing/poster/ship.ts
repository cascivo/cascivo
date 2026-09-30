/**
 * What the landing page promises about shipping a Cloudflare app with no account. Kept here,
 * apart from the components, so scripts/checks/app-builder.test.ts can hold it against what
 * `cascivo create` actually writes.
 */

/**
 * Services a temporary Cloudflare account supports (`deploy:preview`, no sign-up): Workers,
 * static assets, KV, D1 and Durable Objects. An app that binds anything else needs an account.
 */
export const PREVIEWABLE: ReadonlySet<string> = new Set(['durable_objects', 'd1_databases'])

/** The example the call to action ships: it must bind only previewable services. */
export const CTA_EXAMPLE = 'board'

/**
 * Create, install, share: the whole path from nothing to a public URL. The create command is
 * split with line continuations so a phone wraps it between flags, not inside one.
 */
export const CTA_SHIP_COMMANDS = [
  'npx cascivo create acme \\',
  '  --framework cloudflare \\',
  `  --example ${CTA_EXAMPLE}`,
  'cd acme && npm install',
  'npm run deploy:preview',
].join('\n')
