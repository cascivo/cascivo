/** Mock data for the dashboard template. Replace with your real source. */
export const dashboardFixtures = {
  kpis: [
    { label: 'Revenue', value: '$48.2k', delta: '+12.4%', trend: 'up' as const },
    { label: 'Active users', value: '3,210', delta: '+4.1%', trend: 'up' as const },
    { label: 'Churn', value: '1.8%', delta: '-0.3%', trend: 'down' as const },
  ],
  activity: [
    { id: '1', when: '2m ago', user: 'ada', action: 'Upgraded to Pro' },
    { id: '2', when: '1h ago', user: 'lin', action: 'Invited 3 teammates' },
    { id: '3', when: '3h ago', user: 'sam', action: 'Created a project' },
  ],
}
