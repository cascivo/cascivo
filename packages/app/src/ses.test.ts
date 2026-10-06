// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  SesError,
  certificatePublicKey,
  confirmSnsSubscription,
  createSes,
  handleSns,
  parseSesNotification,
  signAwsRequest,
  verifySnsMessage,
} from './ses'
import { SNS_FIXTURES } from './ses.fixtures'

const CREDENTIALS = {
  accessKeyId: 'AKIDEXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
}

describe('signAwsRequest', () => {
  it('reproduces AWS’s published get-vanilla signature', async () => {
    const headers = await signAwsRequest(
      { method: 'GET', url: 'https://example.amazonaws.com/' },
      CREDENTIALS,
      { region: 'us-east-1', service: 'service' },
      new Date('2015-08-30T12:36:00Z'),
    )
    expect(headers).toEqual({
      'x-amz-date': '20150830T123600Z',
      authorization:
        'AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20150830/us-east-1/service/aws4_request, ' +
        'SignedHeaders=host;x-amz-date, ' +
        'Signature=5fa00fa31553b73ebf1942676e86291e8372ff2a2260956d9b8aae1d763fbf31',
    })
  })

  it('matches aws4fetch on a POST with a query, extra headers and a session token', async () => {
    // Expected value computed with aws4fetch 1.x (allHeaders: true) on the same input.
    const headers = await signAwsRequest(
      {
        method: 'POST',
        url: 'https://email.eu-west-1.amazonaws.com/v2/email/outbound-emails?b=2&a=1&a=0&sp=x%20y',
        headers: { 'content-type': 'application/json', 'X-Custom': '  a   b ' },
        body: '{"x":1}',
      },
      { ...CREDENTIALS, sessionToken: 'tok' },
      { region: 'eu-west-1', service: 'ses' },
      new Date('2026-10-01T12:00:00Z'),
    )
    expect(headers['x-amz-security-token']).toBe('tok')
    expect(headers['authorization']).toBe(
      'AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20261001/eu-west-1/ses/aws4_request, ' +
        'SignedHeaders=content-type;host;x-amz-date;x-amz-security-token;x-custom, ' +
        'Signature=75a25f5abc38132e9ef3f45ff516d37396ef10f46e2d2a63e330c88ee87ee1dc',
    )
  })
})

function stubFetch(reply: (url: string) => Response) {
  const calls: { url: string; init: RequestInit }[] = []
  const fetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    calls.push({ url: String(input), init })
    return reply(String(input))
  }) as typeof globalThis.fetch
  return { calls, fetch }
}

