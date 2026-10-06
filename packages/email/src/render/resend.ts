/**
 * Resend as an `EmailSender`.
 *
 * `sendEmail` takes anything with `send(OutgoingEmail)`. Cloudflare's binding has that shape
 * already; Resend's SDK does not — it is `resend.emails.send(payload)`, wants `"Name <a@b>"`
 * strings rather than objects, calls the attachment type `contentType`, and reports failure
 * as `{ data: null, error }` instead of throwing. This is that glue, once.
 *
 * Typed by shape, like the Cloudflare binding: this package takes no dependency on the
 * `resend` SDK, and the SDK's own client satisfies `ResendClient`.
 */
import type { EmailAttachment, EmailRecipient, EmailSender } from './send.ts'

/** The fields of Resend's `emails.send` payload this adapter fills in. */
export interface ResendPayload {
  from: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  replyTo?: string[]
  subject: string
  html: string
  text: string
  headers?: Record<string, string>
  attachments?: { filename: string; content: string; contentType: string }[]
}

/** The part of the `resend` SDK client the adapter calls: `new Resend(key)` satisfies it. */
export interface ResendClient {
  emails: {
    send(payload: ResendPayload): Promise<{
      data: { id: string } | null
      error: { message: string; name?: string } | null
    }>
  }
}

/** `"Name" <address>` — quoted, so a comma in a company name does not split the recipient. */
function format(recipient: EmailRecipient): string {
  if (typeof recipient === 'string') return recipient
  return `"${recipient.name.replace(/["\\]/g, '\\$&')}" <${recipient.email}>`
}

function list(value: EmailRecipient | EmailRecipient[]): string[] {
  return (Array.isArray(value) ? value : [value]).map(format)
}

function base64(bytes: Uint8Array): string {
  let binary = ''
  // In chunks: spreading a large file into one call overflows the stack.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

/**
 * Base64, not a `Buffer`: Resend accepts either, and a string works in a Worker too. A string
 * `content` is taken to be base64 already, as the Cloudflare binding and `@cascivo/app/ses` take it.
 */
function attachment({ filename, type, content }: EmailAttachment) {
  return {
    filename,
    contentType: type,
    content:
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
 * Wrap a Resend client so `sendEmail` can send through it.
 *
 * ```ts
 * import { Resend } from 'resend'
 * import { renderEmail, resendSender, sendEmail, Welcome, welcomeSubject } from '@cascivo/email'
 *
 * const resend = resendSender(new Resend(process.env.RESEND_API_KEY))
 * const message = renderEmail(<Welcome ctaHref={url} />, { subject: welcomeSubject() })
 * const { messageId } = await sendEmail(resend, message, { from: 'Acme <hi@acme.io>', to })
 * ```
 *
 * A Resend `error` is thrown, with Resend's own name and message, so a failed send cannot be
 * mistaken for a sent one by a caller that only awaits.
 */
export function resendSender(client: ResendClient): EmailSender {
  return {
    async send(message) {
      const { from, to, cc, bcc, replyTo, headers, attachments, subject, html, text } = message
      const { data, error } = await client.emails.send({
        from: format(from),
        to: list(to),
        ...(cc !== undefined ? { cc: list(cc) } : {}),
        ...(bcc !== undefined ? { bcc: list(bcc) } : {}),
        ...(replyTo !== undefined ? { replyTo: list(replyTo) } : {}),
        subject,
        html,
        text,
        ...(headers !== undefined && Object.keys(headers).length > 0 ? { headers } : {}),
        ...(attachments !== undefined && attachments.length > 0
          ? { attachments: attachments.map(attachment) }
          : {}),
      })
      if (error) {
        throw new Error(
          `Resend refused the email: ${error.name ? `${error.name}: ` : ''}${error.message}`,
        )
      }
      if (!data) throw new Error('Resend returned neither an id nor an error.')
      return { messageId: data.id }
    },
  }
}
