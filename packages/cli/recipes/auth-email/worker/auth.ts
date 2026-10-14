/** What sending a sign-in link needs of the Email Service binding (`send_email`). */
export interface SignInSender {
  send(message: {
    from: string
    to: string
    subject: string
    text: string
    html: string
  }): Promise<unknown>
}

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Emails a sign-in link. `vite dev` sends nothing: the link is logged, and the Account page
 * shows it (`exposeLink` in worker/index.ts).
 */
export async function sendSignInLink(
  sender: SignInSender,
  from: string,
  email: string,
  url: string,
): Promise<void> {
  if (import.meta.env.DEV) {
    console.log(`[auth] sign-in link for ${email}: ${url}`)
    return
  }
  if (!from) throw new Error('Set AUTH_FROM in wrangler.jsonc to an address on your domain')
  await sender.send({
    from,
    to: email,
    subject: 'Your sign-in link',
    text: `Sign in: ${url}\n\nThe link works once, for 15 minutes. If you did not ask for it, ignore this email.`,
    html: `<p><a href="${escape(url)}">Sign in</a></p><p>The link works once, for 15 minutes. If you did not ask for it, ignore this email.</p>`,
  })
}
