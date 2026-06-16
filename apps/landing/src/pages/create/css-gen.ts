import type { ThemeConfig } from './store'

const FONT_STACKS: Record<string, string> = {
  geometric: "'Futura', 'Century Gothic', 'Trebuchet MS', ui-sans-serif, sans-serif",
  humanist: "'Gill Sans', 'Trebuchet MS', 'Calibri', ui-sans-serif, sans-serif",
  transitional: "'Optima', 'Candara', 'Palatino Linotype', ui-sans-serif, sans-serif",
  mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
}

export function configToCSS(config: ThemeConfig): string {
  const light = config.baseMode === 'light'
  const h = config.accentHue
  const c = config.accentChroma

  const acc = (l: number, chroma = c) => `oklch(${l} ${chroma.toFixed(3)} ${h})`

  const lines: string[] = [
    `/* Add to your project CSS after importing the base theme: */`,
    `/* @import '@cascivo/themes/${config.baseMode}.css'; */`,
    `/* @import './theme.css'; */`,
    ``,
    `@layer cascade.theme {`,
    `  [data-theme="create-custom"] {`,
    ``,
    `    /* ── Accent ─────────────────────────────────── */`,
    `    --cascivo-color-accent: ${acc(light ? 0.52 : 0.65)};`,
    `    --cascivo-color-accent-foreground: ${light ? 'oklch(1 0 0)' : `oklch(0.145 0.005 ${h})`};`,
    `    --cascivo-color-accent-hover: ${acc(light ? 0.45 : 0.707)};`,
    `    --cascivo-color-accent-active: ${acc(light ? 0.373 : 0.808, Math.min(c, 0.155))};`,
    `    --cascivo-color-accent-subtle: ${acc(light ? 0.97 : 0.623, 0.025)};`,
    `    --cascivo-color-accent-muted: ${acc(light ? 0.932 : 0.623, light ? 0.055 : c * 0.2)};`,
    ``,
    `    /* ── Radius ─────────────────────────────────── */`,
    `    --cascivo-radius-base: ${config.radiusBase}rem;`,
    `    --cascivo-radius-control: var(--cascivo-radius-base);`,
    `    --cascivo-radius-surface: calc(var(--cascivo-radius-base) * 1.66);`,
    `    --cascivo-radius-indicator: calc(var(--cascivo-radius-base) / 2);`,
    `    --cascivo-radius-full: 9999px;`,
    `    --cascivo-radius-component: var(--cascivo-radius-base);`,
    `    --cascivo-radius-button: var(--cascivo-radius-base);`,
    `    --cascivo-radius-input: var(--cascivo-radius-base);`,
    `    --cascivo-radius-card: calc(var(--cascivo-radius-base) * 1.66);`,
    `    --cascivo-radius-badge: var(--cascivo-radius-full);`,
    `    --cascivo-radius-modal: calc(var(--cascivo-radius-base) * 2);`,
  ]

  if (config.fontFamily !== 'system') {
    lines.push(``)
    lines.push(`    /* ── Font ───────────────────────────────────── */`)
    lines.push(
      `    --cascivo-font-sans: ${FONT_STACKS[config.fontFamily] ?? FONT_STACKS['humanist']};`,
    )
  }

  lines.push(`  }`)
  lines.push(`}`)

  return lines.join('\n')
}

export function highlightCSS(css: string): string {
  return css
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\/)/g, '<span class="css-comment">$1</span>')
    .replace(/(--[\w-]+)(?=\s*:)/g, '<span class="css-prop">$1</span>')
    .replace(/:\s*([^;{}\n]+)/g, ': <span class="css-value">$1</span>')
}
