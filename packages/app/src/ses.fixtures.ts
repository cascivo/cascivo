// A throwaway self-signed certificate (its key was discarded) and SNS messages signed with it
// by a script outside this repo, following AWS's documented field order rather than ses.ts.
export const SNS_FIXTURES = {
  cert: '-----BEGIN CERTIFICATE-----\nMIIDGzCCAgOgAwIBAgIUZ1buyooziti5KgioP5dv95YsFuMwDQYJKoZIhvcNAQEL\nBQAwHDEaMBgGA1UEAwwRc25zLmFtYXpvbmF3cy5jb20wIBcNMjYxMDAxMTYyMDEx\nWhgPMjEyNjA5MDcxNjIwMTFaMBwxGjAYBgNVBAMMEXNucy5hbWF6b25hd3MuY29t\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvOFKBiaJv7nugz2LMtci\nKPai/j+JqiVLjDPsFT3MC3JvS0Em6ytn3xITAzMsN4kQgNmwBWYEntCrW+6XzlBD\nAM8hm/faHEvZ8egKxQH4nVjTecSLXxHZ7twuXXDA2Y6EJJC1PtNVkRlYoUeNHZVM\nKVvRT1n+eDOYu4FchXamlM4Y2K78t8QVuLfvgcLx4gwYc/NzIp431YIgGvDpN+W7\nnv91SyBN/qhDbCflITmQTwAhrjWNIXzFweSDy63Th3HPcoOA6sFX0MoNoHyA6DS4\nw6uBbujGcAW3DVUkscLVduNEcfyOS3JiymP2Wl/pg77tlF55OvkG1R3ybnntC8Js\nLwIDAQABo1MwUTAdBgNVHQ4EFgQUXPYPM2+TebSXYAeBUmqGFXHHTYswHwYDVR0j\nBBgwFoAUXPYPM2+TebSXYAeBUmqGFXHHTYswDwYDVR0TAQH/BAUwAwEB/zANBgkq\nhkiG9w0BAQsFAAOCAQEAKw3k1971KuQB/T/JXQ83Vp9Y0qq8IVFyoXPKPqiuqTiT\nBeWUHQ76MmumvyvzmfFC+751THEtID10xBtYkz9DuH0FiD7EQpuEWt+sHJfxmMhu\ncHxkvyJG4Z1LaWuZMshHv3zJLtNDoRu10pC/P2sRWYRtsXIkk6YkO339+3dsqmkb\n5qLbkqsheRMiAXUYLUHYnkIaJ35/HJ3DB23G0w1wXh7AkQgd8hkMrNkLppmdIEqA\ntkaUvGJBeXmBIDUj5amRtX3A4Eq4BOQFgTgT02e8xXNLK+iFu+cUST8mqgQsvh4+\nhP3l0xqC7cQ3TTvOq4l4WCdz4gOQuXdIgKRnnoFw7A==\n-----END CERTIFICATE-----\n',
  notificationV2: {
    Type: 'Notification',
    MessageId: 'm-1',
    TopicArn: 'arn:aws:sns:eu-west-1:123456789012:ses-feedback',
    Message:
      '{"notificationType":"Bounce","bounce":{"bounceType":"Permanent","bouncedRecipients":[{"emailAddress":"gone@example.org"}]},"mail":{"messageId":"ses-1"}}',
    Timestamp: '2026-10-01T12:00:00.000Z',
    SignatureVersion: '2',
    Signature:
      'sFkLM12BxKrobwrZdIMqhtuQSWfk6LsL8R89g8jNo/rSVWlEZVf5qiALjyFMMGExM07lu8DhEBKJVfjH/78y0cQ+Eo4jPKQhcqNWhAPuLRizi9ULO526ZmwdhNgDlpceho4IDJT+gIrAOK3YCkf6uTh4QPISrwKhzX12pb4Tj1HI0jaD7ueO7UOO0SBh2ATufg+W9C6e2ALdOva1gekBxLK1Vw9XM0u8D8PDjhn8feXNI+PJSeptIAZ3TiMUp9v6dT0hK9ejQwf2rTbks34ktbTgH+zPED3OKAAncOhgm/2m97YZzELI7Thgl+W9s7BaxD+eI+rL+xIdR7NE137ZEw==',
    SigningCertURL: 'https://sns.eu-west-1.amazonaws.com/SimpleNotificationService-test.pem',
  },
  notificationV1WithSubject: {
    Type: 'Notification',
    MessageId: 'm-2',
    TopicArn: 'arn:aws:sns:eu-west-1:123456789012:ses-feedback',
    Subject: 'Amazon SES Email Event Notification',
    Message:
      '{"notificationType":"Bounce","bounce":{"bounceType":"Permanent","bouncedRecipients":[{"emailAddress":"gone@example.org"}]},"mail":{"messageId":"ses-1"}}',
    Timestamp: '2026-10-01T12:00:01.000Z',
    SignatureVersion: '1',
    Signature:
      'KoiLJdwzr6TPS82H7ArIaf+/aSkfzehmgNuRgeS9FgzsCgXrU3TUkBq7qtpU205fjxaea9iVzGjNG2+OKRI/cxrkT+ih3bNK2uF5vtNZI0ukFWZPoRd4dv69VN/YSI1FR510f69IElZLburmqN5MQFVdKp/26+BKPQYEVplSvrjkFrlv0ap1rQla5pQIosYoQJLyyUZGvGahgyGJD/jcOsZbkwWxc0V9s+dqR00Iz9TQtS9/UmYCqmTuM7KGklR2SeIRmP6Plc9QhkZTrrPpaYqiwzfqgPH8tM2Abubl6OYlrF0RUymfDrTHKDybEsMGXnacyjaF6EGAlvNX/LVf/Q==',
    SigningCertURL: 'https://sns.eu-west-1.amazonaws.com/SimpleNotificationService-test.pem',
  },
  subscription: {
    Type: 'SubscriptionConfirmation',
    MessageId: 'm-3',
    TopicArn: 'arn:aws:sns:eu-west-1:123456789012:ses-feedback',
    Token: 'tok-123',
    Message: 'You have chosen to subscribe to the topic.',
    SubscribeURL:
      'https://sns.eu-west-1.amazonaws.com/?Action=ConfirmSubscription&TopicArn=arn:aws:sns:eu-west-1:123456789012:ses-feedback&Token=tok-123',
    Timestamp: '2026-10-01T12:00:02.000Z',
    SignatureVersion: '2',
    Signature:
      'slOtl+utCsOA0VmZRRTWx1RzqdlOErfg0K3aL5lOlewuAldV9yyOiQFdUIoDwArXFFxHRp8eYeKioTIfEaK318NpL41w2pr/CKUnyNNNzLsT90m682QNEARMl66eUYJQ3FzUKwQilegh6XWmIX5iJaphjZyfHEAIj/UB/C6kPxw2mkGa8vof+PM/sdOviWscKmmgU1KRkmJnTZxs9wExsHRRFoFwxLflFQ85tR+f12BxpcAITigT48G0d3jJzZmM9Eq3Lpbb7M12t7/biVmxjX05Z9UZnlJ9Gf/CSzZwIvu3f+aLU4uaFWNJoQEDr7ci27NvRPmO1ya7YMfakgUsBQ==',
    SigningCertURL: 'https://sns.eu-west-1.amazonaws.com/SimpleNotificationService-test.pem',
  },
} as const
