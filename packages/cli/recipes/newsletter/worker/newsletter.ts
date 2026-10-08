import { HttpError } from '@cascivo/app/api'
import { normalizeEmail } from '@cascivo/app/auth-server'
import { migrate, queryRows } from '@cascivo/app/db'
import type { Database } from '@cascivo/app/db'
import { SesError, createSes, handleSns, parseSesNotification } from '@cascivo/app/ses'
import { writeRoom } from '@cascivo/app/sync-server'
import type { RoomNamespace } from '@cascivo/app/sync-server'
import { assertSendable, sendEmail } from '@cascivo/email'
import type { RenderResult } from '@cascivo/email'
import { ISSUE_ID, issueRoom, parseIssue } from '../src/newsletter'
import type { Issue, IssueInput, Overview, SubscriberCounts } from '../src/newsletter'
import { TOKEN_SLOT, renderConfirmation, renderIssue } from './newsletter-email'

const migrations = [
  {
    id: '0001_newsletter',
    statements: [
      `CREATE TABLE subscribers (
        email TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        confirm_hash TEXT,
        confirm_expires INTEGER,
        unsubscribe_token TEXT NOT NULL UNIQUE,
        reason TEXT,
        created_at TEXT NOT NULL,
        confirmed_at TEXT
      )`,
      `CREATE TABLE issues (
        id TEXT PRIMARY KEY,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        total INTEGER NOT NULL,
        created_at TEXT NOT NULL
      )`,
      // One row per reader per issue, written as each send finishes: a retried queue message
      // skips whoever already has one, so nobody gets an issue twice.
      `CREATE TABLE deliveries (
        issue_id TEXT NOT NULL,
        email TEXT NOT NULL,
        status TEXT NOT NULL,
        detail TEXT,
        at TEXT NOT NULL,
        PRIMARY KEY (issue_id, email)
      )`,
    ],
  },
]

/** Readers per queue message. Each message is sent in one go, one reader after another. */
const CHUNK = 25
/** A confirmation link works for a day. */
const CONFIRM_TTL_MS = 24 * 60 * 60 * 1000
/** A pending address gets another link at most this often, so the form cannot flood an inbox. */
const RESEND_AFTER_MS = 10 * 60 * 1000

export interface NewsletterMessage {
  issueId: string
  emails: string[]
  /** The app's origin, for the unsubscribe links: a queue consumer has no request. */
  origin: string
}

/** What sending needs of the NEWSLETTER queue binding. */
export interface NewsletterQueue {
  sendBatch(messages: Iterable<{ body: NewsletterMessage }>): Promise<void>
}

/** The slice of a Queue consumer's batch `deliver` reads. */
export interface NewsletterBatch {
  readonly messages: readonly { readonly body: unknown }[]
}

export interface NewsletterEnv {
  DB: Database
  ROOMS: RoomNamespace<unknown>
  NEWSLETTER: NewsletterQueue
  /** Set in wrangler.jsonc: the SES region, the From address, the SNS topic for feedback. */
  AWS_REGION: string
  NEWSLETTER_FROM: string
  SNS_TOPIC_ARN: string
  /** Secrets: `wrangler secret put` (.dev.vars locally). Unset until you add them. */
  AWS_ACCESS_KEY_ID?: string
  AWS_SECRET_ACCESS_KEY?: string
  NEWSLETTER_KEY?: string
}

const encoder = new TextEncoder()

const cell = (raw: unknown, key: string): unknown =>
  typeof raw === 'object' && raw !== null ? Reflect.get(raw, key) : undefined

