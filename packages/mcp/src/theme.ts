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
 * Generate a custom cascivo theme as CSS. Maps the three input colors onto the
 * semantic token layer; component tokens inherit automatically.
 */
export function generateThemeCss(colors: ThemeColors, name = 'custom'): string {
  const { primary, neutral, accent } = colors
  return `/* cascivo — Generated theme: ${name} */

@layer cascivo.theme {
  [data-theme='${name}'] {
    color-scheme: light;

    /* ── Surface (derived from neutral) ───────────────── */
    --cascivo-color-bg: ${lighten(neutral, 96)};
    --cascivo-color-bg-subtle: ${lighten(neutral, 92)};
    --cascivo-color-surface: ${lighten(neutral, 98)};
    --cascivo-color-surface-raised: ${lighten(neutral, 94)};
    --cascivo-color-surface-overlay: ${lighten(neutral, 98)};
    --cascivo-color-border: ${lighten(neutral, 80)};
    --cascivo-color-border-strong: ${lighten(neutral, 65)};

    /* ── Text (derived from neutral) ──────────────────── */
    --cascivo-color-text: ${darken(neutral, 80)};
    --cascivo-color-text-subtle: ${darken(neutral, 50)};
    --cascivo-color-text-muted: ${lighten(neutral, 30)};
    --cascivo-color-text-on-accent: #ffffff;
    --cascivo-color-text-on-destructive: #ffffff;

    /* ── Accent / primary interactive ─────────────────── */
    --cascivo-color-accent: ${primary};
    --cascivo-color-accent-hover: ${darken(primary, 12)};
    --cascivo-color-accent-active: ${darken(primary, 24)};
    --cascivo-color-accent-subtle: ${lighten(primary, 88)};
    --cascivo-color-accent-muted: ${lighten(primary, 76)};

    /* ── Secondary accent (info / focus) ──────────────── */
    --cascivo-color-info: ${accent};
    --cascivo-color-info-subtle: ${lighten(accent, 88)};
    --cascivo-color-focus-ring: ${accent};
    --cascivo-focus-ring: 0 0 0 3px ${lighten(accent, 20)};

    /* ── Status ───────────────────────────────────────── */
    --cascivo-color-destructive: #dc2626;
    --cascivo-color-destructive-hover: ${darken('#dc2626', 12)};
    --cascivo-color-destructive-subtle: ${lighten('#dc2626', 88)};
    --cascivo-color-success: #16a34a;
    --cascivo-color-success-subtle: ${lighten('#16a34a', 88)};
    --cascivo-color-warning: #f59e0b;
    --cascivo-color-warning-subtle: ${lighten('#f59e0b', 88)};
  }
}
`
}
