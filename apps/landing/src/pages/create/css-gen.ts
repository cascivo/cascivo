import type { ThemeConfig } from './store'

const FONT_STACKS: Record<string, string> = {
  geometric: "'Futura', 'Century Gothic', 'Trebuchet MS', ui-sans-serif, sans-serif",
  humanist: "'Gill Sans', 'Trebuchet MS', 'Calibri', ui-sans-serif, sans-serif",
  transitional: "'Optima', 'Candara', 'Palatino Linotype', ui-sans-serif, sans-serif",
  mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
}

// Resolved concrete values from packages/themes/src/light.css + primitives
const BASE_LIGHT = `
    color-scheme: light;
    --cascivo-color-background: oklch(1 0 0);
    --cascivo-color-surface: oklch(0.985 0.002 264);
    --cascivo-color-surface-2: oklch(0.967 0.003 264);
    --cascivo-color-bg: var(--cascivo-color-background);
    --cascivo-color-bg-subtle: var(--cascivo-color-surface);
    --cascivo-color-surface-raised: var(--cascivo-color-surface);
    --cascivo-color-surface-overlay: var(--cascivo-color-background);
    --cascivo-color-border: oklch(0.928 0.006 264);
    --cascivo-color-border-strong: oklch(0.872 0.008 264);
    --cascivo-border-subtle: oklch(0.928 0.006 264);
    --cascivo-border-default: oklch(0.872 0.008 264);
    --cascivo-border-strong: oklch(0.707 0.015 264);
    --cascivo-color-foreground: oklch(0.145 0.005 264);
    --cascivo-color-foreground-muted: oklch(0.554 0.018 264);
    --cascivo-color-text: var(--cascivo-color-foreground);
    --cascivo-color-text-subtle: oklch(0.446 0.018 264);
    --cascivo-color-text-muted: oklch(0.707 0.015 264);
    --cascivo-color-text-on-accent: oklch(1 0 0);
    --cascivo-color-text-on-destructive: oklch(1 0 0);
    --cascivo-color-primary: oklch(0.205 0 0);
    --cascivo-color-primary-fg: oklch(0.985 0 0);
    --cascivo-color-primary-hover: oklch(0.27 0 0);
    --cascivo-color-primary-active: oklch(0.32 0 0);
    --cascivo-color-active-bg: oklch(0.145 0.005 264 / 6%);
    --cascivo-color-destructive: oklch(0.54 0.188 22);
    --cascivo-color-destructive-hover: oklch(0.448 0.17 22);
    --cascivo-color-destructive-subtle: oklch(0.971 0.013 22);
    --cascivo-color-error: oklch(0.628 0.188 22);
    --cascivo-color-warning: oklch(0.768 0.145 75);
    --cascivo-color-success: oklch(0.648 0.15 145);
    --cascivo-color-success-subtle: oklch(0.982 0.018 145);
    --cascivo-color-warning-subtle: oklch(0.98 0.02 75);
    --cascivo-color-info: oklch(0.546 0.224 250);
    --cascivo-color-info-subtle: oklch(0.97 0.025 250);
    --cascivo-color-success-foreground: oklch(0.45 0.14 145);
    --cascivo-color-warning-foreground: oklch(0.5 0.14 75);
    --cascivo-shadow-xs: 0 1px 2px oklch(0 0 0 / 0.05);
    --cascivo-shadow-sm: 0 1px 3px oklch(0 0 0 / 0.07), 0 1px 2px oklch(0 0 0 / 0.04);
    --cascivo-shadow-md: 0 2px 8px oklch(0 0 0 / 0.07), 0 1px 2px oklch(0 0 0 / 0.04);
    --cascivo-shadow-overlay: 0 4px 32px oklch(0 0 0 / 0.16), 0 0 0 1px oklch(0 0 0 / 0.04);
    --cascivo-shadow-lg: var(--cascivo-shadow-overlay);
    --cascivo-ring-width: 2px;
    --cascivo-ring-offset: 0px;
    --cascivo-ring-color: color-mix(in oklch, var(--cascivo-color-accent) 55%, transparent);
    --cascivo-focus-ring: 0 0 0 var(--cascivo-ring-width) var(--cascivo-ring-color);`

