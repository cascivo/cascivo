// The `create_app` examples. `summary` is what an agent needs to choose one, and it travels in
// the tool description on every turn, so it stays one short line. `setup` (secrets, accounts,
// commands) is only useful once an example is chosen, so it comes back with the tool's result.

export interface CreateAppExample {
  summary: string
  setup: string
}

export const CREATE_APP_EXAMPLES = {
  board: {
    summary: 'multiplayer notes + live cursors on a Durable Object',
    setup: 'Deployable with no account via deploy_preview.',
  },
  agent: {
    summary: 'AI assistant answering with validated cascivo views (needs runtime "react")',
    setup:
      'Agents SDK + Workers AI. Runtime "react" is the default with it. A real Cloudflare account is needed for the model.',
  },
  notes: {
    summary: 'local-first page whose edits survive a dropped connection',
    setup: 'IndexedDB + a Durable Object.',
  },
  import: {
    summary: 'CSV import as a Workflow with live progress',
    setup: '@cascivo/app/jobs. Workflows need a real Cloudflare account to deploy.',
  },
  files: {
    summary: 'uploads into R2 with progress and image previews',
    setup: '@cascivo/app/uploads, Cloudflare Images previews. R2 needs a real account.',
  },
  export: {
    summary: 'report page downloadable as PDF/PNG',
    setup: 'Rendered by Browser Run (@cascivo/app/export).',
  },
  usage: {
    summary: 'every API request recorded in Analytics Engine and charted',
    setup: '@cascivo/app/analytics. Reading needs CF_ACCOUNT_ID and CF_API_TOKEN secrets.',
  },
  crud: {
    summary: 'D1 customers table behind DataTable server mode, with create/edit/delete',
    setup: '@cascivo/app/db. Works on a temporary account.',
  },
  live: {
    summary: 'ops dashboard updating every second from a Queue into a Durable Object',
    setup: '@cascivo/app/live. Create the queue before deploying.',
  },
  voice: {
    summary: 'voice assistant (speech to text, a model, text to speech), either runtime',
    setup:
      'Agents SDK voice pipeline on Workers AI; runs offline in vite dev with stand-ins. A real Cloudflare account is needed for the models.',
  },
  publish: {
    summary: 'views published as pages at /p/<slug>, checked against the manifests',
    setup:
      'Unknown components, invalid props and script-running URLs are refused; pages are stored in D1. Works on a temporary account.',
  },
  webhooks: {
    summary: 'signed GitHub webhook deliveries, stored once in D1 and shown live',
    setup:
      'verifyWebhook also handles Stripe and Standard Webhooks. Needs a WEBHOOK_SECRET secret.',
  },
  digest: {
    summary: 'the report page as PDF, emailed every Monday by a Cron Trigger (adds "export")',
    setup:
      'Each run is recorded. Needs DIGEST_TO, DIGEST_FROM and APP_URL, and a real account for Browser Run and Email Service.',
  },
  search: {
    summary: 'help articles found by meaning (Vectorize + Workers AI embeddings)',
    setup:
      'Create the index once with `wrangler vectorize create`; vite dev searches by keyword. Needs a real account.',
  },
  checkout: {
    summary: 'one product sold on Stripe Checkout, orders in D1, emailed receipts',
    setup:
      'The Stripe webhook is signature-checked and each order settled once; receipts are rendered with @cascivo/email and sent through Email Service. Needs STRIPE_SECRET_KEY (a test key works in vite dev), STRIPE_WEBHOOK_SECRET for the webhook, and RECEIPT_FROM for receipts. With auth "email" it also adds /billing: a monthly subscription paid on Stripe Checkout, managed in the Stripe Customer Portal and kept in step by subscription webhooks.',
  },
  newsletter: {
    summary: 'double opt-in sign-up and a Markdown composer sending through Amazon SES',
    setup:
      'Issues are rendered with @cascivo/email and sent on a Queue (@cascivo/app/ses), with one-click unsubscribe; bounces and complaints from SNS are suppressed. Runs in vite dev with emails logged. Sending for real needs AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION and NEWSLETTER_FROM, plus SNS_TOPIC_ARN for feedback; create the queue before deploying.',
  },
  social: {
    summary:
      'post to Bluesky, Mastodon, LinkedIn, Threads and Buffer now or later (brings auth "oauth"; not with "access")',
    setup:
      "Accounts connect through @cascivo/app/oauth-server handleConnections, with tokens sealed in D1 (each Buffer channel is one more account). One Workflow per post, up to 4 images in R2, and what each network would refuse (including each Mastodon server's limits) shown while typing (@cascivo/app/social). A daily Cron Trigger renews Threads tokens and emails LinkedIn reconnect reminders. Bluesky and Mastodon need no set-up (BLUESKY_PRIVATE_JWK optionally makes Bluesky sessions last; in vite dev open the app at 127.0.0.1). LinkedIn needs LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET; Threads needs THREADS_APP_ID and THREADS_APP_SECRET (and App Review at Meta before strangers can connect); Buffer needs BUFFER_CLIENT_ID. AUTH_SECRET seals the tokens and signs image links, APP_URL lets Threads and Buffer fetch images, REMINDER_FROM sends reminders. Workflows and R2 need a real account to deploy. Guide: https://cascivo.com/docs/recipe-social.md",
  },
} as const satisfies Record<string, CreateAppExample>

