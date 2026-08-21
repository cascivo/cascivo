/**
 * One accessible-name spelling that always works.
 *
 * The catalog split three ways — `ariaLabel` only, invisible `label` only, or both — and an
 * adopter paid a compile cycle on `<OverflowMenu label=…>` (2026-08-21 report item 1).
 * `scripts/checks/aria-label-universality.test.ts` asserts the *shape* across the whole
 * registry; this asserts the *behaviour* on the components the report actually named, because
 * a prop that type-checks and reaches nothing is the same defect wearing a passing guard.
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Breadcrumb } from './breadcrumb/breadcrumb'
import { CommandMenu } from './command-menu/command-menu'
import { DataTable } from './data-table/data-table'
import { OverflowMenu } from './overflow-menu/overflow-menu'
import { SideNav } from './side-nav/side-nav'
import { Steps } from './steps/steps'
import { Switcher } from './switcher/switcher'

describe('`label` is accepted where the catalog spells it `ariaLabel`', () => {
  it('OverflowMenu — the prop the report tripped over', () => {
    render(<OverflowMenu items={[{ label: 'Edit', value: 'edit' }]} label="Row actions" />)
    expect(screen.getByRole('button', { name: 'Row actions' })).toBeInTheDocument()
  })

  it('SideNav', () => {
    render(<SideNav items={[{ label: 'Projects', href: '/p' }]} label="Primary" />)
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
  })

  it('Breadcrumb', () => {
    render(<Breadcrumb items={[{ label: 'Home', href: '/' }]} label="You are here" />)
    expect(screen.getByRole('navigation', { name: 'You are here' })).toBeInTheDocument()
  })

  it('Steps', () => {
    render(<Steps steps={[{ label: 'Queued' }]} label="Build pipeline" />)
    expect(screen.getByRole('list', { name: 'Build pipeline' })).toBeInTheDocument()
  })

  it('`ariaLabel` still wins when both are passed', () => {
    render(
      <OverflowMenu items={[{ label: 'Edit', value: 'edit' }]} label="ignored" ariaLabel="wins" />,
    )
    expect(screen.getByRole('button', { name: 'wins' })).toBeInTheDocument()
  })
})

describe('`ariaLabel` is accepted where the component shipped an invisible `label`', () => {
  it('Switcher', () => {
    render(<Switcher items={[{ label: 'Acme Inc', href: '/acme' }]} ariaLabel="Team" />)
    expect(screen.getByRole('list', { name: 'Team' })).toBeInTheDocument()
  })

  it('CommandMenu', () => {
    // Asserted on the attribute rather than by role: jsdom treats a <dialog> that
    // `showModal()` has not opened as hidden, so its whole subtree is out of the a11y tree
    // here. `no-js:check` drives the real dialog in Chromium.
    const { container } = render(<CommandMenu open groups={[]} ariaLabel="Jump to" />)
    expect(container.querySelector('dialog')).toHaveAttribute('aria-label', 'Jump to')
  })
})

describe('DataTable can be named without a visible caption', () => {
  const columns = [{ key: 'name', header: 'Name' }]
  const rows = [{ id: '1', name: 'edge-api' }]

  it('`ariaLabel` names the table', () => {
    render(<DataTable columns={columns} rows={rows} ariaLabel="Deployments" />)
    expect(screen.getByRole('table', { name: 'Deployments' })).toBeInTheDocument()
  })

  it('a visible `title` still wins, so the caption is never duplicated', () => {
    render(
      <DataTable columns={columns} rows={rows} title="Deployments" ariaLabel="never announced" />,
    )
    expect(screen.getByRole('table', { name: 'Deployments' })).toBeInTheDocument()
  })

  it('warns in dev when the table has no name at all', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<DataTable columns={[{ key: 'unnamed-probe', header: 'X' }]} rows={[]} />)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no accessible name'))
    warn.mockRestore()
  })
})
