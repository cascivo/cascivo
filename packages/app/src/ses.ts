import { HttpError } from '@cascivo/data'

/**
 * `@cascivo/app/ses` — sending email with Amazon SES from a Worker, and hearing back from it.
 *
 * ```ts
 * const ses = createSes({ region: 'eu-west-1', accessKeyId, secretAccessKey })
 * await ses.sendEmail({ from: 'news@example.com', to: 'reader@example.org', subject, html, text,
 *   headers: { 'List-Unsubscribe': `<${url}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } })
 *
 * // SES reports bounces and complaints to an SNS topic; subscribe the Worker to it over HTTPS.
 * return handleSns(request, {
 *   topicArn: env.SNS_TOPIC_ARN,
 *   confirmSubscriptions: true,
 *   onNotification: async ({ message }) => {
 *     const event = parseSesNotification(message)
 *     if (event.kind === 'complaint') …suppress event.recipients…
 *   },
 * })
 * ```
 *
 * AWS Signature Version 4 is computed with WebCrypto, so there is no AWS SDK and no
 * `nodejs_compat`. SNS messages are checked against the certificate SNS signs them with,
 * fetched only from an `sns.<region>.amazonaws.com` URL.
 */

/* ------------------------------ Signature V4 ------------------------------ */

export interface AwsCredentials {
  accessKeyId: string
  secretAccessKey: string
  /** For temporary credentials (an assumed role). */
  sessionToken?: string
}

export interface AwsRequest {
  method: string
  url: string
  headers?: Record<string, string>
  body?: string
}

const encoder = new TextEncoder()

const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('')

async function sha256Hex(data: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', encoder.encode(data)))
}

async function hmac(
  key: ArrayBuffer | Uint8Array<ArrayBuffer>,
  data: string,
): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data))
}

/** RFC 3986 encoding, which AWS requires: `encodeURIComponent` leaves `!'()*` alone. */
const rfc3986 = (value: string): string =>
  encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  )

/**
 * Signs a request with AWS Signature Version 4 and returns the headers to send: yours, plus
 * `x-amz-date`, `x-amz-security-token` (with a session token) and `authorization`. `host` is
 * signed but not returned; `fetch` sets it. Paths are encoded as every service but S3 expects.
 */
