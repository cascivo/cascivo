/** Password reset email. */
import { Body, Head, Html, Preview } from '../components/document.tsx'
import { Container, Section, Spacer } from '../components/layout.tsx'
import { Footer, Heading, Link, Text } from '../components/typography.tsx'
import { Alert, Button } from '../components/content.tsx'

export interface PasswordResetProps {
  productName?: string
  resetHref?: string
  expiresInMinutes?: number
  requestedFrom?: string
}

export function PasswordReset({
  productName = 'Acme',
  resetHref = 'https://example.com/reset',
  expiresInMinutes = 30,
  requestedFrom = 'Berlin, DE',
}: PasswordResetProps) {
  return (
    <Html>
      <Head title="Reset your password" />
      <Body>
        <Preview>{`Reset your password — the link expires in ${expiresInMinutes} minutes`}</Preview>
        <Container>
          <Section padding={32}>
            <Heading level={1}>Reset your password</Heading>
            <Spacer height={16} />
            <Text>
              Someone asked to reset the password for your {productName} account. If that was you,
              use the button below.
            </Text>
            <Spacer height={24} />
            <Button href={resetHref}>Choose a new password</Button>
            <Spacer height={24} />
            <Alert tone="warning" title={`This link expires in ${expiresInMinutes} minutes`}>
              <Text style={{ margin: 0 }}>
                If it has expired, request a new one from the sign-in page.
              </Text>
            </Alert>
            <Spacer height={24} />
            <Text variant="muted" size="14px">
              {`Requested from ${requestedFrom}. If this was not you, you can ignore this email — `}
              <Link href={resetHref}>or secure your account</Link>.
            </Text>
          </Section>
          <Footer>{`Sent by ${productName}`}</Footer>
        </Container>
      </Body>
    </Html>
  )
}
