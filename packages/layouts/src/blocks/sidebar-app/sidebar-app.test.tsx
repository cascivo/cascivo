import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SidebarApp } from './sidebar-app'

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('SidebarApp', () => {
  it('renders without crashing', () => {
    render(<SidebarApp />)
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })
})
