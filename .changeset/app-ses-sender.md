---
'@cascivo/app': minor
---

`@cascivo/app/ses`: the SES client is now also an `EmailSender` for `@cascivo/email`.
`createSes(...).send(message)` takes the composed message `sendEmail` hands over, so
`sendEmail(ses, renderEmail(…), envelope)` runs that package's checks before the message goes
to SES, and an app can switch from the Email Service binding by changing one argument.
Display names (RFC 2047-encoded when not plain ASCII), cc, bcc, reply-to and attachments map
onto SES v2's fields; a line break in any address, name, header or attachment name is refused.