/** A string column of a D1 row. Rows are read like any payload: checked, not cast. */
function column(raw: unknown, key: string): string {
  const value = cell(raw, key)
  if (typeof value !== 'string') throw new Error(`Expected a string in column ${key}`)
  return value
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** 32 random bytes, URL-safe: a confirmation or unsubscribe token. */
function token(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/** Refuses a request without NEWSLETTER_KEY. Compares digests, so timing says nothing. */
async function requireKey(env: NewsletterEnv, key: string): Promise<void> {
  if (!env.NEWSLETTER_KEY) throw new HttpError(503, 'Set NEWSLETTER_KEY (README)')
  if ((await sha256(key)) !== (await sha256(env.NEWSLETTER_KEY))) {
    throw new HttpError(403, 'Wrong newsletter key')
  }
}

type Send = (
  to: string,
  message: RenderResult,
  headers?: Record<string, string>,
) => Promise<'sent' | 'logged'>

/**
 * Sends one email through SES, or, in `vite dev` without AWS credentials, logs it instead.
 * Deployed without them, it refuses with what to set. The SES client is an `EmailSender`, so
 * `sendEmail` checks the message (subject, preheader, text part, size) and every header first.
 */
function mailer(env: NewsletterEnv): Send {
  const configured =
    env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_REGION && env.NEWSLETTER_FROM
  if (!configured) {
    if (!import.meta.env.DEV) {
      throw new HttpError(
        503,
        'Set AWS_REGION and NEWSLETTER_FROM in wrangler.jsonc, and the AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY secrets (README)',
      )
    }
    return async (to, message) => {
      console.log(`[newsletter] not sent (no SES credentials) to ${to}: "${message.subject}"`)
      return 'logged'
    }
  }
  const ses = createSes({
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
  })
  return async (to, message, headers) => {
    await sendEmail(ses, message, {
      from: env.NEWSLETTER_FROM,
      to,
      ...(headers ? { headers } : {}),
    })
    return 'sent'
  }
}

/**
 * Signs someone up: a pending subscriber and a confirmation email. The answer is the same
 * whoever asks, so the form does not tell strangers who is on the list. `vite dev` without
 * SES also returns the confirmation link, to open instead of an email.
 */
export async function subscribe(
  env: NewsletterEnv,
  rawEmail: string,
  origin: string,
): Promise<{ devLink: string | null }> {
  const email = normalizeEmail(rawEmail)
  const send = mailer(env)
  await migrate(env.DB, migrations)
  const confirm = token()
  const now = new Date()
  const expires = now.getTime() + CONFIRM_TTL_MS
  // A new or unsubscribed address gets a link; a pending one gets a fresh link at most every
  // ten minutes. A subscribed or suppressed one is left alone, and nothing is sent.
  const [row] = await queryRows(
    env.DB,
    `INSERT INTO subscribers
       (email, status, confirm_hash, confirm_expires, unsubscribe_token, created_at)
     VALUES (?, 'pending', ?, ?, ?, ?)
     ON CONFLICT (email) DO UPDATE SET
       status = 'pending', reason = NULL,
       confirm_hash = excluded.confirm_hash, confirm_expires = excluded.confirm_expires
     WHERE subscribers.status = 'unsubscribed'
       OR (subscribers.status = 'pending' AND subscribers.confirm_expires < ?)
     RETURNING email`,
    [email, await sha256(confirm), expires, token(), now.toISOString(), expires - RESEND_AFTER_MS],
    (raw) => column(raw, 'email'),
  )
  if (!row) return { devLink: null }
  const link = `${origin}/newsletter/confirm?token=${confirm}`
  const message = renderConfirmation(link)
  let outcome: 'sent' | 'logged'
  try {
    outcome = await send(email, message)
  } catch (error) {
    if (!(error instanceof SesError)) throw error
    console.error('[newsletter] confirmation not sent:', error.code, error.message)
    // Let the reader try again at once rather than wait out the resend interval.
    await queryRows(
      env.DB,
      "UPDATE subscribers SET confirm_expires = 0 WHERE email = ? AND status = 'pending' RETURNING email",
      [email],
      (raw) => raw,
    )
    throw new HttpError(502, 'Could not send the confirmation email. Try again in a moment.')
  }
  return { devLink: outcome === 'logged' ? link : null }
}

/** Opens a confirmation link: the subscriber is on the list from now on. */
export async function confirm(env: NewsletterEnv, rawToken: string): Promise<{ email: string }> {
  await migrate(env.DB, migrations)
  const [row] = await queryRows(
    env.DB,
    `UPDATE subscribers SET status = 'subscribed', confirm_hash = NULL, confirmed_at = ?
     WHERE confirm_hash = ? AND confirm_expires > ? AND status = 'pending' RETURNING email`,
    [new Date().toISOString(), await sha256(rawToken), Date.now()],
    (raw) => ({ email: column(raw, 'email') }),
  )
  if (!row) throw new HttpError(400, 'This link has expired or was used already. Sign up again.')
  return row
}

/**
 * `POST /api/newsletter/unsubscribe?token=…`: the page's button, and the one-click
 * unsubscribe mail clients send (RFC 8058) from the List-Unsubscribe header. Always 200, so a
 * token says nothing about who it belongs to, and a second click is not an error.
 */
export async function unsubscribe(request: Request, env: NewsletterEnv): Promise<Response> {
  const unsubscribeToken = new URL(request.url).searchParams.get('token') ?? ''
  await migrate(env.DB, migrations)
  await queryRows(
    env.DB,
    `UPDATE subscribers SET status = 'unsubscribed', reason = 'unsubscribed'
     WHERE unsubscribe_token = ? AND status IN ('pending', 'subscribed') RETURNING email`,
    [unsubscribeToken],
    (raw) => raw,
  )
  return Response.json({ unsubscribed: true })
}

const ISSUE_COLUMNS = `issues.id, issues.subject, issues.created_at AS createdAt, issues.total,
  (SELECT COUNT(*) FROM deliveries d WHERE d.issue_id = issues.id AND d.status != 'failed') AS sent,
  (SELECT COUNT(*) FROM deliveries d WHERE d.issue_id = issues.id AND d.status = 'failed') AS failed`

async function readIssue(db: Database, id: string): Promise<Issue> {
  const [issue] = await queryRows(
    db,
    `SELECT ${ISSUE_COLUMNS} FROM issues WHERE id = ?`,
    [id],
    parseIssue,
  )
  if (!issue) throw new HttpError(404, 'No such issue')
  return issue
}

/** Subscriber counts and the last 20 issues, for the composer. */
export async function overview(env: NewsletterEnv, key: string): Promise<Overview> {
  await requireKey(env, key)
  await migrate(env.DB, migrations)
  const subscribers: SubscriberCounts = {
    pending: 0,
    subscribed: 0,
    unsubscribed: 0,
    suppressed: 0,
  }
  const counts = await queryRows(
    env.DB,
    'SELECT status, COUNT(*) AS n FROM subscribers GROUP BY status',
    [],
    (raw) => ({ status: column(raw, 'status'), n: Number(cell(raw, 'n')) }),
  )
  for (const { status, n } of counts) {
    if (status === 'pending' || status === 'subscribed') subscribers[status] = n
    if (status === 'unsubscribed' || status === 'suppressed') subscribers[status] = n
  }
  const issues = await queryRows(
    env.DB,
    `SELECT ${ISSUE_COLUMNS} FROM issues ORDER BY created_at DESC LIMIT 20`,
    [],
    parseIssue,
  )
  return { subscribers, issues }
}

/** The issue as readers will get it, for the composer's preview. */
export async function preview(
  env: NewsletterEnv,
  input: IssueInput,
  origin: string,
): Promise<{ html: string; bytes: number }> {
  await requireKey(env, input.key)
  const { html, stats } = renderIssue(input.subject, input.body, origin)
  return { html, bytes: stats.bytes }
}

/**
 * Sends an issue to every confirmed subscriber: the issue is stored, and its readers go onto
 * the NEWSLETTER queue in chunks, which `deliver` sends at the queue's pace.
 */
export async function sendIssue(
  env: NewsletterEnv,
  input: IssueInput,
  origin: string,
): Promise<Issue> {
  await requireKey(env, input.key)
  mailer(env) // Deployed without SES, refuse now rather than fail in the queue.
  try {
    // An issue too large to send (Gmail clips it) is refused here, not retried in the queue.
    assertSendable(renderIssue(input.subject, input.body, origin))
  } catch (error) {
    throw new HttpError(400, error instanceof Error ? error.message : String(error))
  }
  await migrate(env.DB, migrations)
  const readers = await queryRows(
    env.DB,
    "SELECT email FROM subscribers WHERE status = 'subscribed' ORDER BY email",
    [],
    (raw) => column(raw, 'email'),
  )
  const id = crypto.randomUUID()
  await queryRows(
    env.DB,
    'INSERT INTO issues (id, subject, body, total, created_at) VALUES (?, ?, ?, ?, ?) RETURNING id',
    [id, input.subject, input.body, readers.length, new Date().toISOString()],
    (raw) => raw,
  )
  const messages: { body: NewsletterMessage }[] = []
  for (let i = 0; i < readers.length; i += CHUNK) {
    messages.push({ body: { issueId: id, emails: readers.slice(i, i + CHUNK), origin } })
  }
  // sendBatch takes at most 100 messages a call.
  for (let i = 0; i < messages.length; i += 100) {
    await env.NEWSLETTER.sendBatch(messages.slice(i, i + 100))
  }
  const issue = await readIssue(env.DB, id)
  await writeRoom(env.ROOMS, issueRoom(id), 'issue', { ...issue })
  return issue
}

function parseMessage(raw: unknown): NewsletterMessage {
  if (typeof raw === 'object' && raw !== null) {
    const { issueId, emails, origin } = raw as Record<string, unknown>
    if (
      typeof issueId === 'string' &&
      ISSUE_ID.test(issueId) &&
      Array.isArray(emails) &&
      emails.every((e) => typeof e === 'string') &&
      typeof origin === 'string'
    ) {
      return { issueId, emails: emails as string[], origin }
    }
  }
  throw new Error('Malformed newsletter message')
}

/**
 * The NEWSLETTER queue's consumer: sends each reader in the message their copy, with their
 * own unsubscribe link and the one-click headers bulk senders need. A reader who left or was
 * suppressed since the issue was queued is skipped. SES throttling or a server error throws,
 * and the queue retries the message: whoever was sent already has a delivery row and is not
 * sent again. A refusal for one address (an invalid one, say) is recorded and the rest go on.
 */
export async function deliver(env: NewsletterEnv, batch: NewsletterBatch): Promise<void> {
  await migrate(env.DB, migrations)
  const send = mailer(env)
  for (const { body } of batch.messages) {
    const { issueId, emails, origin } = parseMessage(body)
    const [issue] = await queryRows(
      env.DB,
      'SELECT subject, body FROM issues WHERE id = ?',
      [issueId],
      (raw) => ({ subject: column(raw, 'subject'), body: column(raw, 'body') }),
    )
    if (!issue) continue
    const rendered = renderIssue(issue.subject, issue.body, origin)
    const placeholders = emails.map(() => '?').join(', ')
    const readers = await queryRows(
      env.DB,
      `SELECT s.email, s.unsubscribe_token AS token FROM subscribers s
       WHERE s.email IN (${placeholders}) AND s.status = 'subscribed'
         AND NOT EXISTS (SELECT 1 FROM deliveries d WHERE d.issue_id = ? AND d.email = s.email)`,
      [...emails, issueId],
      (raw) => ({ email: column(raw, 'email'), token: column(raw, 'token') }),
    )
    for (const { email, token: readerToken } of readers) {
      const unsubscribe = `${origin}/api/newsletter/unsubscribe?token=${readerToken}`
      let status: string
      let detail: string | null = null
      try {
        status = await send(
          email,
          {
            ...rendered,
            html: rendered.html.replaceAll(TOKEN_SLOT, readerToken),
            text: rendered.text.replaceAll(TOKEN_SLOT, readerToken),
          },
          {
            'List-Unsubscribe': `<${unsubscribe}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        )
      } catch (error) {
        if (!(error instanceof SesError) || error.retryable) throw error
        status = 'failed'
        detail = `${error.code ?? error.status}: ${error.message}`.slice(0, 300)
      }
      await queryRows(
        env.DB,
        `INSERT INTO deliveries (issue_id, email, status, detail, at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT DO NOTHING RETURNING email`,
        [issueId, email, status, detail, new Date().toISOString()],
        (raw) => raw,
      )
    }
    const progress = await readIssue(env.DB, issueId)
    await writeRoom(env.ROOMS, issueRoom(issueId), 'issue', { ...progress })
  }
}

/**
 * SES's feedback, delivered by SNS: a permanent bounce or a complaint suppresses the address
 * for good. Sending to them again is what gets an SES account put under review.
 */
export async function receiveFeedback(request: Request, env: NewsletterEnv): Promise<Response> {
  if (!env.SNS_TOPIC_ARN) throw new HttpError(503, 'Set SNS_TOPIC_ARN in wrangler.jsonc (README)')
  return handleSns(request, {
    topicArn: env.SNS_TOPIC_ARN,
    // The one topic configured above: confirming it is the operator's own choice.
    confirmSubscriptions: true,
    onNotification: async ({ message }) => {
      const event = parseSesNotification(message)
      const suppress =
        event.kind === 'complaint' || (event.kind === 'bounce' && event.bounceType === 'Permanent')
      if (!suppress || event.recipients.length === 0) return
      await migrate(env.DB, migrations)
      // D1 binds at most 100 parameters; one bounce rarely names more than a few addresses.
      const recipients = event.recipients
        .slice(0, 90)
        .map((address) => address.trim().toLowerCase())
      await queryRows(
        env.DB,
        `UPDATE subscribers SET status = 'suppressed', reason = ?
         WHERE email IN (${recipients.map(() => '?').join(', ')}) RETURNING email`,
        [event.kind, ...recipients],
        (raw) => raw,
      )
    },
  })
}