// Resolved concrete values from packages/themes/src/dark.css + primitives
const BASE_DARK = `
    color-scheme: dark;
    --cascivo-color-background: oklch(0.145 0.005 250);
    --cascivo-color-surface: oklch(0.185 0.007 250);
    --cascivo-color-surface-2: oklch(0.22 0.008 250);
    --cascivo-color-bg: var(--cascivo-color-background);
    --cascivo-color-bg-subtle: var(--cascivo-color-surface);
    --cascivo-color-surface-raised: var(--cascivo-color-surface-2);
    --cascivo-color-surface-overlay: var(--cascivo-color-surface);
    --cascivo-color-border: oklch(1 0 0 / 10%);
    --cascivo-color-border-strong: oklch(1 0 0 / 16%);
    --cascivo-border-subtle: oklch(1 0 0 / 0.06);
    --cascivo-border-default: oklch(1 0 0 / 0.1);
    --cascivo-border-strong: oklch(1 0 0 / 0.2);
    --cascivo-color-foreground: oklch(0.985 0.002 264);
    --cascivo-color-foreground-muted: oklch(0.707 0.015 264);
    --cascivo-color-text: var(--cascivo-color-foreground);
    --cascivo-color-text-subtle: oklch(0.707 0.015 264);
    --cascivo-color-text-muted: oklch(0.554 0.018 264);
    --cascivo-color-text-on-accent: oklch(0.145 0.005 250);
    --cascivo-color-text-on-destructive: oklch(1 0 0);
    --cascivo-color-primary: oklch(0.922 0 0);
    --cascivo-color-primary-fg: oklch(0.205 0 0);
    --cascivo-color-primary-hover: oklch(0.86 0 0);
    --cascivo-color-primary-active: oklch(0.8 0 0);
    --cascivo-color-active-bg: oklch(1 0 0 / 8%);
    --cascivo-color-destructive: oklch(0.72 0.16 22);
    --cascivo-color-destructive-hover: oklch(0.628 0.188 22);
    --cascivo-color-destructive-subtle: oklch(0.628 0.188 22 / 0.1);
    --cascivo-color-error: oklch(0.72 0.16 22);
    --cascivo-color-warning: oklch(0.82 0.13 75);
    --cascivo-color-success: oklch(0.72 0.13 145);
    --cascivo-color-success-subtle: oklch(0.72 0.13 145 / 0.1);
    --cascivo-color-warning-subtle: oklch(0.82 0.13 75 / 0.1);
    --cascivo-color-info: oklch(0.65 0.2 250);
    --cascivo-color-info-subtle: oklch(0.65 0.2 250 / 0.1);
    --cascivo-color-success-foreground: oklch(0.72 0.13 145);
    --cascivo-color-warning-foreground: oklch(0.82 0.13 75);
    --cascivo-shadow-xs: none;
    --cascivo-shadow-sm: 0 1px 3px oklch(0 0 0 / 0.4);
    --cascivo-shadow-md: 0 2px 8px oklch(0 0 0 / 0.45);
    --cascivo-shadow-overlay: 0 4px 32px oklch(0 0 0 / 0.6), 0 0 0 1px oklch(1 0 0 / 0.06);
    --cascivo-shadow-lg: var(--cascivo-shadow-overlay);
    --cascivo-ring-width: 2px;
    --cascivo-ring-offset: 0px;
    --cascivo-ring-color: color-mix(in oklch, var(--cascivo-color-accent) 65%, transparent);
    --cascivo-focus-ring: 0 0 0 var(--cascivo-ring-width) var(--cascivo-ring-color);`

/**
 * @param previewMode - when true, inlines the full base theme token set so the
 *   preview block is self-contained and independent of the landing page's global
 *   theme. The code-output tab omits these (users import the base theme themselves).
 */
export function configToCSS(config: ThemeConfig, previewMode = false): string {
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
  ]

  if (previewMode) {
    lines.push(light ? BASE_LIGHT : BASE_DARK)
    lines.push(``)
  }

  lines.push(
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
  )

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
