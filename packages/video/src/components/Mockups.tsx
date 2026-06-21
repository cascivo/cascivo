import { font } from '../theme'

/**
 * Lightweight, theme-driven mock components. They read CSS variables so the same
 * markup re-skins instantly when a scene swaps the active palette — exactly how
 * cascivo's `data-theme` works.
 */
export interface ThemeVars {
  bg: string
  surface: string
  text: string
  muted: string
  border: string
  accent: string
  accentFg: string
  radius: number
}

export const MockButton: React.FC<{
  t: ThemeVars
  label?: string
  variant?: 'solid' | 'ghost'
}> = ({ t, label = 'Get started', variant = 'solid' }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '14px 26px',
      borderRadius: t.radius,
      fontFamily: font.sans,
      fontSize: 24,
      fontWeight: 600,
      background: variant === 'solid' ? t.accent : 'transparent',
      color: variant === 'solid' ? t.accentFg : t.text,
      border: variant === 'solid' ? 'none' : `1px solid ${t.border}`,
    }}
  >
    {label}
  </span>
)

export const MockBadge: React.FC<{ t: ThemeVars; label?: string }> = ({ t, label = 'New' }) => (
  <span
    style={{
      display: 'inline-flex',
      padding: '6px 16px',
      borderRadius: 999,
      fontFamily: font.sans,
      fontSize: 20,
      fontWeight: 600,
      background: t.accent,
      color: t.accentFg,
    }}
  >
    {label}
  </span>
)

export const MockCard: React.FC<{ t: ThemeVars }> = ({ t }) => (
  <div
    style={{
      width: 460,
      padding: 38,
      borderRadius: t.radius * 1.8,
      background: t.surface,
      border: `1px solid ${t.border}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 22,
      boxShadow: '0 30px 80px rgba(0, 0, 0, 0.35)',
      fontFamily: font.sans,
      textAlign: 'start',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: t.text, fontSize: 30, fontWeight: 700 }}>Project status</span>
      <MockBadge t={t} label="Live" />
    </div>
    <span style={{ color: t.muted, fontSize: 22, lineHeight: 1.5 }}>
      Owned, copy-pasted source. No Tailwind, no runtime style injection — just tokens you can read.
    </span>
    <div style={{ display: 'flex', gap: 14 }}>
      <MockButton t={t} />
      <MockButton t={t} variant="ghost" label="Docs" />
    </div>
  </div>
)

/** A few of cascivo's 14 first-party themes, as switchable variable sets. */
export const THEMES: { name: string; vars: ThemeVars }[] = [
  {
    name: 'light',
    vars: {
      bg: '#ffffff',
      surface: '#fbfbfc',
      text: '#1b1d22',
      muted: '#71757f',
      border: '#e6e8ec',
      accent: '#1b1d22',
      accentFg: '#ffffff',
      radius: 8,
    },
  },
  {
    name: 'dark',
    vars: {
      bg: '#0b0d12',
      surface: '#15181f',
      text: '#f3f5f8',
      muted: '#9aa1ad',
      border: '#262a33',
      accent: '#f3f5f8',
      accentFg: '#0b0d12',
      radius: 8,
    },
  },
  {
    name: 'warm',
    vars: {
      bg: '#fbf6ef',
      surface: '#fffaf3',
      text: '#3a2f25',
      muted: '#8a7c6c',
      border: '#ece0d2',
      accent: '#c2683a',
      accentFg: '#fffaf3',
      radius: 14,
    },
  },
  {
    name: 'cyberpunk',
    vars: {
      bg: '#0a0014',
      surface: '#190a2e',
      text: '#f6e9ff',
      muted: '#b18ad6',
      border: '#3a1c63',
      accent: '#ff2e97',
      accentFg: '#0a0014',
      radius: 2,
    },
  },
  {
    name: 'terminal',
    vars: {
      bg: '#03120a',
      surface: '#06210f',
      text: '#9dffbe',
      muted: '#4fbf7e',
      border: '#0f4d28',
      accent: '#34d399',
      accentFg: '#03120a',
      radius: 0,
    },
  },
  {
    name: 'pastel',
    vars: {
      bg: '#f6f3ff',
      surface: '#fefcff',
      text: '#3c3357',
      muted: '#8b82a8',
      border: '#e7e0fb',
      accent: '#8b7bf0',
      accentFg: '#ffffff',
      radius: 18,
    },
  },
]
