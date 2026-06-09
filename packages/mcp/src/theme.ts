export interface ThemeColors {
  /** Main brand / interactive color (maps to the accent token family). */
  primary: string
  /** Base gray used to derive surfaces, borders, and text. */
  neutral: string
  /** Secondary highlight color (info / focus ring). */
  accent: string
}

/** Darken a color by mixing in black (modern CSS, no preprocessor). */
function darken(color: string, amount: number): string {
  return `color-mix(in oklab, ${color}, black ${amount}%)`
}

/** Lighten a color by mixing in white. */
function lighten(color: string, amount: number): string {
  return `color-mix(in oklab, ${color}, white ${amount}%)`
}

/**
 * Generate a custom cascade theme as CSS. Maps the three input colors onto the
 * semantic token layer; component tokens inherit automatically.
 */
export function generateThemeCss(colors: ThemeColors, name = 'custom'): string {
  const { primary, neutral, accent } = colors
  return `/* Cascade — Generated theme: ${name} */

@layer cascade.theme {
  [data-theme='${name}'] {
    color-scheme: light;

    /* ── Surface (derived from neutral) ───────────────── */
    --cascade-color-bg: ${lighten(neutral, 96)};
    --cascade-color-bg-subtle: ${lighten(neutral, 92)};
    --cascade-color-surface: ${lighten(neutral, 98)};
    --cascade-color-surface-raised: ${lighten(neutral, 94)};
    --cascade-color-surface-overlay: ${lighten(neutral, 98)};
    --cascade-color-border: ${lighten(neutral, 80)};
    --cascade-color-border-strong: ${lighten(neutral, 65)};

    /* ── Text (derived from neutral) ──────────────────── */
    --cascade-color-text: ${darken(neutral, 80)};
    --cascade-color-text-subtle: ${darken(neutral, 50)};
    --cascade-color-text-muted: ${lighten(neutral, 30)};
    --cascade-color-text-on-accent: #ffffff;
    --cascade-color-text-on-destructive: #ffffff;

    /* ── Accent / primary interactive ─────────────────── */
    --cascade-color-accent: ${primary};
    --cascade-color-accent-hover: ${darken(primary, 12)};
    --cascade-color-accent-active: ${darken(primary, 24)};
    --cascade-color-accent-subtle: ${lighten(primary, 88)};
    --cascade-color-accent-muted: ${lighten(primary, 76)};

    /* ── Secondary accent (info / focus) ──────────────── */
    --cascade-color-info: ${accent};
    --cascade-color-info-subtle: ${lighten(accent, 88)};
    --cascade-color-focus-ring: ${accent};
    --cascade-focus-ring: 0 0 0 3px ${lighten(accent, 20)};

    /* ── Status ───────────────────────────────────────── */
    --cascade-color-destructive: #dc2626;
    --cascade-color-destructive-hover: ${darken('#dc2626', 12)};
    --cascade-color-destructive-subtle: ${lighten('#dc2626', 88)};
    --cascade-color-success: #16a34a;
    --cascade-color-success-subtle: ${lighten('#16a34a', 88)};
    --cascade-color-warning: #f59e0b;
    --cascade-color-warning-subtle: ${lighten('#f59e0b', 88)};
  }
}
`
}