describe('createSes', () => {
  const ses = (fetch: typeof globalThis.fetch) =>
    createSes({ region: 'eu-west-1', ...CREDENTIALS, fetch })

  it('sends a signed SES v2 SendEmail with both parts and the unsubscribe headers', async () => {
    const { calls, fetch } = stubFetch(() => Response.json({ MessageId: 'ses-123' }))
    const sent = await ses(fetch).sendEmail({
      from: 'News <news@example.com>',
      to: 'reader@example.org',
      subject: 'Issue 1',
      html: '<p>Hi</p>',
      text: 'Hi',
      headers: {
        'List-Unsubscribe': '<https://app.example/u?token=t>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })
    expect(sent).toEqual({ messageId: 'ses-123' })
    const [call] = calls
    expect(call!.url).toBe('https://email.eu-west-1.amazonaws.com/v2/email/outbound-emails')
    const headers = call!.init.headers as Record<string, string>
    expect(headers['authorization']).toMatch(
      /^AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE\/\d{8}\/eu-west-1\/ses\/aws4_request, SignedHeaders=content-type;host;x-amz-date, Signature=[0-9a-f]{64}$/,
    )
    expect(JSON.parse(String(call!.init.body))).toEqual({
      FromEmailAddress: 'News <news@example.com>',
      Destination: { ToAddresses: ['reader@example.org'] },
      Content: {
        Simple: {
          Subject: { Data: 'Issue 1', Charset: 'UTF-8' },
          Body: {
            Html: { Data: '<p>Hi</p>', Charset: 'UTF-8' },
            Text: { Data: 'Hi', Charset: 'UTF-8' },
          },
          Headers: [
            { Name: 'List-Unsubscribe', Value: '<https://app.example/u?token=t>' },
            { Name: 'List-Unsubscribe-Post', Value: 'List-Unsubscribe=One-Click' },
          ],
        },
      },
    })
  })

  it('refuses a header that would smuggle in another one', async () => {
    const { calls, fetch } = stubFetch(() => Response.json({ MessageId: 'x' }))
    await expect(
      ses(fetch).sendEmail({
        from: 'a@example.com',
        to: 'b@example.org',
        subject: 's',
        text: 't',
        headers: { 'X-Note': 'ok\r\nBcc: victim@example.org' },
      }),
    ).rejects.toThrow(/line break/)
    expect(calls).toHaveLength(0)
  })

  it('throws SES’s error with its code, and says whether a retry can help', async () => {
    const rejected = stubFetch(
      () =>
        new Response(JSON.stringify({ message: 'Email address is not verified.' }), {
          status: 400,
          headers: { 'x-amzn-errortype': 'MessageRejected:http://internal.amazon.com/' },
        }),
    )
    const error = await ses(rejected.fetch)
      .sendEmail({ from: 'a@example.com', to: 'b@example.org', subject: 's', text: 't' })
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(SesError)
    expect(error).toMatchObject({
      status: 400,
      code: 'MessageRejected',
      message: 'Email address is not verified.',
      retryable: false,
    })

    const throttled = stubFetch(
      () =>
        new Response(JSON.stringify({ message: 'Maximum sending rate exceeded.' }), {
          status: 429,
        }),
    )
    await expect(
      ses(throttled.fetch).sendEmail({ from: 'a@x.io', to: 'b@x.io', subject: 's', text: 't' }),
    ).rejects.toMatchObject({ retryable: true })
  })

  it('reads an identity: whether it sends, and its DKIM CNAMEs on the region’s zone', async () => {
    const { calls, fetch } = stubFetch((url) =>
      url.endsWith('/missing.example')
        ? new Response(JSON.stringify({ message: 'Identity does not exist' }), {
            status: 404,
            headers: { 'x-amzn-errortype': 'NotFoundException:' },
          })
        : Response.json({
            VerifiedForSendingStatus: false,
            DkimAttributes: {
              Status: 'PENDING',
              SigningAttributesOrigin: 'AWS_SES',
              SigningHostedZone: 'dkim.af-south-1.amazonses.com',
              Tokens: ['t1', 't2', 't3'],
            },
          }),
    )
    const identity = await ses(fetch).identity('Example.com')
    expect(calls[0]!.url).toBe(
      'https://email.eu-west-1.amazonaws.com/v2/email/identities/Example.com',
    )
    expect(calls[0]!.init.method).toBe('GET')
    expect(identity).toEqual({
      verified: false,
      dkim: {
        status: 'PENDING',
        records: ['t1', 't2', 't3'].map((t) => ({
          type: 'CNAME',
          name: `${t}._domainkey.example.com`,
          value: `${t}.dkim.af-south-1.amazonses.com`,
        })),
      },
    })
    expect(await ses(fetch).identity('missing.example')).toBeNull()
    await expect(ses(fetch).identity('a/b')).rejects.toThrow(/not a domain/)
  })

  it('sends a composed message: names, cc, bcc, reply-to and attachments', async () => {
    const { calls, fetch } = stubFetch(() => Response.json({ MessageId: 'ses-456' }))
    const sent = await ses(fetch).send({
      from: { name: 'Shop "Main"', email: 'shop@example.com' },
      to: ['a@example.org', { name: 'Zoë', email: 'zoe@example.org' }],
      cc: 'c@example.org',
      bcc: [{ name: 'Audit', email: 'audit@example.com' }],
      replyTo: 'help@example.com',
      subject: 'Your receipt — €9.00',
      html: '<p>Thanks</p>',
      text: 'Thanks',
      headers: { 'X-Order': '42' },
      attachments: [
        {
          filename: 'receipt.txt',
          type: 'text/plain',
          content: new TextEncoder().encode('paid'),
          disposition: 'attachment',
        },
        {
          filename: 'a.pdf',
          type: 'application/pdf',
          content: 'JVBERg==',
          disposition: 'attachment',
        },
      ],
    })
    expect(sent).toEqual({ messageId: 'ses-456' })
    expect(JSON.parse(String(calls[0]!.init.body))).toEqual({
      FromEmailAddress: '"Shop \\"Main\\"" <shop@example.com>',
      Destination: {
        ToAddresses: ['a@example.org', '=?UTF-8?B?Wm/Dqw==?= <zoe@example.org>'],
        CcAddresses: ['c@example.org'],
        BccAddresses: ['"Audit" <audit@example.com>'],
      },
      ReplyToAddresses: ['help@example.com'],
      Content: {
        Simple: {
          Subject: { Data: 'Your receipt — €9.00', Charset: 'UTF-8' },
          Body: {
            Html: { Data: '<p>Thanks</p>', Charset: 'UTF-8' },
            Text: { Data: 'Thanks', Charset: 'UTF-8' },
          },
          Headers: [{ Name: 'X-Order', Value: '42' }],
          Attachments: [
            {
              FileName: 'receipt.txt',
              ContentType: 'text/plain',
              ContentDisposition: 'ATTACHMENT',
              ContentTransferEncoding: 'BASE64',
              RawContent: btoa('paid'),
            },
            {
              FileName: 'a.pdf',
              ContentType: 'application/pdf',
              ContentDisposition: 'ATTACHMENT',
              ContentTransferEncoding: 'BASE64',
              RawContent: 'JVBERg==',
            },
          ],
        },
      },
    })
  })

  it('refuses a line break in an address, a name or an attachment name', async () => {
    const { calls, fetch } = stubFetch(() => Response.json({ MessageId: 'x' }))
    const message = {
      from: 'a@example.com',
      to: 'b@example.org',
      subject: 's',
      html: 'h',
      text: 't',
    }
    await expect(
      ses(fetch).send({
        ...message,
        to: { name: 'B\r\nBcc: x@evil.test', email: 'b@example.org' },
      }),
    ).rejects.toThrow(/line break/)
    await expect(
      ses(fetch).send({ ...message, cc: 'c@example.org\nBcc: x@evil.test' }),
    ).rejects.toThrow(/line break/)
    await expect(
      ses(fetch).send({
        ...message,
        attachments: [
          {
            filename: 'a\r\n.pdf',
            type: 'application/pdf',
            content: '',
            disposition: 'attachment',
          },
        ],
      }),
    ).rejects.toThrow(/line break/)
    expect(calls).toHaveLength(0)
  })

  it('fails fast on missing credentials or an empty message', async () => {
    expect(() => createSes({ region: 'eu-west-1', accessKeyId: '', secretAccessKey: 's' })).toThrow(
      /required/,
    )
    const { fetch } = stubFetch(() => Response.json({}))
    await expect(
      ses(fetch).sendEmail({ from: 'a@x.io', to: 'b@x.io', subject: 's' }),
    ).rejects.toThrow(/html, text or both/)
  })
})

const TOPIC = 'arn:aws:sns:eu-west-1:123456789012:ses-feedback'

/** Serves the fixture certificate at its SNS URL and answers confirmation links. */
function snsFetch() {
  return stubFetch((url) =>
    url.endsWith('.pem')
      ? new Response(SNS_FIXTURES.cert)
      : new Response(
          `<ConfirmSubscriptionResponse><ConfirmSubscriptionResult><SubscriptionArn>${TOPIC}:sub-1</SubscriptionArn></ConfirmSubscriptionResult></ConfirmSubscriptionResponse>`,
        ),
  )
}

describe('verifySnsMessage', () => {
  it('reads the public key out of a real X.509 certificate', () => {
    const der = Uint8Array.from(atob(SNS_FIXTURES.cert.replace(/-----[A-Z ]+-----|\s/g, '')), (c) =>
      c.charCodeAt(0),
    )
    const spki = certificatePublicKey(der)
    // SEQUENCE { SEQUENCE { rsaEncryption … } … }
    expect([spki[0], spki[4], spki[6]]).toEqual([0x30, 0x30, 0x06])
  })

  it('accepts notifications signed with version 2 (SHA-256) and 1 (SHA-1, with a subject)', async () => {
    const { fetch } = snsFetch()
    const v2 = await verifySnsMessage(JSON.stringify(SNS_FIXTURES.notificationV2), {
      topicArn: TOPIC,
      fetch,
    })
    expect(v2).toMatchObject({ type: 'Notification', messageId: 'm-1', subject: null })
    const v1 = await verifySnsMessage(JSON.stringify(SNS_FIXTURES.notificationV1WithSubject), {
      topicArn: TOPIC,
      fetch,
    })
    expect(v1).toMatchObject({ messageId: 'm-2', subject: 'Amazon SES Email Event Notification' })
  })

  it('refuses a changed message, another topic, and certificates off SNS’s hosts', async () => {
    const { fetch } = snsFetch()
    const verify = (message: object) =>
      verifySnsMessage(JSON.stringify(message), { topicArn: TOPIC, fetch })
    const original = SNS_FIXTURES.notificationV2
    await expect(
      verify({ ...original, Message: '{"notificationType":"Delivery"}' }),
    ).rejects.toThrow(/bad signature/)
    await expect(verify({ ...original, TopicArn: `${TOPIC}-other` })).rejects.toThrow(
      /another topic/,
    )
    for (const url of [
      'https://evil.example/SimpleNotificationService.pem',
      'https://sns.eu-west-1.amazonaws.com.evil.example/x.pem',
      'http://sns.eu-west-1.amazonaws.com/x.pem',
    ]) {
      await expect(verify({ ...original, SigningCertURL: url })).rejects.toMatchObject({
        status: 401,
      })
    }
    await expect(verify({ ...original, SignatureVersion: '3' })).rejects.toThrow(/SignatureVersion/)
  })

  it('accepts a list of topics or a test, and refuses an empty list', async () => {
    const { fetch } = snsFetch()
    const body = JSON.stringify(SNS_FIXTURES.notificationV2)
    await expect(
      verifySnsMessage(body, { topicArn: [`${TOPIC}-a`, TOPIC], fetch }),
    ).resolves.toMatchObject({ messageId: 'm-1' })
    await expect(
      verifySnsMessage(body, { topicArn: (arn) => arn.endsWith(':ses-feedback'), fetch }),
    ).resolves.toMatchObject({ messageId: 'm-1' })
    await expect(verifySnsMessage(body, { topicArn: [`${TOPIC}-a`], fetch })).rejects.toThrow(
      /another topic/,
    )
    await expect(verifySnsMessage(body, { topicArn: [], fetch })).rejects.toThrow(/no topicArn/)
  })
})

describe('confirmSnsSubscription', () => {
  it('confirms on the topic’s own regional host, built from the ARN and token', async () => {
    const { calls, fetch } = snsFetch()
    expect(await confirmSnsSubscription({ topicArn: TOPIC, token: 'tok-123', fetch })).toEqual({
      subscriptionArn: `${TOPIC}:sub-1`,
    })
    const url = new URL(calls[0]!.url)
    expect(url.host).toBe('sns.eu-west-1.amazonaws.com')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      Action: 'ConfirmSubscription',
      TopicArn: TOPIC,
      Token: 'tok-123',
    })
    const china = stubFetch(
      () => new Response(`<SubscriptionArn>arn:aws-cn:sns:x</SubscriptionArn>`),
    )
    await confirmSnsSubscription({
      topicArn: 'arn:aws-cn:sns:cn-north-1:123456789012:t',
      token: 't',
      fetch: china.fetch,
    })
    expect(new URL(china.calls[0]!.url).host).toBe('sns.cn-north-1.amazonaws.com.cn')
  })

  it('refuses a malformed ARN, and says why SNS would not confirm', async () => {
    const { fetch } = snsFetch()
    for (const topicArn of ['arn:aws:sns:eu-west-1.evil.example:123456789012:t', 'nope']) {
      await expect(confirmSnsSubscription({ topicArn, token: 't', fetch })).rejects.toThrow(
        /not an SNS topic ARN/,
      )
    }
    const expired = stubFetch(
      () =>
        new Response(
          '<ErrorResponse><Error><Message>Invalid token</Message></Error></ErrorResponse>',
          {
            status: 400,
          },
        ),
    )
    await expect(
      confirmSnsSubscription({ topicArn: TOPIC, token: 't', fetch: expired.fetch }),
    ).rejects.toThrow(/Invalid token/)
    const pending = stubFetch(
      () => new Response('<SubscriptionArn>pending confirmation</SubscriptionArn>'),
    )
    await expect(
      confirmSnsSubscription({ topicArn: TOPIC, token: 't', fetch: pending.fetch }),
    ).rejects.toThrow(/pending confirmation/)
  })
})

describe('handleSns', () => {
  const post = (message: object) =>
    new Request('https://app.example/api/sns', { method: 'POST', body: JSON.stringify(message) })

  it('hands a subscription request to onSubscription, and confirms nothing itself', async () => {
    const { calls, fetch } = snsFetch()
    const subscriptions: string[] = []
    const response = await handleSns(post(SNS_FIXTURES.subscription), {
      topicArn: TOPIC,
      fetch,
      onNotification: async () => {
        throw new Error('not a notification')
      },
      onSubscription: async (s) => {
        subscriptions.push(`${s.topicArn} ${s.token}`)
      },
    })
    expect(response.status).toBe(200)
    expect(subscriptions).toEqual([`${TOPIC} tok-123`])
    expect(calls.filter((c) => !c.url.endsWith('.pem'))).toEqual([])
  })

  it('with confirmSubscriptions, confirms from the verified topic and token, not SubscribeURL', async () => {
    const { calls, fetch } = snsFetch()
    const response = await handleSns(post({ ...SNS_FIXTURES.subscription }), {
      topicArn: TOPIC,
      fetch,
      confirmSubscriptions: true,
      onNotification: async () => {},
    })
    expect(await response.json()).toEqual({ confirmed: true })
    const confirmation = calls.find((c) => !c.url.endsWith('.pem'))!
    expect(new URL(confirmation.url).searchParams.get('Token')).toBe('tok-123')
    expect(confirmation.init.redirect).toBe('manual')
  })

  it('passes a verified notification on, and answers 401 for a forged one', async () => {
    const { fetch } = snsFetch()
    const seen: string[] = []
    const options = {
      topicArn: TOPIC,
      fetch,
      onNotification: async (n: { message: string }) => {
        seen.push(n.message)
      },
    }
    expect((await handleSns(post(SNS_FIXTURES.notificationV2), options)).status).toBe(200)
    const forged = { ...SNS_FIXTURES.notificationV2, MessageId: 'm-forged' }
    expect((await handleSns(post(forged), options)).status).toBe(401)
    expect(seen).toEqual([SNS_FIXTURES.notificationV2.Message])
  })
})

describe('parseSesNotification', () => {
  it('reads bounces, complaints and deliveries, in both SES formats', () => {
    expect(parseSesNotification(SNS_FIXTURES.notificationV2.Message)).toEqual({
      kind: 'bounce',
      bounceType: 'Permanent',
      subType: null,
      diagnostic: null,
      recipients: ['gone@example.org'],
      messageId: 'ses-1',
      at: null,
    })
    expect(
      parseSesNotification(
        JSON.stringify({
          eventType: 'Complaint',
          complaint: { complainedRecipients: [{ emailAddress: 'angry@example.org' }, {}] },
        }),
      ),
    ).toEqual({ kind: 'complaint', recipients: ['angry@example.org'], messageId: null, at: null })
    expect(
      parseSesNotification(
        JSON.stringify({ notificationType: 'Delivery', delivery: { recipients: ['ok@x.io'] } }),
      ),
    ).toMatchObject({ kind: 'delivery', recipients: ['ok@x.io'] })
    expect(parseSesNotification(JSON.stringify({ eventType: 'Open' }))).toEqual({
      kind: 'other',
      type: 'Open',
      at: null,
    })
  })

  it('keeps when it happened, and why a bounce bounced', () => {
    const bounce = parseSesNotification(
      JSON.stringify({
        notificationType: 'Bounce',
        mail: { messageId: 'ses-1', timestamp: '2026-10-01T11:59:00.000Z' },
        bounce: {
          bounceType: 'Permanent',
          bounceSubType: 'OnAccountSuppressionList',
          timestamp: '2026-10-01T12:00:00.000Z',
          bouncedRecipients: [
            { emailAddress: 'gone@example.org', diagnosticCode: 'smtp; 550 5.1.1 user unknown' },
          ],
        },
      }),
    )
    expect(bounce).toMatchObject({
      subType: 'OnAccountSuppressionList',
      diagnostic: 'smtp; 550 5.1.1 user unknown',
      at: Date.parse('2026-10-01T12:00:00.000Z'),
    })
    // Without the event's own time, the message's.
    expect(
      parseSesNotification(
        JSON.stringify({
          eventType: 'DeliveryDelay',
          mail: { timestamp: '2026-10-01T11:59:00.000Z' },
          deliveryDelay: { timestamp: 'not a date' },
        }),
      ),
    ).toEqual({ kind: 'other', type: 'DeliveryDelay', at: Date.parse('2026-10-01T11:59:00.000Z') })
  })

  it('refuses what is not an SES notification', () => {
    expect(() => parseSesNotification('nope')).toThrow(/JSON/)
    expect(() => parseSesNotification('{}')).toThrow(/type/)
  })
})
