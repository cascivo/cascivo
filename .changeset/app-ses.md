---
'@cascivo/app': minor
---

`@cascivo/app/ses`: Amazon SES from a Worker with no AWS SDK. `createSes(...).sendEmail()`
calls SES v2 `SendEmail` (HTML and text parts, extra headers such as `List-Unsubscribe`,
configuration sets) and throws `SesError` with SES's code and whether a retry can help.
`handleSns` verifies SNS messages against the signing certificate, fetched only from SNS's
hosts, confirms the subscription, and passes notifications on; `parseSesNotification` reads
bounces, complaints and deliveries. `signAwsRequest` signs any other AWS call with Signature
Version 4 over WebCrypto.
