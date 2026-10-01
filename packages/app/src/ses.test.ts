// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  SesError,
  certificatePublicKey,
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
    url.endsWith('.pem') ? new Response(SNS_FIXTURES.cert) : new Response('<ok/>'),
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
})

describe('handleSns', () => {
  const post = (message: object) =>
    new Request('https://app.example/api/sns', { method: 'POST', body: JSON.stringify(message) })

  it('confirms a subscription by fetching its SubscribeURL', async () => {
    const { calls, fetch } = snsFetch()
    const seen: string[] = []
    const response = await handleSns(post(SNS_FIXTURES.subscription), {
      topicArn: TOPIC,
      fetch,
      onNotification: async (n) => {
        seen.push(n.messageId)
      },
    })
    expect(response.status).toBe(200)
    expect(calls.map((c) => c.url)).toContain(SNS_FIXTURES.subscription.SubscribeURL)
    expect(seen).toEqual([])
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
      recipients: ['gone@example.org'],
      messageId: 'ses-1',
    })
    expect(
      parseSesNotification(
        JSON.stringify({
          eventType: 'Complaint',
          complaint: { complainedRecipients: [{ emailAddress: 'angry@example.org' }, {}] },
        }),
      ),
    ).toEqual({ kind: 'complaint', recipients: ['angry@example.org'], messageId: null })
    expect(
      parseSesNotification(
        JSON.stringify({ notificationType: 'Delivery', delivery: { recipients: ['ok@x.io'] } }),
      ),
    ).toMatchObject({ kind: 'delivery', recipients: ['ok@x.io'] })
    expect(parseSesNotification(JSON.stringify({ eventType: 'Open' }))).toEqual({
      kind: 'other',
      type: 'Open',
    })
  })

  it('refuses what is not an SES notification', () => {
    expect(() => parseSesNotification('nope')).toThrow(/JSON/)
    expect(() => parseSesNotification('{}')).toThrow(/type/)
  })
})
