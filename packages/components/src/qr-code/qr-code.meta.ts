import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'QrCode',
  description: 'Encodes a URL or short text into a scannable SVG QR code',
  category: 'display',
  states: ['default'],
  variants: [],
  sizes: [],
  props: [
    { name: 'value', type: 'string', required: true, description: 'Text or URL to encode' },
    { name: 'size', type: 'number', required: false, default: '128' },
    {
      name: 'errorCorrection',
      type: "'L' | 'M' | 'Q' | 'H'",
      required: false,
      default: 'M',
      description: 'Higher levels tolerate more damage but hold less data',
    },
    {
      name: 'radius',
      type: 'string',
      required: false,
      description: 'CSS length rounding the corners',
    },
    { name: 'fill', type: 'string', required: false, default: 'currentColor' },
    { name: 'background', type: 'string', required: false, default: 'transparent' },
    { name: 'label', type: 'string', required: false },
  ],
  tokens: ['--cascivo-color-text'],
  accessibility: {
    role: 'img',
    wcag: '2.2-AA',
    keyboard: [],
  },
  examples: [
    { title: 'URL', code: '<QrCode value="https://cascivo.dev" />' },
    {
      title: 'High error correction',
      code: '<QrCode value="https://cascivo.dev" errorCorrection="H" size={200} />',
    },
    {
      title: 'Custom colors',
      code: '<QrCode value="cascivo" fill="var(--cascivo-color-accent)" background="var(--cascivo-color-surface)" />',
    },
  ],
  dependencies: ['@cascivo/core', '@cascivo/i18n'],
  tags: ['qr', 'qr-code', 'barcode', 'encode', 'display'],
  intent: {
    whenToUse: [
      'Letting users scan a URL, contact, or short token with a phone camera',
      'Bridging print or screen to a digital destination',
      'Sharing a link where typing it would be error-prone',
    ],
    whenNotToUse: [
      'Encoding long or sensitive payloads — QR codes are public and capacity-limited',
      'Where a plain, copyable link or button is more accessible',
    ],
    antiPatterns: [
      {
        bad: '<QrCode value={veryLongString} />',
        good: '<QrCode value="https://cascivo.dev/s/abc" />',
        why: 'Long payloads force a dense, hard-to-scan code; encode a short URL that redirects instead',
      },
    ],
    related: [
      {
        name: 'CopyButton',
        relationship: 'pairs-with',
        reason: 'Offer a copyable link alongside the QR code for non-camera contexts',
      },
    ],
    a11yRationale:
      'Rendered as role="img" with an accessible label so screen-reader users know a QR code is present; the underlying link should also be available as text since a QR code is not operable by assistive tech',
    flexibility: [
      {
        area: 'errorCorrection',
        level: 'flexible',
        note: 'Raise to Q/H when the code may be printed small or partially obscured',
      },
      {
        area: 'colors',
        level: 'flexible',
        note: 'Defaults to currentColor; keep sufficient contrast between fill and background to stay scannable',
      },
    ],
  },
}
