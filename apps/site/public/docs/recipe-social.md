<!--
  Generated from docs/ — do not edit here; run `pnpm regen`.
  Canonical: https://cascivo.com/docs/recipe-social.md
  registry v1.7.0 · generated 2026-10-06
-->

# Recipe: sign-in, connected accounts and social posting on Cloudflare

Let people sign in with an account they already have, connect their social accounts, and post
to them now or later from a Worker. Everything here is in `@cascivo/app` and runs on Workers
with plain `fetch` and WebCrypto: no provider SDKs and no `nodejs_compat`.

| Subpath                     | What it does                                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------------- |
| `@cascivo/app/oauth`        | The OAuth flow and one adapter per provider: GitHub, Google, LinkedIn, Bluesky, Mastodon, Threads, Buffer |
| `@cascivo/app/oauth-server` | Sign-in (`handleOAuth`) and connected accounts (`handleConnections`), tokens sealed in D1                 |
| `@cascivo/app/social`       | One publisher per network: `check` a post as it is typed, `publish` it                                    |
| `@cascivo/app/uploads`      | Images for posts, uploaded through the Worker into R2                                                     |
| `ShareMenu`                 | A Share button for your readers: each network's own compose link, no account needed                       |

The reference for every function is the
[`@cascivo/app` README](https://github.com/cascivo/cascivo/tree/main/packages/app#readme). This
page is the workflow, and the mistakes it is built to prevent.

## Pick the job

| You want                                | Use                                             | Accounts or tokens?     |
| --------------------------------------- | ----------------------------------------------- | ----------------------- |
| Readers share a page from their account | `ShareMenu`, or `shareIntentUrl` in your markup | None                    |
| People sign in with GitHub, Google, …   | `handleOAuth`                                   | Discarded after sign-in |
| The app posts for people, now or later  | `handleConnections` and a publisher per network | Kept, sealed in D1      |
| Reach X, Instagram, TikTok and the rest | `buffer()` and `bufferPublisher`                | The user's Buffer       |

## Start from a scaffold

```sh
npx cascivo create app --framework cloudflare --auth oauth          # GitHub, Google, LinkedIn sign-in
npx cascivo create app --framework cloudflare --auth email,oauth    # + one-time email links
npx cascivo create social --framework cloudflare --example social   # a post scheduler
```

`--example social` connects Bluesky and Mastodon with no set-up at all, and Buffer, LinkedIn
and Threads once their app's id and secret are set. It schedules each post as a Workflow and
attaches images through R2. Its daily Cron Trigger renews Threads tokens and emails LinkedIn
reconnect reminders. The generated README lists every key and the redirect URL to register.

## Let readers share

No account, token or third-party script: each entry is the network's own compose link, and
the reader posts from their own session there.

```tsx
import { ShareMenu, shareIntentUrl } from '@cascivo/react'

<ShareMenu url="https://acme.example/launch" text="We launched" />
<a href={shareIntentUrl('bluesky', { url, text }) ?? undefined}>Post to Bluesky</a>
```

The panel is a native popover, so the links work before hydration. Mastodon has no single
host, so the menu asks for the reader's server and remembers it. `shareIntentUrl` returns
`null` for Mastodon without a usable server.

## Sign in with a provider

```ts
import { github, google, linkedin } from '@cascivo/app/oauth'
import { handleOAuth } from '@cascivo/app/oauth-server'

const signIn = handleOAuth(env.DB, {
  secret: env.AUTH_SECRET, // at least 32 characters
  providers: [
    github({ clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET }),
    google({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }),
    linkedin({ clientId: env.LINKEDIN_CLIENT_ID, clientSecret: env.LINKEDIN_CLIENT_SECRET }),
  ],
})
```

- **Email is optional.** `User.email` is `string | null`: Bluesky, Mastodon and Threads share
  none, and GitHub's is used only when it is verified. Check it before you send mail.
- **Accounts are linked by identity, not by email**, except a _verified_ address joins an
  existing user. An attacker who registers your address at a provider without verifying it
  gets nothing.
- **Sign-in and posting are different grants.** Sign in asks for identity only. Ask for the
  posting scope when the person connects an account to post with, so signing in never shows a
  "post on your behalf" screen.

## Connect accounts to post with

```ts
import { bluesky, linkedin, mastodon, threads } from '@cascivo/app/oauth'
import { handleConnections, mastodonRegistrations } from '@cascivo/app/oauth-server'

const providers = [
  linkedin({ clientId, clientSecret, scopes: ['openid', 'profile', 'w_member_social'] }),
  bluesky({ clientMetadataPath: '/oauth/client-metadata.json' }),
  mastodon({ appName: 'Acme', registrations: mastodonRegistrations(env.DB, env.AUTH_SECRET) }),
  threads({ clientId: env.THREADS_APP_ID, clientSecret: env.THREADS_APP_SECRET }),
]
const answered = await handleConnections(env.DB, { secret: env.AUTH_SECRET, providers })(request)
// GET /api/connections/<provider> connects; Bluesky and Mastodon take ?server=<handle or host>
```

Tokens are encrypted at rest under `AUTH_SECRET`, bound to their row. Rotating the secret
turns every connection into `reconnect`, so treat it like a database key.

## Post

```ts
import { connectionTokens, markReconnect } from '@cascivo/app/oauth-server'
import { blueskyPublisher, PublishError } from '@cascivo/app/social'

const { connection, tokens } = await connectionTokens(env.DB, { secret, providers }, where)
try {
  await blueskyPublisher().publish(
    { tokens, subject: connection.subject, server: connection.server },
    post,
    { idempotencyKey: `${postId}:${connection.id}`, createdAt: dueAt },
  )
} catch (error) {
  if (error instanceof PublishError && error.kind === 'reconnect') {
    await markReconnect(env.DB, connection.id)
  }
  throw error
}
```

Run `publisher.check(post)` in the composer as people type, and again in the Worker before
anything is stored: a scheduled post fails at once, not at three in the morning.

| Network  | Length                                    | Images                  | Safe to retry?                        |
| -------- | ----------------------------------------- | ----------------------- | ------------------------------------- |
| Bluesky  | 300 graphemes                             | 4, 1 MB, uploaded       | Yes: `createdAt` fixes the record key |
| Mastodon | The server's own (`mastodonServerLimits`) | Usually 4, uploaded     | Yes: `Idempotency-Key`                |
| LinkedIn | 3000 characters                           | Up to 20, uploaded      | No                                    |
| Threads  | 500, an emoji counts its UTF-8 bytes      | Up to 20, by public URL | No                                    |
| Buffer   | The network behind the channel's          | Up to 10, by public URL | No                                    |

**Never retry a network that cannot deduplicate.** A request that timed out may already have
posted. `PublishError.retryable` is true only for rate limits and 5xx answers; for LinkedIn,
Threads and Buffer, report an interrupted post for a person to check instead.

## Schedule

One Cloudflare Workflow per post: it sleeps until the time, then posts to each account in its
own step, so one network failing neither blocks nor repeats the others.

- **A Workflow refuses to sleep until a past time.** Decide "is it due later?" inside a step,
  so a replay takes the same path, and skip the sleep for "post now".
- **Claim each account before calling the network.** A step that finds it already claimed was
  interrupted mid-post: retry it only where the network deduplicates.
- **Buffer can hold the post instead.** Given a `createdAt` ahead, `bufferPublisher` hands the
  post to Buffer's own queue, where people can still edit it. Cancelling in your app then cannot
  withdraw it: say so on the page.

## Keep connections alive

| Provider                | What keeps it working                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| Bluesky, Buffer, Google | `connectionTokens` refreshes on use, one request at a time (the refresh token is replaced on every use) |
| Threads                 | The token renews itself only while it works: a daily `refreshConnections`                               |
| LinkedIn                | Cannot be renewed: remind the owner before `expiresAt` (`expiringConnections`)                          |
| Mastodon                | Nothing; a refused token is a `reconnect`                                                               |

```ts
import { expiringConnections, refreshConnections } from '@cascivo/app/oauth-server'

export default {
  // wrangler.jsonc: "triggers": { "crons": ["17 4 * * *"] }
  async scheduled(_event, env) {
    await refreshConnections(env.DB, { secret: env.AUTH_SECRET, providers })
    for (const { connection, email } of await expiringConnections(env.DB)) {
      // email the owner a link to /api/connections/<provider>, once per token
    }
  },
}
```

## Images

Bluesky, LinkedIn and Mastodon take the bytes. Threads and Buffer fetch images by URL, so they
need one they can reach. Upload through the Worker into R2 (`@cascivo/app/uploads`, each user
under their own prefix), and hand those two networks a link to a Worker route signed with an
HMAC that expires a day after the post is due. That keeps the bucket private, and needs no S3
API key, unlike an R2 presigned URL. Check the image exists under the user's prefix before you
schedule a post with it, and take its type from storage, not from the browser.

## Set up each provider

Register `https://<your app>/api/connections/<provider>/callback` (or
`/api/auth/oauth/<provider>/callback` for sign-in) as the redirect URL.

| Provider | Where                                                       | Before strangers can connect                          |
| -------- | ----------------------------------------------------------- | ----------------------------------------------------- |
| GitHub   | An OAuth App                                                | Nothing                                               |
| Google   | An OAuth client, type "Web application"                     | Verification for sensitive scopes                     |
| LinkedIn | An app with "Sign In with LinkedIn" and "Share on LinkedIn" | Nothing for these two products                        |
| Bluesky  | Nothing: your client metadata URL is the client id          | Nothing                                               |
| Mastodon | Nothing: the app registers itself per server                | Nothing                                               |
| Threads  | A Meta app with the Threads use case                        | App Review and business verification                  |
| Buffer   | An app client in Buffer's settings                          | Nothing; mind the request budget (100 per 15 minutes) |

## What this does not cover

- **Sign in with Bluesky, Mastodon or Threads.** The adapters can, but none shares an email,
  and Threads' review falls on every adopter. Connect them to post; sign in elsewhere.
- **X and Instagram directly.** Their APIs need paid or reviewed access; Buffer reaches both.
- **Video.** The publishers post text, links and images.
