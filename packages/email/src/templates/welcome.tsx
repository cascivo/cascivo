/**
 * Welcome email.
 *
 * Templates are ordinary compositions of the primitives — they get no special powers, which
 * is deliberate: anything a template needs that the primitives cannot express is a gap in
 * the primitive set, and should be fixed there rather than worked around here.
 */
import { Body, Head, Html, Preview } from '../components/document.tsx'
import { Container, Hr, Section, Spacer } from '../components/layout.tsx'
import { Footer, Heading, Link, List, Text } from '../components/typography.tsx'
import { Button, Card } from '../components/content.tsx'

export interface WelcomeProps {
  productName?: string
  userName?: string
  ctaHref?: string
  supportHref?: string
}

export function Welcome({
  productName = 'Acme',
  userName = 'there',
  ctaHref = 'https://example.com/start',
  supportHref = 'https://example.com/help',
}: WelcomeProps) {
  return (
    <Html>
      <Head title={`Welcome to ${productName}`} />
      <Body>
        <Preview>{`Welcome to ${productName} — here is how to get started`}</Preview>
        <Container>
          <Section padding={32}>
            <Heading level={1}>{`Welcome to ${productName}`}</Heading>
            <Spacer height={16} />
            <Text>{`Hi ${userName}, your account is ready. Here is what to do first.`}</Text>
            <Spacer height={24} />
            <Card>
              <List
                items={[
                  'Finish setting up your profile',
                  'Invite a teammate',
                  'Connect your first integration',
                ]}
              />
            </Card>
            <Spacer height={24} />
            <Button href={ctaHref}>Open {productName}</Button>
            <Hr spacing={24} />
            <Text variant="muted" size="14px">
              Stuck? <Link href={supportHref}>We are happy to help.</Link>
            </Text>
          </Section>
          <Footer>{`Sent by ${productName}`}</Footer>
        </Container>
      </Body>
    </Html>
  )
}
