// Server component (no 'use client'). Global CSS from node_modules must be
// imported here, in the root layout — Next.js App Router only allows global
// stylesheets in layout/page modules, not in client components.
//
// Themes only. Component CSS is NOT imported here: @cascivo/react ships a `.css`
// side-effect import beside every component chunk, and the `react-server` export
// condition points RSC at that CSS-bearing build, so Next collects the stylesheet
// of each component the route actually renders — server components included — and
// tree-shakes the rest. Importing '@cascivo/react/styles.css' as well would replace
// ~7 KB of used component CSS with the whole 328 KB aggregate. The aggregate is for
// no-bundler setups; see docs/USING-WITH-NEXTJS.md.
import '@cascivo/themes/light-dark.css'
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
