/**
 * The send path: a rendered message handed to a sender (Cloudflare's Email Service binding,
 * in production). What must hold is that nothing unsendable leaves, and nothing in the
 * envelope can smuggle a header into the message the sender builds.
 */
import { describe, expect, it } from 'vitest'
import { Body, Html, Text } from '../components/index.ts'
import { PasswordReset, passwordResetSubject } from '../templates/index.ts'
import { renderEmail } from './render.tsx'
import { sendEmail } from './send.ts'
import type { EmailSender, OutgoingEmail } from './send.ts'

function recorder(): EmailSender & { sent: OutgoingEmail[] } {
  const sent: OutgoingEmail[] = []
  return {
    sent,
    send: async (message) => {
      sent.push(message)
      return { messageId: `<${sent.length}@test>` }
    },
  }
}

const message = renderEmail(<PasswordReset resetHref="https://acme.io/reset" />, {
  subject: passwordResetSubject(),
})

describe('sendEmail', () => {
  it('hands the sender the envelope and every rendered part', async () => {
    const sender = recorder()
    const result = await sendEmail(sender, message, {
      from: { name: 'Acme', email: 'hello@acme.test' },
      to: 'ada@example.test',
      headers: { 'List-Unsubscribe': '<https://acme.test/unsubscribe>' },
    })
    expect(result).toEqual({ messageId: '<1@test>' })
    expect(sender.sent[0]).toEqual({
      from: { name: 'Acme', email: 'hello@acme.test' },
      to: 'ada@example.test',
      headers: { 'List-Unsubscribe': '<https://acme.test/unsubscribe>' },
      subject: 'Reset your password',
      html: message.html,
      text: message.text,
    })
  })

  it('refuses an unsendable message before calling the sender', async () => {
    const sender = recorder()
    const bare = renderEmail(
      <Html>
        <Body>
          <Text>No subject, no preheader.</Text>
        </Body>
      </Html>,
    )
    await expect(sendEmail(sender, bare, { from: 'a@x.test', to: 'b@x.test' })).rejects.toThrow(
      /not sendable: no subject/,
    )
    expect(sender.sent).toHaveLength(0)
  })

  it('refuses a message still carrying a template default link', async () => {
    const sender = recorder()
    const unfilled = renderEmail(<PasswordReset />, { subject: passwordResetSubject() })
    await expect(sendEmail(sender, unfilled, { from: 'a@x.test', to: 'b@x.test' })).rejects.toThrow(
      /example\.com\/reset" points at a reserved placeholder domain/,
    )
    expect(sender.sent).toHaveLength(0)
  })

  it.each([
    ['a recipient', { to: 'b@x.test\r\nBcc: everyone@x.test' }],
    ['a display name', { to: { name: 'Ada\nBcc: everyone@x.test', email: 'b@x.test' } }],
    ['a reply-to', { replyTo: 'r@x.test\r\nX-Evil: 1' }],
    ['a header value', { headers: { 'X-Campaign': 'spring\r\nBcc: everyone@x.test' } }],
    ['a header name', { headers: { 'X-A\r\nBcc': 'everyone@x.test' } }],
    [
      'an attachment name',
      {
        attachments: [
          {
            filename: 'r.pdf\r\nBcc: x@x.test',
            type: 'application/pdf',
            content: 'x',
            disposition: 'attachment' as const,
          },
        ],
      },
    ],
  ])('rejects CR/LF in %s', async (_, extra) => {
    const sender = recorder()
    await expect(
      sendEmail(sender, message, { from: 'a@x.test', to: 'b@x.test', ...extra }),
    ).rejects.toThrow(/newline/)
    expect(sender.sent).toHaveLength(0)
  })

  it('passes attachments through to the sender', async () => {
    const sender = recorder()
    const pdf = new Uint8Array([37, 80, 68, 70])
    await sendEmail(sender, message, {
      from: 'a@x.test',
      to: 'b@x.test',
      attachments: [
        {
          filename: 'report.pdf',
          type: 'application/pdf',
          content: pdf,
          disposition: 'attachment',
        },
      ],
    })
    expect(sender.sent[0]?.attachments).toEqual([
      { filename: 'report.pdf', type: 'application/pdf', content: pdf, disposition: 'attachment' },
    ])
  })
})