export type CreateAppExampleName = keyof typeof CREATE_APP_EXAMPLES

export const CREATE_APP_EXAMPLE_NAMES = Object.keys(CREATE_APP_EXAMPLES) as [
  CreateAppExampleName,
  ...CreateAppExampleName[],
]

/** One line per example, for the tool description. */
export function exampleSummaries(): string {
  return CREATE_APP_EXAMPLE_NAMES.map((n) => `"${n}": ${CREATE_APP_EXAMPLES[n].summary}`).join('; ')
}

/** The setup notes for the examples an agent picked, appended to the create_app result. */
export function exampleSetup(names: readonly CreateAppExampleName[]): string {
  if (names.length === 0) return ''
  return `\n\nSetup for the examples you picked:\n${names.map((n) => `- ${n}: ${CREATE_APP_EXAMPLES[n].setup}`).join('\n')}`
}

/** The `create_app` sign-in modes, split the same way as the examples. */
export const CREATE_APP_AUTH = {
  access: {
    summary:
      'the Worker refuses every request Cloudflare Access did not let through (no deploy_preview)',
    setup:
      'Set the Access team domain and AUD in wrangler.jsonc. Such an app cannot use deploy_preview.',
  },
  email: {
    summary: 'accounts with emailed one-time sign-in links; every API write needs a signed-in user',
    setup:
      'Sessions live in D1. Set AUTH_FROM in wrangler.jsonc; in vite dev the link is shown instead of sent.',
  },
  oauth: {
    summary: 'the same accounts with GitHub, Google and LinkedIn sign-in',
    setup:
      'Each provider is offered once its client id and secret are set (@cascivo/app/oauth-server); AUTH_SECRET seals the sign-in state.',
  },
  'email,oauth': {
    summary: 'both on one sign-in page',
    setup:
      'Set AUTH_FROM for emailed links, AUTH_SECRET for the sign-in state, and each provider’s client id and secret.',
  },
} as const satisfies Record<string, CreateAppExample>

export type CreateAppAuth = keyof typeof CREATE_APP_AUTH

export const AUTH_MODES = Object.keys(CREATE_APP_AUTH) as [CreateAppAuth, ...CreateAppAuth[]]

export function authSummaries(): string {
  return AUTH_MODES.map((m) => `"${m}": ${CREATE_APP_AUTH[m].summary}`).join('; ')
}

export function authSetup(mode: CreateAppAuth | undefined): string {
  return mode ? `\n\nSign-in setup (${mode}): ${CREATE_APP_AUTH[mode].setup}` : ''
}
