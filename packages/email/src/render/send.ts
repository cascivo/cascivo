import { assertHeaderSafe } from './message.ts'
import { assertSendable } from './render.tsx'
import type { RenderResult } from './render.tsx'

/** A sender or recipient: a bare address, or a display name with one. */
export type EmailRecipient = string | { name: string; email: string }

/** Who a message is from and to: everything a send needs that the template does not own. */
export interface EmailEnvelope {
  from: EmailRecipient
  to: EmailRecipient | EmailRecipient[]
  cc?: EmailRecipient | EmailRecipient[]
  bcc?: EmailRecipient | EmailRecipient[]
  replyTo?: EmailRecipient
  /** Extra headers, e.g. `List-Unsubscribe`. */
  headers?: Record<string, string>
  /** Files to attach, e.g. a PDF report. */
  attachments?: EmailAttachment[]
}

/** A file attached to an email. */
export interface EmailAttachment {
  /** The name the recipient sees, e.g. `report.pdf`. */
  filename: string
  /** Its MIME type, e.g. `application/pdf`. */
  type: string
  content: ArrayBuffer | ArrayBufferView | string
  disposition: 'attachment'
}

/** What a sender receives: the envelope plus the rendered parts. */
export interface OutgoingEmail extends EmailEnvelope {
  subject: string
  html: string
  text: string
}

/**
 * Anything whose `send(message)` takes a composed email. Cloudflare's Email Service binding
 * (`send_email` in wrangler.jsonc) is one; it is typed by shape, so this package needs no
 * Cloudflare types, and the binding's own wider type satisfies it.
 */
export interface EmailSender {
  send(message: OutgoingEmail): Promise<{ messageId: string }>
}

function addresses(value: EmailRecipient | EmailRecipient[] | undefined): EmailRecipient[] {
  return value === undefined ? [] : Array.isArray(value) ? value : [value]
}

/**
 * Sends a rendered email through a sender, after the gate a send path should always run:
 * `assertSendable` throws on no subject, no preheader, no text part or a clipped body, so
 * nothing half-finished leaves. Every address and header is checked for CR/LF, which would
 * inject headers into the message the sender builds.
 *
 * ```ts
 * const message = renderEmail(<Welcome name={name} />, { subject: welcomeSubject(name) })
 * const { messageId } = await sendEmail(env.EMAIL, message, { from: 'hi@example.com', to })
 * ```
 */
export async function sendEmail(
  sender: EmailSender,
  message: RenderResult,
  envelope: EmailEnvelope,
): Promise<{ messageId: string }> {
  assertSendable(message)
  const { from, to, cc, bcc, replyTo, headers = {}, attachments = [] } = envelope
  for (const [field, list] of [
    ['From', addresses(from)],
    ['To', addresses(to)],
    ['Cc', addresses(cc)],
    ['Bcc', addresses(bcc)],
    ['Reply-To', addresses(replyTo)],
  ] as const) {
    for (const address of list) {
      if (typeof address === 'string') assertHeaderSafe(field, address)
      else {
        assertHeaderSafe(field, address.name)
        assertHeaderSafe(field, address.email)
      }
    }
  }
  for (const [name, value] of Object.entries(headers)) {
    assertHeaderSafe('Header name', name)
    assertHeaderSafe(name, value)
  }
  // An attachment's name and type become MIME headers too.
  for (const attachment of attachments) {
    assertHeaderSafe('Attachment filename', attachment.filename)
    assertHeaderSafe('Attachment type', attachment.type)
  }
  return sender.send({
    ...envelope,
    subject: message.subject,
    html: message.html,
    text: message.text,
  })
}
