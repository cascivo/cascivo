/**
 * Receipt email.
 *
 * The line items are a `Row` per line rather than one multi-row table. Two columns of
 * varying content in a single table is where Outlook's column widths drift, and a table
 * per line costs a few bytes and removes the whole failure mode.
 */
import { Body, Head, Html, Preview } from '../components/document.tsx'
import { Column, Container, Hr, Row, Section, Spacer } from '../components/layout.tsx'
import { Footer, Heading, Link, Text } from '../components/typography.tsx'
import { Badge, Card } from '../components/content.tsx'

export interface ReceiptLine {
  description: string
  amount: string
}

export interface ReceiptProps {
  productName?: string
  orderId?: string
  items?: ReceiptLine[]
  total?: string
  invoiceHref?: string
}

export function Receipt({
  productName = 'Acme',
  orderId = 'INV-2043',
  items = [
    { description: 'Pro plan — monthly', amount: '$24.00' },
    { description: 'Additional seats × 3', amount: '$36.00' },
  ],
  total = '$60.00',
  invoiceHref = 'https://example.com/invoice',
}: ReceiptProps) {
  return (
    <Html>
      <Head title={`Receipt ${orderId}`} />
      <Body>
        <Preview>{`Your ${productName} receipt — ${total}`}</Preview>
        <Container>
          <Section padding={32}>
            <Heading level={1}>Thanks for your payment</Heading>
            <Spacer height={8} />
            <Row>
              <Column width="60%">
                <Text variant="muted" size="14px">
                  {`Order ${orderId}`}
                </Text>
              </Column>
              <Column width="40%" align="right">
                <Badge tone="success">Paid</Badge>
              </Column>
            </Row>
            <Spacer height={24} />
            <Card padding={0}>
              <Section padding={20}>
                {items.map((item) => (
                  <Row key={item.description}>
                    <Column width="70%">
                      <Text size="14px" style={{ padding: '4px 0' }}>
                        {item.description}
                      </Text>
                    </Column>
                    <Column width="30%" align="right">
                      <Text size="14px" style={{ padding: '4px 0' }}>
                        {item.amount}
                      </Text>
                    </Column>
                  </Row>
                ))}
                <Hr spacing={12} />
                <Row>
                  <Column width="70%">
                    <Text style={{ fontWeight: 600 }}>Total</Text>
                  </Column>
                  <Column width="30%" align="right">
                    <Text style={{ fontWeight: 600 }}>{total}</Text>
                  </Column>
                </Row>
              </Section>
            </Card>
            <Spacer height={24} />
            <Text variant="muted" size="14px">
              <Link href={invoiceHref}>Download the full invoice</Link>
            </Text>
          </Section>
          <Footer>{`Sent by ${productName}`}</Footer>
        </Container>
      </Body>
    </Html>
  )
}
