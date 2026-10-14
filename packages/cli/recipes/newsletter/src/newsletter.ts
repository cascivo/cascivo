/**
 * The newsletter's wire types, shared by the Worker (worker/newsletter.ts) and its pages.
 * Every payload is parsed on arrival: the network is not trusted because the types match.
 */

/** Longest subject and body the composer accepts. */
export const MAX_SUBJECT = 200
export const MAX_BODY = 50_000

export interface SubscriberCounts {
  /** Signed up, has not clicked the confirmation link yet. */
  pending: number
  subscribed: number
  unsubscribed: number
  /** Bounced for good or complained: never mailed again (worker/newsletter.ts). */
  suppressed: number
}

/** One sent issue and how far its sending has got. */
export interface Issue {
  id: string
  subject: string
  createdAt: string
  /** Subscribers it was queued for. */
  total: number
  sent: number
  failed: number
}

export interface Overview {
  subscribers: SubscriberCounts
  issues: Issue[]
}

/** The room the Worker pushes an issue's progress to; the composer watches it. */
export const issueRoom = (id: string) => `issue-${id}`

/** An issue id: a UUID the Worker made. */
export const ISSUE_ID = /^[0-9a-f-]{36}$/

const isRecord = (raw: unknown): raw is Record<string, unknown> =>
  typeof raw === 'object' && raw !== null

function text(raw: Record<string, unknown>, key: string, max: number): string {
  const value = raw[key]
  if (typeof value !== 'string' || value.trim() === '' || value.length > max) {
    throw new Error(`Expected ${key}: some text, at most ${max} characters`)
  }
  return value
}

export function parseEmailInput(raw: unknown): { email: string } {
  if (!isRecord(raw)) throw new Error('Expected { email }')
  return { email: text(raw, 'email', 254) }
}

export function parseTokenInput(raw: unknown): { token: string } {
  if (!isRecord(raw)) throw new Error('Expected { token }')
  return { token: text(raw, 'token', 100) }
}

/** The composer's key: NEWSLETTER_KEY, which only the sender knows. */
export function parseKeyInput(raw: unknown): { key: string } {
  if (!isRecord(raw)) throw new Error('Expected { key }')
  return { key: text(raw, 'key', 200) }
}

export interface IssueInput {
  key: string
  subject: string
  /** The body in Markdown, rendered by @cascivo/email's Markdown. */
  body: string
}

export function parseIssueInput(raw: unknown): IssueInput {
  if (!isRecord(raw)) throw new Error('Expected { key, subject, body }')
  return {
    key: text(raw, 'key', 200),
    subject: text(raw, 'subject', MAX_SUBJECT),
    body: text(raw, 'body', MAX_BODY),
  }
}

export function parseSubscribed(raw: unknown): { devLink: string | null } {
  if (isRecord(raw) && (raw['devLink'] === null || typeof raw['devLink'] === 'string')) {
    return { devLink: raw['devLink'] }
  }
  throw new Error('Malformed reply')
}

export function parseConfirmed(raw: unknown): { email: string } {
  if (isRecord(raw) && typeof raw['email'] === 'string') return { email: raw['email'] }
  throw new Error('Malformed reply')
}

export function parsePreview(raw: unknown): { html: string; bytes: number } {
  if (isRecord(raw) && typeof raw['html'] === 'string' && typeof raw['bytes'] === 'number') {
    return { html: raw['html'], bytes: raw['bytes'] }
  }
  throw new Error('Malformed preview')
}

const count = (raw: Record<string, unknown>, key: string): number => {
  const value = raw[key]
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`Expected a count for ${key}`)
  }
  return value
}

export function parseIssue(raw: unknown): Issue {
  if (isRecord(raw) && typeof raw['id'] === 'string' && typeof raw['createdAt'] === 'string') {
    return {
      id: raw['id'],
      subject: text(raw, 'subject', MAX_SUBJECT),
      createdAt: raw['createdAt'],
      total: count(raw, 'total'),
      sent: count(raw, 'sent'),
      failed: count(raw, 'failed'),
    }
  }
  throw new Error('Malformed issue')
}

export function parseOverview(raw: unknown): Overview {
  if (isRecord(raw) && isRecord(raw['subscribers']) && Array.isArray(raw['issues'])) {
    const s = raw['subscribers']
    return {
      subscribers: {
        pending: count(s, 'pending'),
        subscribed: count(s, 'subscribed'),
        unsubscribed: count(s, 'unsubscribed'),
        suppressed: count(s, 'suppressed'),
      },
      issues: raw['issues'].map(parseIssue),
    }
  }
  throw new Error('Malformed overview')
}
