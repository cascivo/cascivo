import './callout.css'

export type CalloutType = 'info' | 'warning' | 'success' | 'error'

export interface CalloutProps {
  type?: CalloutType
  title?: string
  children: React.ReactNode
}

export function Callout({ type = 'info', title, children }: CalloutProps) {
  return (
    <div className="callout" data-type={type} role="note">
      {title && <p className="callout-title">{title}</p>}
      <div className="callout-body">{children}</div>
    </div>
  )
}
