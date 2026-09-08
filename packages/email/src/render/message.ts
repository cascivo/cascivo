/**
 * The email as a *message*, not just a document.
 *
 * A rendered `html` string is not something you can send. A message also needs a subject,
 * a text alternative, and — if it is to be opened in a real client rather than posted to a
 * provider API — a MIME envelope. Those concerns kept leaking: the subject was duplicated
 * between the caller and the template's `<title>`, and the `.eml` builder lived in the
 * preview app's UI where nothing tested it.
 *
 * This module is where they live now.
 */

/** Everything a mailer needs, and nothing about how it is delivered. */
export interface EmailMessage {
  /** The subject line. */
  subject: string
  /** The rendered HTML part. */
  html: string
  /** The plain-text alternative. Always send it alongside the HTML. */
  text: string
  /**
   * The inbox preview line, if the email declares one via `<Preview>`.
   *
   * `null` means it does not, and a client will show the opening words of the body instead —
   * which is almost never intended. Surfaced so a caller can assert on it.
   */
  preheader: string | null
}

export interface BuildMessageOptions {
  from?: string
  to?: string
  replyTo?: string
  /**
   * Extra headers, e.g. `List-Unsubscribe`.
   *
   * Not validated beyond rejecting newlines: a header value carrying CR or LF is a header
   * injection, and it is the one thing this must not pass through.
   */
  headers?: Record<string, string>
  /** Fixed boundary, for tests that need byte-stable output. */
  boundary?: string
  /** Fixed date, for the same reason. */
  date?: Date
}

/** RFC 5322 forbids CR and LF in a header value; unchecked, they inject headers. */
function assertHeaderSafe(name: string, value: string): void {
  if (/[\r\n]/.test(value)) {
    throw new Error(
      `Header ${name} contains a newline — this would inject headers into the message`,
    )
  }
}

/**
 * Encode a header value that is not pure ASCII, per RFC 2047.
 *
 * A subject like "Your receipt — €60.00" is common and breaks a naive builder: the raw
 * bytes are not legal in a header, and clients render mojibake. Base64 `=?UTF-8?B?…?=` is
 * the encoding every client understands.
 */
function encodeHeaderValue(value: string): string {
  // eslint-disable-next-line no-control-regex -- the point is to detect non-ASCII bytes.
  if (!/[^ -~]/.test(value)) return value
  const base64 = btoa(String.fromCharCode(...new TextEncoder().encode(value)))
  return `=?UTF-8?B?${base64}?=`
}

/**
 * Build a `multipart/alternative` MIME message.
 *
 * Text part first, HTML second: RFC 2046 orders alternatives from least to most faithful,
 * and clients pick the last one they can render. Reversing them is a real bug that shows the
 * plain text to everyone.
 *
 * The result is a valid `.eml` — save it and open it in any client. That is the cheapest way
 * to see an email in a real Outlook or Apple Mail, and it needs no service.
 */
export function buildMessage(message: EmailMessage, options: BuildMessageOptions = {}): string {
  const {
    from = 'noreply@example.com',
    to = 'recipient@example.com',
    replyTo,
    headers = {},
    boundary = `cascivo-${Math.random().toString(36).slice(2, 12)}`,
    date = new Date(),
  } = options

  const head: [string, string][] = [
    ['MIME-Version', '1.0'],
    ['Date', date.toUTCString()],
    ['From', from],
    ['To', to],
    ...(replyTo ? ([['Reply-To', replyTo]] as [string, string][]) : []),
    ['Subject', message.subject],
    ...Object.entries(headers),
    ['Content-Type', `multipart/alternative; boundary="${boundary}"`],
  ]

  /*
   * Validate the RAW value, then encode. Encoding first would base64 a CRLF into
   * harmlessness and silently accept a subject that was trying to forge a `Bcc` — safe, but
   * silently transforming a hostile input is worse than refusing it, and no legitimate
   * subject contains a newline.
   */
  for (const [name, value] of head) assertHeaderSafe(name, value)
  const encoded = head.map(([name, value]): [string, string] => [name, encodeHeaderValue(value)])

  return [
    ...encoded.map(([name, value]) => `${name}: ${value}`),
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: quoted-printable',
    '',
    quotedPrintable(message.text),
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: quoted-printable',
    '',
    quotedPrintable(message.html),
    '',
    `--${boundary}--`,
    '',
  ].join('\r\n')
}

/**
 * Quoted-printable encoding, RFC 2045.
 *
 * The same encoding `renderEmail`'s size accounting measures against, so the byte figure a
 * budget checks and the bytes a client receives are the same number rather than two
 * estimates that happen to be close.
 */
export function quotedPrintable(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let out = ''
  let column = 0

  for (const byte of bytes) {
    if (byte === 0x0a) {
      out += '\r\n'
      column = 0
      continue
    }
    if (byte === 0x0d) continue

    const printable = byte >= 0x20 && byte <= 0x7e && byte !== 0x3d
    const chunk = printable
      ? String.fromCharCode(byte)
      : `=${byte.toString(16).toUpperCase().padStart(2, '0')}`

    if (column + chunk.length > 75) {
      out += '=\r\n'
      column = 0
    }
    out += chunk
    column += chunk.length
  }

  return out
}
