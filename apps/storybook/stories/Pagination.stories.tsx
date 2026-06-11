import type { Meta, StoryObj } from '@storybook/react-vite'
import { Pagination } from '@cascade-ui/components/pagination'

const meta: Meta<typeof Pagination> = {
  title: 'Navigation/Pagination',
  component: Pagination,
  parameters: { layout: 'fullscreen' },
  args: {
    page: 1,
    pageSize: 25,
    totalItems: 103,
    onPageChange: () => {},
  },
}
export default meta
type Story = StoryObj<typeof Pagination>

export const Default: Story = {}

export const WithPageSizeSelect: Story = {
  args: { onPageSizeChange: () => {} },
}

export const MiddlePage: Story = {
  args: { page: 3 },
}

export const LastPage: Story = {
  args: { page: 5 },
}

export const SinglePage: Story = {
  args: { totalItems: 8, pageSize: 10 },
}

export const Empty: Story = {
  args: { totalItems: 0 },
}

export const CustomLabels: Story = {
  args: {
    onPageSizeChange: () => {},
    labels: {
      itemsPerPage: 'Rows per page',
      pageOf: (page: number, total: number) => `Page ${page} / ${total}`,
      range: (start: number, end: number, total: number) => `Showing ${start}–${end} of ${total}`,
      previous: 'Back',
      next: 'Forward',
    },
  },
}

export const Accessibility: Story = {
  args: { page: 2, onPageSizeChange: () => {} },
  parameters: {
    a11y: { test: 'error' },
  },
}
