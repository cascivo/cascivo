import { describe, expect, it } from 'vitest'
import { PasswordReset, passwordResetSubject } from '../templates/index.ts'
import { renderEmail } from './render.tsx'
import { resendSender, type ResendClient, type ResendPayload } from './resend.ts'
import { sendEmail } from './send.ts'

function client(
  reply: Awaited<ReturnType<ResendClient['emails']['send']>> = {
    data: { id: 're_123' },
    error: null,
  },
) {
  const sent: ResendPayload[] = []
  const resend: ResendClient = {
    emails: {
      send(payload) {
        sent.push(payload)
        return Promise.resolve(reply)
      },
    },
  }
  return { resend, sent }
}

const message = renderEmail(<PasswordReset resetHref="https://acme.io/reset" />, {
  subject: passwordResetSubject(),
})

describe('resendSender', () => {
  it('maps the envelope and rendered parts onto Resend’s payload', async () => {
    const { resend, sent } = client()
    const result = await sendEmail(resendSender(resend), message, {
      from: { name: 'Acme, Inc.', email: 'hi@acme.io' },
      to: 'ada@acme.io',
      cc: ['b@acme.io', { name: 'Cy "C" Doe', email: 'c@acme.io' }],
      replyTo: 'support@acme.io',
      headers: { 'List-Unsubscribe': '<https://acme.io/unsubscribe>' },
    })
    expect(result).toEqual({ messageId: 're_123' })
    expect(sent).toEqual([
      {
        from: '"Acme, Inc." <hi@acme.io>',
        to: ['ada@acme.io'],
        cc: ['b@acme.io', '"Cy \\"C\\" Doe" <c@acme.io>'],
        replyTo: ['support@acme.io'],
        subject: 'Reset your password',
        html: message.html,
        text: message.text,
        headers: { 'List-Unsubscribe': '<https://acme.io/unsubscribe>' },
      },
    ])
  })

  it('sends attachments as base64 with their content type', async () => {
    const { resend, sent } = client()
    await sendEmail(resendSender(resend), message, {
      from: 'hi@acme.io',
      to: 'ada@acme.io',
      attachments: [
        {
          filename: 'r.pdf',
          type: 'application/pdf',
          content: new Uint8Array([37, 80, 68, 70]),
          disposition: 'attachment',
        },
        { filename: 'a.txt', type: 'text/plain', content: 'aGk=', disposition: 'attachment' },
      ],
    })
    expect(sent[0]?.attachments).toEqual([
      { filename: 'r.pdf', contentType: 'application/pdf', content: 'JVBERg==' },
      { filename: 'a.txt', contentType: 'text/plain', content: 'aGk=' },
    ])
  })

  it('throws Resend’s error instead of returning it', async () => {
    const { resend } = client({
      data: null,
      error: { name: 'validation_error', message: 'Invalid `from` field.' },
    })
    await expect(
      sendEmail(resendSender(resend), message, { from: 'nope', to: 'ada@acme.io' }),
    ).rejects.toThrow('Resend refused the email: validation_error: Invalid `from` field.')
  })

  it('never reaches Resend with an unsendable message', async () => {
    const { resend, sent } = client()
    const unfilled = renderEmail(<PasswordReset />, { subject: passwordResetSubject() })
    await expect(
      sendEmail(resendSender(resend), unfilled, { from: 'hi@acme.io', to: 'ada@acme.io' }),
    ).rejects.toThrow(/not sendable/)
    expect(sent).toHaveLength(0)
  })
})