export async function signAwsRequest(
  request: AwsRequest,
  credentials: AwsCredentials,
  scope: { region: string; service: string },
  now: Date = new Date(),
): Promise<Record<string, string>> {
  const url = new URL(request.url)
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const date = amzDate.slice(0, 8)

  const headers: Record<string, string> = {}
  for (const [name, value] of Object.entries(request.headers ?? {})) {
    headers[name.toLowerCase()] = value
  }
  headers['x-amz-date'] = amzDate
  if (credentials.sessionToken) headers['x-amz-security-token'] = credentials.sessionToken
  const signed: Record<string, string> = { ...headers, host: url.host }
  const names = Object.keys(signed).sort()
  const signedHeaders = names.join(';')

  const query = [...url.searchParams]
    .map(([key, value]) => [rfc3986(key), rfc3986(value)] as const)
    .sort(([a, x], [b, y]) => (a < b ? -1 : a > b ? 1 : x < y ? -1 : x > y ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('&')
  // `pathname` is already percent-encoded once; services other than S3 sign it encoded twice.
  const path = url.pathname.split('/').map(rfc3986).join('/') || '/'

  const canonical = [
    request.method.toUpperCase(),
    path,
    query,
    ...names.map((name) => `${name}:${signed[name]!.trim().replace(/\s+/g, ' ')}`),
    '',
    signedHeaders,
    await sha256Hex(request.body ?? ''),
  ].join('\n')
  const credentialScope = `${date}/${scope.region}/${scope.service}/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256Hex(canonical),
  ].join('\n')

  const kDate = await hmac(encoder.encode(`AWS4${credentials.secretAccessKey}`), date)
  const kRegion = await hmac(kDate, scope.region)
  const kService = await hmac(kRegion, scope.service)
  const kSigning = await hmac(kService, 'aws4_request')
  const signature = toHex(await hmac(kSigning, stringToSign))

  return {
    ...headers,
    authorization: `AWS4-HMAC-SHA256 Credential=${credentials.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  }
}

/* ----------------------------------- SES ----------------------------------- */

export interface SesOptions extends AwsCredentials {
  /** The SES region your identity is verified in, e.g. `eu-west-1`. */
  region: string
  /** Stand-in for the global `fetch`, for tests. */
  fetch?: typeof fetch
}

export interface SesMessage {
  /** A verified identity: `news@example.com`, or `Example News <news@example.com>`. */
  from: string
  to: string | string[]
  subject: string
  html?: string
  text?: string
  replyTo?: string[]
  /**
   * Extra headers, e.g. `List-Unsubscribe` and `List-Unsubscribe-Post` on bulk mail. A value
   * holding a line break is refused: it would start a header of its own.
   */
  headers?: Record<string, string>
  /** An SES configuration set, e.g. one publishing events to SNS. */
  configurationSet?: string
}

/** A refusal from SES: an unverified sender, the sandbox, throttling, a bad key. */
export class SesError extends Error {
  readonly status: number
  /** SES's error code, e.g. `MessageRejected` or `TooManyRequestsException`. */
  readonly code: string | null
  /** Throttling or a server error: the same send may succeed later. */
  readonly retryable: boolean

  constructor(status: number, message: string, code: string | null) {
    super(message)
    this.name = 'SesError'
    this.status = status
    this.code = code
    this.retryable = status === 429 || status >= 500 || code === 'TooManyRequestsException'
  }
}

/** A sender or recipient: a bare address, or a display name with one. */
export type SesRecipient = string | { name: string; email: string }

/** A file attached to a message `send` takes. */
export interface SesAttachment {
  /** The name the recipient sees, e.g. `report.pdf`. */
  filename: string
  /** Its MIME type, e.g. `application/pdf`. */
  type: string
  /** The bytes, or a string already base64-encoded (as the Email Service binding takes it). */
  content: ArrayBuffer | ArrayBufferView | string
  disposition: 'attachment'
}

/**
 * What `send` takes: the shape of `OutgoingEmail` in `@cascivo/email`, so an `Ses` is an
 * `EmailSender` there, like Cloudflare's Email Service binding, and
 * `sendEmail(ses, renderEmail(…), envelope)` runs that package's checks before it sends.
 */
export interface SesOutgoingEmail {
  from: SesRecipient
  to: SesRecipient | SesRecipient[]
  cc?: SesRecipient | SesRecipient[]
  bcc?: SesRecipient | SesRecipient[]
  replyTo?: SesRecipient
  subject: string
  html: string
  text: string
  /** Extra headers, e.g. `List-Unsubscribe`. SES takes at most 15. */
  headers?: Record<string, string>
  attachments?: SesAttachment[]
}

export interface Ses {
  /** Sends one message (SES v2 `SendEmail`) and returns SES's message id. */
  sendEmail(message: SesMessage): Promise<{ messageId: string }>
  /**
   * Sends a composed message, as `sendEmail` from `@cascivo/email` hands it over: pass the
   * client itself as that function's sender. Display names that are not plain ASCII are
   * encoded (RFC 2047); a line break in any address, name or header is refused.
   */
  send(message: SesOutgoingEmail): Promise<{ messageId: string }>
  /**
   * A domain or address identity as SES holds it (SES v2 `GetEmailIdentity`): whether it may
   * send, and the DKIM CNAME records to publish for it. `null` when SES has no such identity.
   * Needs `ses:GetEmailIdentity`.
   */
  identity(identity: string): Promise<SesIdentity | null>
}

/** A DNS record to publish, as a setup screen shows it. */
export interface SesDnsRecord {
  type: 'CNAME'
  /** The full record name, e.g. `abc123._domainkey.example.com`. */
  name: string
  /** What it points at, e.g. `abc123.dkim.amazonses.com`. */
  value: string
}

export interface SesIdentity {
  /** SES will send from it: its DNS checks passed. */
  verified: boolean
  dkim: {
    /** SES's `DkimAttributes.Status`: `PENDING`, `SUCCESS`, `FAILED`, `TEMPORARY_FAILURE`… */
    status: string | null
    /**
     * The three Easy DKIM CNAMEs, built on the region's own DKIM zone. Empty for an address
     * identity, or one signing with its own key (BYODKIM), whose records SES does not hold.
     */
    records: SesDnsRecord[]
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const utf8 = (data: string) => ({ Data: data, Charset: 'UTF-8' })

function refuseLineBreak(what: string, value: string): void {
  if (/[\r\n]/.test(value)) {
    throw new Error(`send: ${what} ${JSON.stringify(value)} holds a line break`)
  }
}

function base64(bytes: Uint8Array): string {
  let binary = ''
  // In chunks: spreading a large file into one call overflows the stack.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

/** `Name <address>`, quoted, or encoded when the name is not plain ASCII. */
function formatRecipient(recipient: SesRecipient): string {
  if (typeof recipient === 'string') {
    refuseLineBreak('address', recipient)
    return recipient
  }
  refuseLineBreak('address', recipient.email)
  refuseLineBreak('name', recipient.name)
  // eslint-disable-next-line no-control-regex -- the point is to detect non-ASCII characters.
  const name = /[^ -~]/.test(recipient.name)
    ? `=?UTF-8?B?${base64(encoder.encode(recipient.name))}?=`
    : `"${recipient.name.replace(/["\\]/g, '\\$&')}"`
  return `${name} <${recipient.email}>`
}

const recipients = (value: SesRecipient | SesRecipient[] | undefined): string[] =>
  (value === undefined ? [] : Array.isArray(value) ? value : [value]).map(formatRecipient)

function sesHeaders(headers: Record<string, string> = {}): { Name: string; Value: string }[] {
  return Object.entries(headers).map(([Name, Value]) => {
    if (/[\r\n]/.test(Name) || /[\r\n]/.test(Value)) {
      throw new Error(`sendEmail: header ${JSON.stringify(Name)} holds a line break`)
    }
    return { Name, Value }
  })
}

function sesAttachment(attachment: SesAttachment) {
  refuseLineBreak('attachment filename', attachment.filename)
  refuseLineBreak('attachment type', attachment.type)
  const { content } = attachment
  return {
    FileName: attachment.filename,
    ContentType: attachment.type,
    ContentDisposition: 'ATTACHMENT',
    ContentTransferEncoding: 'BASE64',
    RawContent:
      typeof content === 'string'
        ? content
        : base64(
            content instanceof ArrayBuffer
              ? new Uint8Array(content)
              : new Uint8Array(content.buffer, content.byteOffset, content.byteLength),
          ),
  }
}

/**
 * Creates an SES client. The IAM user needs `ses:SendEmail`, and `ses:GetEmailIdentity` if you
 * call `identity`.
 */
export function createSes(options: SesOptions): Ses {
  if (!options.region || !options.accessKeyId || !options.secretAccessKey) {
    throw new Error('createSes: region, accessKeyId and secretAccessKey are all required')
  }
  const fetcher = options.fetch ?? fetch
  const api = `https://email.${options.region}.amazonaws.com/v2/email`

  /** One signed SES v2 call; the parsed answer, or `SesError`. */
  async function call(method: 'GET' | 'POST', path: string, fields?: Record<string, unknown>) {
    const url = `${api}/${path}`
    const body = fields === undefined ? undefined : JSON.stringify(fields)
    const signed = await signAwsRequest(
      {
        method,
        url,
        ...(body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body }),
      },
      options,
      { region: options.region, service: 'ses' },
    )
    const response = await fetcher(url, {
      method,
      headers: signed,
      ...(body === undefined ? {} : { body }),
    })
    let payload: unknown = null
    try {
      payload = await response.json()
    } catch {
      // Not JSON: the status says what went wrong.
    }
    if (!response.ok) {
      // REST-JSON errors name their type in a header ("MessageRejected:http://…").
      const type = response.headers.get('x-amzn-errortype')?.split(':')[0] ?? null
      const said = isRecord(payload) ? (payload['message'] ?? payload['Message']) : null
      throw new SesError(
        response.status,
        typeof said === 'string' ? said : `SES answered ${response.status}`,
        type,
      )
    }
    return payload
  }

  /** One SES v2 `SendEmail` call with the request's fields. */
  async function post(fields: Record<string, unknown>): Promise<{ messageId: string }> {
    const payload = await call('POST', 'outbound-emails', fields)
    const messageId = isRecord(payload) ? payload['MessageId'] : null
    if (typeof messageId !== 'string') throw new Error('SES returned no MessageId')
    return { messageId }
  }

  return {
    async sendEmail(message) {
      if (!message.html && !message.text) throw new Error('sendEmail: give html, text or both')
      const headers = sesHeaders(message.headers)
      return post({
        FromEmailAddress: message.from,
        Destination: { ToAddresses: Array.isArray(message.to) ? message.to : [message.to] },
        ...(message.replyTo ? { ReplyToAddresses: message.replyTo } : {}),
        ...(message.configurationSet ? { ConfigurationSetName: message.configurationSet } : {}),
        Content: {
          Simple: {
            Subject: utf8(message.subject),
            Body: {
              ...(message.html ? { Html: utf8(message.html) } : {}),
              ...(message.text ? { Text: utf8(message.text) } : {}),
            },
            ...(headers.length > 0 ? { Headers: headers } : {}),
          },
        },
      })
    },
    async send(message) {
      const headers = sesHeaders(message.headers)
      const [from] = recipients(message.from)
      const cc = recipients(message.cc)
      const bcc = recipients(message.bcc)
      const replyTo = recipients(message.replyTo)
      const attachments = (message.attachments ?? []).map(sesAttachment)
      return post({
        FromEmailAddress: from,
        Destination: {
          ToAddresses: recipients(message.to),
          ...(cc.length > 0 ? { CcAddresses: cc } : {}),
          ...(bcc.length > 0 ? { BccAddresses: bcc } : {}),
        },
        ...(replyTo.length > 0 ? { ReplyToAddresses: replyTo } : {}),
        Content: {
          Simple: {
            Subject: utf8(message.subject),
            Body: { Html: utf8(message.html), Text: utf8(message.text) },
            ...(headers.length > 0 ? { Headers: headers } : {}),
            ...(attachments.length > 0 ? { Attachments: attachments } : {}),
          },
        },
      })
    },
    async identity(identity) {
      if (!identity || /[\s/]/.test(identity)) {
        throw new Error(`identity: ${JSON.stringify(identity)} is not a domain or an address`)
      }
      let payload: unknown
      try {
        payload = await call('GET', `identities/${encodeURIComponent(identity)}`)
      } catch (error) {
        if (error instanceof SesError && error.code === 'NotFoundException') return null
        throw error
      }
      const raw = isRecord(payload) ? payload : {}
      const dkim = isRecord(raw['DkimAttributes']) ? raw['DkimAttributes'] : {}
      const zone =
        typeof dkim['SigningHostedZone'] === 'string'
          ? dkim['SigningHostedZone']
          : 'dkim.amazonses.com'
      const domain = identity.includes('@') ? null : identity.toLowerCase()
      const easy = dkim['SigningAttributesOrigin'] !== 'EXTERNAL'
      const tokens = domain && easy ? addresses(dkim['Tokens']) : []
      return {
        verified: raw['VerifiedForSendingStatus'] === true,
        dkim: {
          status: typeof dkim['Status'] === 'string' ? dkim['Status'] : null,
          records: tokens.map((token) => ({
            type: 'CNAME' as const,
            name: `${token}._domainkey.${domain}`,
            value: `${token}.${zone}`,
          })),
        },
      }
    },
  }
}

/* ----------------------------------- SNS ----------------------------------- */

interface SnsBase {
  messageId: string
  topicArn: string
  message: string
  timestamp: string
}

export interface SnsNotification extends SnsBase {
  type: 'Notification'
  subject: string | null
}

export interface SnsSubscription extends SnsBase {
  type: 'SubscriptionConfirmation' | 'UnsubscribeConfirmation'
  token: string
  /**
   * Fetching it confirms the subscription. `confirmSnsSubscription` confirms from `topicArn`
   * and `token` instead, without following a URL the message supplied.
   */
  subscribeUrl: string
}

export type SnsMessage = SnsNotification | SnsSubscription

/** Only SNS's own hosts serve its certificates and confirmation links. */
const SNS_HOST = /^sns\.[a-z0-9-]+\.amazonaws\.com(\.cn)?$/

function snsUrl(raw: string, what: string): URL {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw refusedSns(`${what} is not a URL`)
  }
  if (url.protocol !== 'https:' || !SNS_HOST.test(url.hostname)) {
    throw refusedSns(`${what} is not on an SNS host`)
  }
  return url
}

const refusedSns = (why: string) => new HttpError(401, `SNS message refused: ${why}`)

/** The certificate's public key (its SubjectPublicKeyInfo), found by walking the DER. */
export function certificatePublicKey(der: Uint8Array): Uint8Array<ArrayBuffer> {
  const read = (at: number) => {
    if (at + 2 > der.length) throw new Error('Truncated certificate')
    const tag = der[at]!
    let length = der[at + 1]!
    let start = at + 2
    if (length & 0x80) {
      const count = length & 0x7f
      if (count === 0 || count > 4) throw new Error('Unsupported certificate length')
      length = 0
      for (let i = 0; i < count; i++) length = length * 256 + der[start + i]!
      start += count
    }
    const end = start + length
    if (end > der.length) throw new Error('Truncated certificate')
    return { tag, at, start, end }
  }
  const certificate = read(0)
  const tbs = read(certificate.start)
  // tbsCertificate: [0] version (optional), serial, signature, issuer, validity, subject, key.
  let field = read(tbs.start)
  if (field.tag === 0xa0) field = read(field.end)
  for (let i = 0; i < 5; i++) field = read(field.end)
  if (field.tag !== 0x30) throw new Error('No public key in the certificate')
  return new Uint8Array(der.slice(field.at, field.end))
}

function pemToDer(pem: string): Uint8Array<ArrayBuffer> {
  const base64 = pem.replace(/-----(BEGIN|END) CERTIFICATE-----/g, '').replace(/\s+/g, '')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/** Verification keys by certificate URL and hash; SNS rotates certificates rarely. */
const keys = new Map<string, Promise<CryptoKey>>()

function signingKey(certUrl: URL, hash: 'SHA-1' | 'SHA-256', send: typeof fetch) {
  const id = `${certUrl.href} ${hash}`
  let key = keys.get(id)
  if (!key) {
    key = (async () => {
      const response = await send(certUrl.href)
      if (!response.ok) throw new Error(`The SNS certificate answered ${response.status}`)
      const spki = certificatePublicKey(pemToDer(await response.text()))
      return crypto.subtle.importKey('spki', spki, { name: 'RSASSA-PKCS1-v1_5', hash }, false, [
        'verify',
      ])
    })()
    keys.set(id, key)
    // A failed fetch is not cached: the next message tries again.
    key.catch(() => keys.delete(id))
  }
  return key
}

/** SNS's canonical string: the signed fields, in this order, as `Name\nvalue\n` pairs. */
function stringToSign(message: SnsMessage): string {
  const fields: [string, string | null][] =
    message.type === 'Notification'
      ? [
          ['Message', message.message],
          ['MessageId', message.messageId],
          ['Subject', message.subject],
          ['Timestamp', message.timestamp],
          ['TopicArn', message.topicArn],
          ['Type', message.type],
        ]
      : [
          ['Message', message.message],
          ['MessageId', message.messageId],
          ['SubscribeURL', message.subscribeUrl],
          ['Timestamp', message.timestamp],
          ['Token', message.token],
          ['TopicArn', message.topicArn],
          ['Type', message.type],
        ]
  return fields
    .filter((field): field is [string, string] => field[1] !== null)
    .map(([name, value]) => `${name}\n${value}\n`)
    .join('')
}

const TYPES = ['Notification', 'SubscriptionConfirmation', 'UnsubscribeConfirmation'] as const

/**
 * The topics an endpoint accepts: one ARN, a list of them, or a test. Never the ARN read from
 * the message itself: that compares the message with itself and accepts every topic.
 */
export type SnsTopics = string | readonly string[] | ((topicArn: string) => boolean)

/**
 * Checks an SNS message's signature and topic, and returns it. Throws `HttpError(401)` for a
 * message from a topic `topicArn` does not accept, a certificate or link off SNS's hosts, or a
 * bad signature.
 *
 * The signature proves AWS sent the message, not that it concerns you: any AWS account can
 * create a topic, subscribe your endpoint to it and have SNS sign what it publishes. The topic
 * check is what ties a message to your own topics, so give it ARNs you know (configured, or
 * stored when an operator confirmed the subscription).
 */
export async function verifySnsMessage(
  body: string,
  options: { topicArn: SnsTopics; fetch?: typeof fetch },
): Promise<SnsMessage> {
  const { topicArn } = options
  const accepts =
    typeof topicArn === 'function'
      ? topicArn
      : typeof topicArn === 'string'
        ? (arn: string) => arn === topicArn
        : (arn: string) => topicArn.includes(arn)
  if (!topicArn || (Array.isArray(topicArn) && topicArn.length === 0)) {
    throw new Error('verifySnsMessage: no topicArn configured')
  }
  let raw: unknown
  try {
    raw = JSON.parse(body)
  } catch {
    throw new HttpError(400, 'An SNS message is JSON')
  }
  if (!isRecord(raw)) throw new HttpError(400, 'An SNS message is a JSON object')
  const text = (name: string): string => {
    const value = raw[name]
    if (typeof value !== 'string') throw new HttpError(400, `SNS message without ${name}`)
    return value
  }
  const type = TYPES.find((t) => t === raw['Type'])
  if (!type) throw new HttpError(400, 'Unknown SNS message type')
  const base = {
    messageId: text('MessageId'),
    topicArn: text('TopicArn'),
    message: text('Message'),
    timestamp: text('Timestamp'),
  }
  if (!accepts(base.topicArn)) throw refusedSns('another topic')
  const message: SnsMessage =
    type === 'Notification'
      ? {
          ...base,
          type,
          subject: typeof raw['Subject'] === 'string' ? raw['Subject'] : null,
        }
      : {
          ...base,
          type,
          token: text('Token'),
          subscribeUrl: snsUrl(text('SubscribeURL'), 'SubscribeURL').href,
        }

  const version = text('SignatureVersion')
  if (version !== '1' && version !== '2') throw refusedSns('unknown SignatureVersion')
  const certUrl = snsUrl(text('SigningCertURL'), 'SigningCertURL')
  if (!certUrl.pathname.endsWith('.pem')) throw refusedSns('SigningCertURL is not a .pem')
  let signature: Uint8Array<ArrayBuffer>
  try {
    signature = pemToDer(text('Signature'))
  } catch {
    throw refusedSns('malformed signature')
  }
  const key = await signingKey(
    certUrl,
    version === '1' ? 'SHA-1' : 'SHA-256',
    options.fetch ?? fetch,
  )
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    signature,
    encoder.encode(stringToSign(message)),
  )
  if (!valid) throw refusedSns('bad signature')
  return message
}

export interface SnsHandlerOptions {
  /** The topics this endpoint accepts (`SnsTopics`); messages from any other are refused. */
  topicArn: SnsTopics
  /** Runs for each verified notification. A throw answers 500, and SNS retries. */
  onNotification(notification: SnsNotification): Promise<void>
  /**
   * Confirm a subscription request from an accepted topic as it arrives. Off by default:
   * confirming decides who may write to this endpoint, which is an operator's call. On, the
   * confirmation is rebuilt from the verified `TopicArn` and `Token` (`confirmSnsSubscription`)
   * rather than by fetching the message's `SubscribeURL`.
   */
  confirmSubscriptions?: boolean
  /**
   * Runs for each verified subscription request when `confirmSubscriptions` is off: store its
   * `topicArn` and `token`, show them to an operator, and confirm with
   * `confirmSnsSubscription`. A token lasts three days.
   */
  onSubscription?(subscription: SnsSubscription): Promise<void>
  /** Stand-in for the global `fetch` (certificates, confirmations), for tests. */
  fetch?: typeof fetch
}

/**
 * Answers SNS's HTTPS deliveries: verifies each message and passes notifications to
 * `onNotification`. A subscription request goes to `onSubscription`, or is confirmed at once
 * with `confirmSubscriptions: true`.
 */
export async function handleSns(request: Request, options: SnsHandlerOptions): Promise<Response> {
  let message: SnsMessage
  try {
    message = await verifySnsMessage(await request.text(), options)
  } catch (error) {
    if (error instanceof HttpError) {
      return Response.json({ error: error.message }, { status: error.status })
    }
    throw error
  }
  if (message.type === 'SubscriptionConfirmation') {
    if (!options.confirmSubscriptions) {
      if (options.onSubscription) await options.onSubscription(message)
      else {
        console.warn(
          `[cascivo/ses] SNS asked to subscribe this endpoint to ${message.topicArn}; ` +
            'pass onSubscription or confirmSubscriptions: true to handleSns to answer it',
        )
      }
      return Response.json({ received: true })
    }
    try {
      await confirmSnsSubscription({
        topicArn: message.topicArn,
        token: message.token,
        ...(options.fetch ? { fetch: options.fetch } : {}),
      })
    } catch (error) {
      console.warn(
        `[cascivo/ses] could not confirm the subscription to ${message.topicArn}:`,
        error,
      )
      return Response.json({ error: 'Could not confirm the subscription' }, { status: 502 })
    }
    return Response.json({ confirmed: true })
  }
  if (message.type === 'Notification') await options.onNotification(message)
  return Response.json({ received: true })
}

const TOPIC_ARN = /^arn:(aws|aws-cn|aws-us-gov):sns:([a-z0-9-]+):\d{12}:[\w-]{1,256}(\.fifo)?$/

/**
 * Confirms an SNS subscription (`ConfirmSubscription`) from the topic and token of a verified
 * `SubscriptionConfirmation`, on the topic's own regional SNS host: the request is built here,
 * not taken from the message's `SubscribeURL`. Throws when SNS refuses (a token expires after
 * three days), and returns the subscription's ARN.
 */
export async function confirmSnsSubscription(options: {
  topicArn: string
  token: string
  fetch?: typeof fetch
}): Promise<{ subscriptionArn: string }> {
  const arn = TOPIC_ARN.exec(options.topicArn)
  if (!arn)
    throw new Error(
      `confirmSnsSubscription: ${JSON.stringify(options.topicArn)} is not an SNS topic ARN`,
    )
  if (!options.token) throw new Error('confirmSnsSubscription: no token')
  const url = new URL(`https://sns.${arn[2]}.amazonaws.com${arn[1] === 'aws-cn' ? '.cn' : ''}/`)
  url.searchParams.set('Action', 'ConfirmSubscription')
  url.searchParams.set('TopicArn', options.topicArn)
  url.searchParams.set('Token', options.token)
  const response = await (options.fetch ?? fetch)(url.href, { redirect: 'manual' })
  const xml = await response.text().catch(() => '')
  const tag = (name: string) => new RegExp(`<${name}>([^<]*)</${name}>`).exec(xml)?.[1] ?? null
  if (!response.ok) {
    throw new Error(
      `SNS refused the confirmation (${response.status}): ${tag('Message') ?? 'no reason given'}`,
    )
  }
  const subscriptionArn = tag('SubscriptionArn')
  if (!subscriptionArn || !subscriptionArn.startsWith('arn:')) {
    throw new Error(
      `SNS did not confirm the subscription: ${subscriptionArn ?? 'no SubscriptionArn'}`,
    )
  }
  return { subscriptionArn }
}

/* ---------------------------- SES notifications ---------------------------- */

export type SesBounceType = 'Permanent' | 'Transient' | 'Undetermined'

export type SesEvent = (
  | {
      kind: 'bounce'
      /** `Permanent`: never mail these addresses again. `Transient`: a full inbox, try later. */
      bounceType: SesBounceType
      /**
       * SES's `bounceSubType`: `General`, `NoEmail`, `Suppressed`, `OnAccountSuppressionList`,
       * `MailboxFull`… `OnAccountSuppressionList` means SES refused before sending.
       */
      subType: string | null
      /** The receiving server's SMTP refusal (`diagnosticCode`) for the first recipient. */
      diagnostic: string | null
      recipients: string[]
      messageId: string | null
    }
  /** The recipient marked the message as spam: stop mailing them. */
  | { kind: 'complaint'; recipients: string[]; messageId: string | null }
  | { kind: 'delivery'; recipients: string[]; messageId: string | null }
  | { kind: 'other'; type: string }
) & {
  /**
   * When it happened, in epoch milliseconds: the event's own `timestamp` (the bounce, the
   * complaint), else the message's. Not when the notification arrived: SNS can deliver out of
   * order. `null` when SES sent neither.
   */
  at: number | null
}

const BOUNCE_TYPES: readonly SesBounceType[] = ['Permanent', 'Transient', 'Undetermined']

function addresses(list: unknown, field?: string): string[] {
  if (!Array.isArray(list)) return []
  return list
    .map((item: unknown) => (field ? (isRecord(item) ? item[field] : null) : item))
    .filter((address): address is string => typeof address === 'string')
}

/**
 * Reads an SNS notification's `Message` as SES sends it: identity notifications
 * (`notificationType`) and configuration-set events (`eventType`) alike.
 */
export function parseSesNotification(message: string): SesEvent {
  let raw: unknown
  try {
    raw = JSON.parse(message)
  } catch {
    throw new Error('An SES notification is JSON')
  }
  if (!isRecord(raw)) throw new Error('An SES notification is a JSON object')
  const type = raw['notificationType'] ?? raw['eventType']
  if (typeof type !== 'string') throw new Error('An SES notification has a type')
  const mail = raw['mail']
  const messageId =
    isRecord(mail) && typeof mail['messageId'] === 'string' ? mail['messageId'] : null
  const section = (name: string) => {
    const value = raw[name]
    return isRecord(value) ? value : {}
  }
  const time = (value: unknown) => {
    const parsed = typeof value === 'string' ? Date.parse(value) : NaN
    return Number.isNaN(parsed) ? null : parsed
  }
  // Each event's details sit under its type, lowercased first: `bounce`, `deliveryDelay`…
  const at =
    time(section(type.charAt(0).toLowerCase() + type.slice(1))['timestamp']) ??
    time(isRecord(mail) ? mail['timestamp'] : null)
  const text = (value: unknown) => (typeof value === 'string' ? value : null)
  if (type === 'Bounce') {
    const bounce = section('bounce')
    const bounceType = BOUNCE_TYPES.find((t) => t === bounce['bounceType']) ?? 'Undetermined'
    const bounced = bounce['bouncedRecipients']
    const first = Array.isArray(bounced) && isRecord(bounced[0]) ? bounced[0] : {}
    return {
      kind: 'bounce',
      bounceType,
      subType: text(bounce['bounceSubType']),
      diagnostic: text(first['diagnosticCode']),
      recipients: addresses(bounced, 'emailAddress'),
      messageId,
      at,
    }
  }
  if (type === 'Complaint') {
    return {
      kind: 'complaint',
      recipients: addresses(section('complaint')['complainedRecipients'], 'emailAddress'),
      messageId,
      at,
    }
  }
  if (type === 'Delivery') {
    return {
      kind: 'delivery',
      recipients: addresses(section('delivery')['recipients']),
      messageId,
      at,
    }
  }
  return { kind: 'other', type, at }
}
