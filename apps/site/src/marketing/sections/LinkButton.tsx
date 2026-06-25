import type { ReactNode } from 'react'

const isExternal = (href: string) => /^https?:\/\//.test(href)

type Props = {
  href: string
  variant?: 'primary' | 'secondary' | 'ghost'
  children: ReactNode
}

/**
 * An anchor styled as a button (`.btn`). Real navigation = crawlable, keyboard-
 * native, middle-clickable — replaces `<button onClick=window.location>`.
 * External links get `target="_blank"` + `rel="noopener noreferrer"`.
 */
export function LinkButton({ href, variant = 'primary', children }: Props) {
  const external = isExternal(href)
  return (
    <a
      href={href}
      className={`btn btn-${variant}`}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  )
}
