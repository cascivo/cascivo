'use client'
import { cn, useId, useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { useRef } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import styles from './share-menu.module.css'

/** A network `ShareMenu` can hand a link to. */
export type ShareNetwork = 'bluesky' | 'mastodon' | 'threads' | 'linkedin' | 'x'

export interface ShareContent {
  /** The page being shared. */
  url: string
  /** Text to post alongside the link. LinkedIn takes no text; it reads the page's own tags. */
  text?: string
  /** The Mastodon server to post from, e.g. `mastodon.social`. Required for `mastodon`. */
  server?: string
}

const NETWORK_NAMES: Record<ShareNetwork, string> = {
  bluesky: 'Bluesky',
  mastodon: 'Mastodon',
  threads: 'Threads',
  linkedin: 'LinkedIn',
  x: 'X',
}

const ALL_NETWORKS: ShareNetwork[] = ['bluesky', 'mastodon', 'threads', 'linkedin', 'x']
const SERVER_KEY = 'cascivo.share-menu.mastodon-server'

/**
 * A bare host name from what a person types for their server — `mastodon.social`,
 * `https://mastodon.social/`, or `@me@mastodon.social` — or `null` when it is not one.
 */
function serverHost(input: string): string | null {
  const bare = input.trim().replace(/^@?[^@\s/]+@/, '')
  if (!bare) return null
  try {
    const url = new URL(/^https?:\/\//i.test(bare) ? bare : `https://${bare}`)
    return url.hostname.includes('.') && !url.username && !url.port ? url.hostname : null
  } catch {
    return null
  }
}

/**
 * The network's own "compose a post" link for `content`, or `null` for Mastodon without a
 * usable `server`. Opens the network's composer with the text filled in — the person still
 * reviews and posts, so no account, token, or API is involved.
 */
export function shareIntentUrl(network: ShareNetwork, content: ShareContent): string | null {
  const { url, text } = content
  const withUrl = text ? `${text} ${url}` : url
  switch (network) {
    case 'bluesky':
      return `https://bsky.app/intent/compose?${new URLSearchParams({ text: withUrl })}`
    case 'mastodon': {
      const host = content.server ? serverHost(content.server) : null
      return host ? `https://${host}/share?${new URLSearchParams({ text: withUrl })}` : null
    }
    case 'threads':
      return `https://www.threads.com/intent/post?${new URLSearchParams({ text: text ?? '', url })}`
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({ url })}`
    case 'x':
      return `https://x.com/intent/post?${new URLSearchParams({ text: text ?? '', url })}`
  }
}

export interface ShareMenuProps {
  /** The page being shared. */
  url: string
  /** Text to post alongside the link. */
  text?: string
  /**
   * The networks offered, in order.
   *
   * @defaultValue `['bluesky', 'mastodon', 'threads', 'linkedin', 'x']`
   * @see the component manifest
   */
  items?: ShareNetwork[]
  size?: 'sm' | 'md'
  labels?: {
    share?: string
    copyLink?: string
    copied?: string
    more?: string
    server?: string
    /** Receives the network's name, e.g. `Bluesky`. */
    shareOn?: (network: string) => string
  }
  className?: string
}

/**
 * A "Share" button opening a panel of intent links, a copy-link action, and — where the
 * browser has one — the system share sheet. The panel is a native `popover` opened by
 * `popovertarget`, so the links work before (or without) hydration.
 */
export function ShareMenu({
  url,
  text,
  items = ALL_NETWORKS,
  size = 'md',
  labels,
  className,
}: ShareMenuProps) {
  useSignals()
  const panelId = useId('share-menu')
  const serverId = `${panelId}-server`
  const anchor = `--${panelId}`
  const panelRef = useRef<HTMLDivElement>(null)
  const open = useSignal(false)
  // Client-only affordances, decided after mount so the server HTML and the first client
  // render agree.
  const canShare = useSignal(false)
  const hydrated = useSignal(false)
  const copied = useSignal(false)
  const server = useSignal('')

  useSignalEffect(() => {
    hydrated.value = true
    canShare.value = typeof navigator.share === 'function'
    try {
      server.value = localStorage.getItem(SERVER_KEY) ?? ''
    } catch {
      // Storage blocked: the field simply starts empty.
    }
    const panel = panelRef.current
    if (!panel) return
    const onToggle = (event: Event) => {
      open.value = (event as ToggleEvent).newState === 'open'
    }
    panel.addEventListener('toggle', onToggle)
    return () => panel.removeEventListener('toggle', onToggle)
  })

  const label = (key: 'share' | 'copyLink' | 'copied' | 'more' | 'server') =>
    labels?.[key] ?? t(builtin.shareMenu[key])
  const shareOn = (network: ShareNetwork) => {
    const name = NETWORK_NAMES[network]
    return labels?.shareOn?.(name) ?? t(builtin.shareMenu.shareOn, { network: name })
  }

  const copyLink = () => {
    void navigator.clipboard.writeText(url)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }

  const nativeShare = () => {
    panelRef.current?.hidePopover()
    // A dismissed sheet rejects with AbortError; there is nothing to report.
    navigator.share({ url, ...(text && { text }) }).catch(() => {})
  }

  const shareOnMastodon = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const href = shareIntentUrl('mastodon', { url, ...(text && { text }), server: server.value })
    if (!href) return
    try {
      localStorage.setItem(SERVER_KEY, server.value.trim())
    } catch {
      // Not remembered this time; sharing still works.
    }
    window.open(href, '_blank', 'noopener')
    panelRef.current?.hidePopover()
  }

  return (
    <span className={cn(styles['root'], className)}>
      <button
        type="button"
        popoverTarget={panelId}
        aria-expanded={open.value}
        data-size={size}
        className={styles['trigger']}
        style={{ anchorName: anchor } as CSSProperties}
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" className={styles['icon']}>
          <path
            d="M8 10V2M5 5l3-3 3 3M3 8v5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {label('share')}
      </button>
      <div
        ref={panelRef}
        id={panelId}
        popover="auto"
        aria-label={label('share')}
        className={styles['panel']}
        style={{ positionAnchor: anchor } as CSSProperties}
      >
        <ul className={styles['list']}>
          {items.map((network) =>
            network === 'mastodon' ? (
              // Mastodon has no single host to link to: the person names their server. The
              // form needs script to open it, so it waits for hydration.
              hydrated.value && (
                <li key={network}>
                  <form className={styles['server']} onSubmit={shareOnMastodon}>
                    <label htmlFor={serverId} className={styles['serverLabel']}>
                      {label('server')}
                    </label>
                    <span className={styles['serverRow']}>
                      <input
                        id={serverId}
                        type="text"
                        inputMode="url"
                        autoComplete="off"
                        placeholder="mastodon.social"
                        required
                        value={server.value}
                        onInput={(event) => {
                          server.value = event.currentTarget.value
                        }}
                        className={styles['serverInput']}
                      />
                      <button type="submit" className={styles['item']}>
                        {shareOn('mastodon')}
                      </button>
                    </span>
                  </form>
                </li>
              )
            ) : (
              <li key={network}>
                <a
                  href={shareIntentUrl(network, { url, ...(text && { text }) }) ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-network={network}
                  className={styles['item']}
                >
                  {shareOn(network)}
                </a>
              </li>
            ),
          )}
          {hydrated.value && (
            <li className={styles['divided']}>
              <button
                type="button"
                data-state={copied.value ? 'copied' : 'idle'}
                className={styles['item']}
                onClick={copyLink}
              >
                <span aria-live="polite">{copied.value ? label('copied') : label('copyLink')}</span>
              </button>
            </li>
          )}
          {canShare.value && (
            <li>
              <button type="button" className={styles['item']} onClick={nativeShare}>
                {label('more')}
              </button>
            </li>
          )}
        </ul>
      </div>
    </span>
  )
}
