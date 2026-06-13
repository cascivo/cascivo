'use client'
import { Breadcrumb } from '@cascivo/react'
import { Center } from '../../center/center'
import { PageHeader } from '../../page-header/page-header'

export function PageWithBreadcrumb() {
  return (
    <Center maxWidth="64rem">
      <PageHeader
        title="Settings"
        description="Manage your account preferences."
        breadcrumb={
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Settings', href: '/settings' },
            ]}
          />
        }
      />
      <div style={{ padding: '2rem 0' }}>
        <p>Page content goes here.</p>
      </div>
    </Center>
  )
}
