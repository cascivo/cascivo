// Server component (no 'use client'). Global CSS from node_modules must be
// imported here, in the root layout — Next.js App Router only allows global
// stylesheets in layout/page modules, not in client components.
import '@cascivo/react/styles.css' // component structure styles (cascivo.component layer)
import '@cascivo/themes/all' // tokens (loaded once) + base typography + light & dark themes
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'cascivo + Next.js App Router',
  description: 'React Server Components + client islands with prebuilt cascivo components',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // data-theme selects the active cascivo theme — plain CSS, so it works in RSC.
    <html lang="en" data-theme="light">
      <body>{children}</body>
    </html>
  )
}
