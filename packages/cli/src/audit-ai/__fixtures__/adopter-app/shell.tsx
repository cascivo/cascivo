// A realistic router-based dashboard shell, written exactly as the published docs teach.
// `cascivo audit --ai` must report ZERO errors on this file.
import { AppShell, ShellHeader, SideNav, setLinkComponent } from '@cascivo/react'
import type { LinkComponentProps } from '@cascivo/react'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

setLinkComponent(({ href, ...rest }: LinkComponentProps) => <Link to={href ?? '.'} {...rest} />)

const GROUPS = [
  { label: 'Main', items: [{ href: '/', label: 'Overview' }] },
  { label: 'Build', items: [{ href: '/deployments', label: 'Deployments' }] },
]

export function Shell({ children }: { children: ReactNode }) {
  return (
    <AppShell
      header={<ShellHeader title="Console" />}
      nav={<SideNav groups={GROUPS} ariaLabel="Main navigation" />}
    >
      {children}
    </AppShell>
  )
}
