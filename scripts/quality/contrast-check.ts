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

function extractTokens(css: string): Map<string, string> {
  const map = new Map<string, string>()
  // Match --cascade-color-* : #rrggbb or #rgb
  const re = /(--cascade-color-[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,6})/g
  let m: RegExpExecArray | null
  while ((m = re.exec(css)) !== null) {
    map.set(m[1], m[2])
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

function main() {
  const [, , cssFile] = process.argv
  if (!cssFile) {
    console.error('Usage: contrast-check.ts <css-file>')
    process.exit(1)
  }

  const css = readFileSync(cssFile, 'utf8')
  const tokens = extractTokens(css)

  if (tokens.size === 0) {
    console.log('No --cascade-color-* hex tokens found. Nothing to check.')
    process.exit(0)
  }

  const pairs = buildPairs(tokens)
  if (pairs.length === 0) {
    console.log('No text/surface pairs found. Nothing to check.')
    process.exit(0)
  }

  const THRESHOLD = 4.5
  let failures = 0

  for (const [tk, tv, sk, sv] of pairs) {
    const ratio = contrastRatio(tv, sv)
    if (ratio < THRESHOLD) {
      console.error(`FAIL  ${ratio.toFixed(2)}:1  ${tk} (${tv}) on ${sk} (${sv})`)
      failures++
    }
  }

  if (failures > 0) {
    console.error(`\n${failures} pair(s) fail WCAG AA (minimum 4.5:1)`)
    process.exit(1)
  } else {
    console.log(`All ${pairs.length} text/surface pair(s) pass WCAG AA contrast.`)
  }
}

main()
