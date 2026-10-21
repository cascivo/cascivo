import { Flex, Grid, Heading, Stat } from '@cascivo/react'

const KPIS = [{ label: 'Total users' }, { label: 'Active today' }, { label: 'Monthly revenue' }]

export function Overview() {
  return (
    <Flex gap={6}>
      <Heading level={1}>Overview</Heading>
      <Grid cols={{ base: 1, md: 3 }} gap={4}>
        {KPIS.map((kpi) => (
          <Stat key={kpi.label} card label={kpi.label} value="—" />
        ))}
      </Grid>
    </Flex>
  )
}
