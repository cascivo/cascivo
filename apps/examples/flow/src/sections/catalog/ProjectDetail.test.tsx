import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectDetail } from './ProjectDetail'
import { CATALOG_ASSETS, PROJECT_DETAILS } from '../../data/catalog'

const asset = CATALOG_ASSETS[0]!
const detail = PROJECT_DETAILS[0]!

it('renders the asset name as page title', () => {
  render(<ProjectDetail asset={asset} detail={detail} onBack={() => {}} />)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(asset.name)
})

it('renders the back breadcrumb link', () => {
  render(<ProjectDetail asset={asset} detail={detail} onBack={() => {}} />)
  expect(screen.getByText(/projects/i)).toBeInTheDocument()
})

it('calls onBack when breadcrumb is clicked', async () => {
  const onBack = vi.fn()
  render(<ProjectDetail asset={asset} detail={detail} onBack={onBack} />)
  await userEvent.click(screen.getByRole('link', { name: /projects/i }))
  expect(onBack).toHaveBeenCalledOnce()
})

it('renders file list', () => {
  render(<ProjectDetail asset={asset} detail={detail} onBack={() => {}} />)
  expect(screen.getByText(detail.files[0]!.name)).toBeInTheDocument()
})

it('renders right sidebar deployment card', () => {
  render(<ProjectDetail asset={asset} detail={detail} onBack={() => {}} />)
  expect(screen.getByText(/latest deployment/i)).toBeInTheDocument()
})
