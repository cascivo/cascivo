import { Suspense, type ReactNode } from 'react'

export interface SuspenseBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

export function SuspenseBoundary({ children, fallback }: SuspenseBoundaryProps) {
  return (
    <Suspense fallback={fallback ?? <span aria-busy="true" aria-label="Loading" />}>
      {children}
    </Suspense>
  )
}
