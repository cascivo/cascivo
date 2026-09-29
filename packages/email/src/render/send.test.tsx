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

const message = renderEmail(<PasswordReset />, { subject: passwordResetSubject() })

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

  it.each([
    ['a recipient', { to: 'b@x.test\r\nBcc: everyone@x.test' }],
    ['a display name', { to: { name: 'Ada\nBcc: everyone@x.test', email: 'b@x.test' } }],
    ['a reply-to', { replyTo: 'r@x.test\r\nX-Evil: 1' }],
    ['a header value', { headers: { 'X-Campaign': 'spring\r\nBcc: everyone@x.test' } }],
    ['a header name', { headers: { 'X-A\r\nBcc': 'everyone@x.test' } }],
  ])('rejects CR/LF in %s', async (_, extra) => {
    const sender = recorder()
    await expect(
      sendEmail(sender, message, { from: 'a@x.test', to: 'b@x.test', ...extra }),
    ).rejects.toThrow(/newline/)
    expect(sender.sent).toHaveLength(0)
  })
})
