/**
 * Chart export helpers — serialize the live `<svg>` to a standalone file (with the
 * chart's resolved paint inlined so it renders without the page's CSS), rasterize it
 * to a PNG at devicePixelRatio, and trigger a download. All guard SSR/jsdom: they
 * no-op (returning null / doing nothing) when the DOM APIs are unavailable.
 */

const PAINT_PROPS = ['fill', 'stroke', 'stop-color', 'color'] as const

/**
 * Serialize an SVG element to a standalone string, inlining each element's resolved
 * `fill`/`stroke`/`stop-color` (so `var(--cascivo-*)` tokens become concrete colours
 * that render outside the page). Literal colours pass straight through.
 */
export function serializeSvg(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement
  if (typeof getComputedStyle === 'function') {
    const src = svg.querySelectorAll('*')
    const dst = clone.querySelectorAll('*')
    for (let i = 0; i < src.length; i++) {
      const cs = getComputedStyle(src[i]!)
      const el = dst[i]
      if (!el) continue
      for (const prop of PAINT_PROPS) {
        const v = cs.getPropertyValue(prop)
        if (v && v !== 'none' && !v.includes('var(')) el.setAttribute(prop, v)
      }
    }
  }
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  return new XMLSerializer().serializeToString(clone)
}

/**
 * Rasterize a serialized SVG string to a PNG `Blob` at `width × height × dpr`.
 * Resolves `null` when canvas/Image isn't available (SSR) or the image fails to load.
 */
export function svgToPngBlob(
  svgString: string,
  opts: { width: number; height: number; dpr?: number },
): Promise<Blob | null> {
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    return Promise.resolve(null)
  }
  const dpr = opts.dpr ?? 1
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(opts.width * dpr))
  canvas.height = Math.max(1, Math.round(opts.height * dpr))
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.resolve(null)
  return new Promise((resolve) => {
    const img = new Image()
    img.addEventListener('load', () => {
      try {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        if (typeof canvas.toBlob === 'function') canvas.toBlob((b) => resolve(b), 'image/png')
        else resolve(null)
      } catch {
        resolve(null)
      }
    })
    img.addEventListener('error', () => resolve(null))
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`
  })
}

/** Trigger a browser download of a Blob (or string) under `filename`. No-op in SSR. */
export function download(content: Blob | string, filename: string): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) return
  const blob =
    typeof content === 'string' ? new Blob([content], { type: 'image/svg+xml' }) : content
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
