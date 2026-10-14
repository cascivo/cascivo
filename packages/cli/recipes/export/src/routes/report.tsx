import { exportUrl, isExporting } from '@cascivo/app/export'
import type { Column } from '@cascivo/react'
import { Badge, Button, Card, CardContent, DataTable, Flex, Heading, Text } from '@cascivo/react'

interface Month {
  month: string
  revenue: number
  customers: number
  change: number
}

const ROWS: Month[] = [
  { month: 'July', revenue: 48_200, customers: 312, change: 4.1 },
  { month: 'August', revenue: 51_900, customers: 334, change: 7.7 },
  { month: 'September', revenue: 50_300, customers: 341, change: -3.1 },
]

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

const COLUMNS: Column<Month>[] = [
  { key: 'month', header: 'Month' },
  { key: 'revenue', header: 'Revenue', align: 'end', render: (row) => money.format(row.revenue) },
  { key: 'customers', header: 'Customers', align: 'end' },
  {
    key: 'change',
    header: 'Change',
    align: 'end',
    render: (row) => (
      <Badge variant={row.change >= 0 ? 'success' : 'warning'}>
        {row.change >= 0 ? '+' : ''}
        {row.change}%
      </Badge>
    ),
  },
]

/**
 * A page worth exporting. The buttons download it as a file, rendered by the Worker in
 * Cloudflare's Browser Run; inside that browser (`isExporting()`) they are left out, and
 * App.tsx drops the shell, so the file holds the report and nothing else.
 */
export default function Report() {
  return (
    <Flex gap={4}>
      <Flex direction="horizontal" align="center" justify="between" wrap gap={3}>
        <Flex gap={1}>
          <Heading level={1}>Quarterly report</Heading>
          <Text muted>Q3 revenue and customers, by month.</Text>
        </Flex>
        {isExporting() ? null : (
          <Flex direction="horizontal" gap={2}>
            <Button asChild variant="secondary">
              <a href={exportUrl('/report', 'png')}>Download PNG</a>
            </Button>
            <Button asChild>
              <a href={exportUrl('/report', 'pdf')}>Download PDF</a>
            </Button>
          </Flex>
        )}
      </Flex>
      <Card>
        <CardContent>
          <DataTable columns={COLUMNS} rows={ROWS} getRowId={(row) => row.month} />
        </CardContent>
      </Card>
    </Flex>
  )
}
