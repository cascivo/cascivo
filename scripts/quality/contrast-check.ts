#!/usr/bin/env node
/**
 * Reads a CSS file, extracts --cascade-color-* custom properties,
 * checks text/surface color pairs for WCAG AA contrast (4.5:1 minimum),
 * and exits non-zero if any pair fails.
 *
 * Usage: node scripts/quality/contrast-check.ts <css-file>
 */

import { readFileSync } from 'node:fs'

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '')
  if (clean.length !== 3 && clean.length !== 6) return null
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  const n = parseInt(full, 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

function linearize(c: number): number {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

function luminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(linearize)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Convert oklch(L C H) to approximate relative luminance.
 * Uses the OKLab → linear sRGB path (approximate but sufficient for contrast checking).
 */
function oklchLuminance(L: number, C: number, H: number): number {
  const hRad = (H * Math.PI) / 180
  const a = C * Math.cos(hRad)
  const b = C * Math.sin(hRad)

  // OKLab → LMS (approximate)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b

  const lLin = l_ * l_ * l_
  const mLin = m_ * m_ * m_
  const sLin = s_ * s_ * s_

  // LMS → linear sRGB
  const rLin = +4.0767416621 * lLin - 3.3077115913 * mLin + 0.2309699292 * sLin
  const gLin = -1.2684380046 * lLin + 2.6097574011 * mLin - 0.3413193965 * sLin
  const bLin = -0.0041960863 * lLin - 0.7034186147 * mLin + 1.707614701 * sLin

  const clamp = (x: number) => Math.max(0, Math.min(1, x))
  return 0.2126 * clamp(rLin) + 0.7152 * clamp(gLin) + 0.0722 * clamp(bLin)
}

function parseOklch(value: string): number | null {
  // Matches: oklch(L C H) or oklch(L C H / alpha) — ignores alpha for contrast
  const m = value.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/[^)]+)?\s*\)/)
  if (!m) return null
  return oklchLuminance(parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]))
}

function luminanceFromValue(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed.startsWith('#')) {
    const rgb = hexToRgb(trimmed)
    return rgb ? luminance(rgb) : null
  }
  if (trimmed.startsWith('oklch(')) {
    return parseOklch(trimmed)
  }
  return null
}

export function contrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1)
  const rgb2 = hexToRgb(hex2)
  if (!rgb1 || !rgb2) return 0
  const l1 = luminance(rgb1)
  const l2 = luminance(rgb2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function contrastRatioFromLuminances(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)
  return (lighter + 0.05) / (darker + 0.05)
}

function extractTokens(css: string): Map<string, string> {
  const map = new Map<string, string>()
  // Match --cascade-color-* or --cascade-border-* : #rrggbb, #rgb, or oklch(...)
  const re = /(--cascade-(?:color|border)-[\w-]+)\s*:\s*(oklch\([^;]+\)|#[0-9a-fA-F]{3,6})/g
  let m: RegExpExecArray | null
  while ((m = re.exec(css)) !== null) {
    map.set(m[1], m[2].trim())
  }
  return map
}

// Heuristic pairs: tokens whose names suggest text paired with tokens suggesting background
function buildPairs(tokens: Map<string, string>): Array<[string, string, string, string]> {
  const pairs: Array<[string, string, string, string]> = []
  const textKeys = [...tokens.keys()].filter(
    (k) => k.includes('text') || k.includes('fg') || k.includes('foreground'),
  )
  const surfaceKeys = [...tokens.keys()].filter(
    (k) =>
      k.includes('bg') || k.includes('background') || k.includes('surface') || k.includes('base'),
  )

  for (const tk of textKeys) {
    for (const sk of surfaceKeys) {
      const textVal = tokens.get(tk)
      const surfaceVal = tokens.get(sk)
      if (textVal && surfaceVal) {
        pairs.push([tk, textVal, sk, surfaceVal])
      }
    }
  }
  return pairs
}

/**
 * Explicit semantic pairs to check — covers the new oklch-based token set.
 * Returns pairs as [foreground-name, foreground-value, background-name, background-value, min-ratio]
 */
function buildSemanticPairs(
  tokens: Map<string, string>,
): Array<[string, string, string, string, number]> {
  const explicit: Array<[string, string, number]> = [
    // [foreground-token, background-token, min-ratio]
    ['--cascade-color-foreground', '--cascade-color-background', 4.5],
    ['--cascade-color-foreground-muted', '--cascade-color-surface', 4.5],
    ['--cascade-color-accent-foreground', '--cascade-color-accent', 4.5],
    ['--cascade-border-default', '--cascade-color-background', 3.0],
  ]

  const pairs: Array<[string, string, string, string, number]> = []
  for (const [fgKey, bgKey, minRatio] of explicit) {
    const fgVal = tokens.get(fgKey)
    const bgVal = tokens.get(bgKey)
    if (fgVal && bgVal) {
      pairs.push([fgKey, fgVal, bgKey, bgVal, minRatio])
    }
  }
  return pairs
}

function main() {
  const [, , cssFile] = process.argv
  if (!cssFile) {
    console.error('Usage: contrast-check.ts <css-file>')
    process.exit(1)
  }

  const css = readFileSync(cssFile, 'utf8')
  const tokens = extractTokens(css)

  if (tokens.size === 0) {
    console.log('No --cascade-color-* hex/oklch tokens found. Nothing to check.')
    process.exit(0)
  }

  // --- Legacy heuristic pairs (hex only) ---
  const pairs = buildPairs(tokens)
  const THRESHOLD = 4.5
  let failures = 0

  for (const [tk, tv, sk, sv] of pairs) {
    // Only check hex values in legacy path
    if (!tv.startsWith('#') || !sv.startsWith('#')) continue
    const ratio = contrastRatio(tv, sv)
    if (ratio < THRESHOLD) {
      console.error(`FAIL  ${ratio.toFixed(2)}:1  ${tk} (${tv}) on ${sk} (${sv})`)
      failures++
    }
  }

  // --- Explicit semantic pairs (supports oklch) ---
  const semanticPairs = buildSemanticPairs(tokens)
  if (semanticPairs.length > 0) {
    console.log('\n── Semantic token pairs ──')
    for (const [fgKey, fgVal, bgKey, bgVal, minRatio] of semanticPairs) {
      const fgLum = luminanceFromValue(fgVal)
      const bgLum = luminanceFromValue(bgVal)
      if (fgLum === null || bgLum === null) {
        console.log(`SKIP  (unparseable)  ${fgKey} on ${bgKey}`)
        continue
      }
      const ratio = contrastRatioFromLuminances(fgLum, bgLum)
      const label = `${ratio.toFixed(2)}:1  ${fgKey} on ${bgKey} (min ${minRatio}:1)`
      if (ratio < minRatio) {
        console.error(`FAIL  ${label}`)
        failures++
      } else {
        console.log(`PASS  ${label}`)
      }
    }
  }

  if (failures > 0) {
    console.error(`\n${failures} pair(s) fail WCAG contrast`)
    process.exit(1)
  } else {
    const totalChecked = pairs.filter((p) => p[1].startsWith('#') && p[3].startsWith('#')).length
    console.log(`\nAll ${totalChecked + semanticPairs.length} pair(s) pass WCAG contrast.`)
  }
}

main()
