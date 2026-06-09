import type { ComponentChildren } from 'preact'

export type ToastVariant = 'default' | 'success' | 'warning' | 'destructive'

export interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

export declare function ToastProvider(props: { children?: ComponentChildren }): JSX.Element
export declare function useToast(): { toast: (options: ToastOptions) => void }
export declare function dismissAllToasts(): void
