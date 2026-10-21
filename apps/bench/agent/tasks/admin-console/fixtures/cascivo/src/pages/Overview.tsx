import { Flex, Grid, Heading, Stat } from '@cascivo/react'

const KPIS = [
  { label: 'Total users', value: '1,284', delta: '+4.2%', trend: 'up' },
  { label: 'Active today', value: '312', delta: '+1.1%', trend: 'up' },
  { label: 'Monthly revenue', value: '$48.2k', delta: '-0.8%', trend: 'down' },
] as const

export function Overview() {
  return (
    <Flex gap={6}>
      <Heading level={1}>Overview</Heading>
      <Grid cols={{ base: 1, md: 3 }} gap={4}>
        {KPIS.map((kpi) => (
          <Stat key={kpi.label} card {...kpi} />
        ))}
      </Grid>
    </Flex>
  )
}
