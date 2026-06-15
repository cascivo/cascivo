import { render, screen } from '@testing-library/react'
import { TemplateGallery } from './TemplateGallery'

it('renders deploy-first-project heading', () => {
  render(<TemplateGallery />)
  expect(screen.getByText(/deploy your first project/i)).toBeInTheDocument()
})

it('renders at least four template rows', () => {
  render(<TemplateGallery />)
  const buttons = screen.getAllByRole('button')
  expect(buttons.length).toBeGreaterThanOrEqual(4)
})

it('renders Browse Templates link', () => {
  render(<TemplateGallery />)
  expect(screen.getByText(/browse templates/i)).toBeInTheDocument()
})
