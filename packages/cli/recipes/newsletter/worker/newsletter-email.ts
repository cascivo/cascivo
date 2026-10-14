import {
  Body,
  Button,
  Container,
  Footer,
  Head,
  Heading,
  Html,
  Link,
  Markdown,
  Preview,
  Section,
  Text,
  renderEmail,
} from '@cascivo/email'
import type { RenderResult } from '@cascivo/email'
import { createElement as h } from 'react'

/** Who the newsletter is from, as its emails say. */
export const NEWSLETTER_NAME = '{{brand}}'

/** Stands in for each reader's unsubscribe token; worker/newsletter.ts swaps it per message. */
export const TOKEN_SLOT = '__UNSUBSCRIBE_TOKEN__'

/**
 * An issue, rendered once with @cascivo/email: the body is Markdown, drawn through the email
 * primitives (raw HTML in it stays literal text). The footer carries the unsubscribe link,
 * with TOKEN_SLOT where each reader's token goes.
 */
export function renderIssue(subject: string, body: string, origin: string): RenderResult {
  const unsubscribe = `${origin}/newsletter/unsubscribe?token=${TOKEN_SLOT}`
  return renderEmail(
    h(
      Html,
      null,
      h(Head, { title: subject }),
      h(
        Body,
        null,
        h(Preview, null, subject),
        h(
          Container,
          null,
          h(Section, { padding: 32 }, h(Heading, { level: 1 }, subject), h(Markdown, null, body)),
          h(
            Footer,
            null,
            `You get this because you subscribed to ${NEWSLETTER_NAME}. `,
            h(Link, { href: unsubscribe }, 'Unsubscribe'),
          ),
        ),
      ),
    ),
    { subject },
  )
}

/** The double opt-in email: nobody is mailed an issue until they open this link. */
export function renderConfirmation(confirmUrl: string): RenderResult {
  const subject = `Confirm your subscription to ${NEWSLETTER_NAME}`
  return renderEmail(
    h(
      Html,
      null,
      h(Head, { title: subject }),
      h(
        Body,
        null,
        h(Preview, null, 'One click and you are on the list.'),
        h(
          Container,
          null,
          h(
            Section,
            { padding: 32 },
            h(Heading, { level: 1 }, 'Confirm your subscription'),
            h(Text, null, `Someone, hopefully you, asked to get ${NEWSLETTER_NAME} by email.`),
            h(Button, { href: confirmUrl }, 'Yes, subscribe me'),
            h(
              Text,
              { variant: 'muted', size: '14px' },
              'The link works for 24 hours. If you did not ask, ignore this email: you will not hear from us again.',
            ),
          ),
        ),
      ),
    ),
    { subject },
  )
}
