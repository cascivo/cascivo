// Pixel-compare two sets of home screenshots written by measure-home.mjs (same file names),
// in the browser (canvas) so no image library is needed. A pixel differs when any RGB channel
// differs by more than TOLERANCE; the ratio is over the overlapping area, and the height delta
// is reported separately. Writes diff-<name>.png (differing pixels in red) and compare.json.
//
//   node apps/site/scripts/compare-home.mjs <baseline-dir> <candidate-dir> <out-dir>
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const [a, b, outDir] = process.argv.slice(2)
if (!a || !b || !outDir) throw new Error('usage: compare-home.mjs <baseline> <candidate> <out>')
mkdirSync(outDir, { recursive: true })
const TOLERANCE = 24

const browser = await chromium.launch(
  process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
)
const page = await browser.newPage()
const results = []
for (const name of readdirSync(a).filter((f) => f.endsWith('.png') && !f.startsWith('diff-'))) {
  const url = (dir) => `data:image/png;base64,${readFileSync(join(dir, name)).toString('base64')}`
  const r = await page.evaluate(
    async ({ ua, ub, tol }) => {
      const load = (src) =>
        new Promise((res, rej) => {
          const i = new Image()
          i.onload = () => res(i)
          i.onerror = rej
          i.src = src
        })
      const [ia, ib] = await Promise.all([load(ua), load(ub)])
      const w = Math.min(ia.width, ib.width)
      const h = Math.min(ia.height, ib.height)
      const px = (img) => {
        const c = new OffscreenCanvas(w, h)
        const x = c.getContext('2d')
        x.drawImage(img, 0, 0)
        return x.getImageData(0, 0, w, h)
      }
      const da = px(ia)
      const db = px(ib)
      const out = new ImageData(w, h)
      let diff = 0
      for (let i = 0; i < da.data.length; i += 4) {
        const d =
          Math.abs(da.data[i] - db.data[i]) > tol ||
          Math.abs(da.data[i + 1] - db.data[i + 1]) > tol ||
          Math.abs(da.data[i + 2] - db.data[i + 2]) > tol
        if (d) diff++
        out.data[i] = d ? 255 : da.data[i] * 0.3 + 160
        out.data[i + 1] = d ? 0 : da.data[i + 1] * 0.3 + 160
        out.data[i + 2] = d ? 0 : da.data[i + 2] * 0.3 + 160
        out.data[i + 3] = 255
      }
      const c = new OffscreenCanvas(w, h)
      c.getContext('2d').putImageData(out, 0, 0)
      const blob = await c.convertToBlob({ type: 'image/png' })
      const buf = new Uint8Array(await blob.arrayBuffer())
      let bin = ''
      for (let i = 0; i < buf.length; i += 0x8000)
        bin += String.fromCharCode(...buf.subarray(i, i + 0x8000))
      return {
        width: w,
        heightA: ia.height,
        heightB: ib.height,
        diffRatio: diff / (w * h),
        png: btoa(bin),
      }
    },
    { ua: url(a), ub: url(b), tol: TOLERANCE },
  )
  writeFileSync(join(outDir, `diff-${name}`), Buffer.from(r.png, 'base64'))
  delete r.png
  results.push({ name, ...r })
}
await browser.close()
writeFileSync(
  join(outDir, 'compare.json'),
  JSON.stringify({ tolerance: TOLERANCE, results }, null, 2),
)
for (const r of results)
  console.log(
    `${r.name}: ${(r.diffRatio * 100).toFixed(2)}% pixels differ, height ${r.heightA} → ${r.heightB}`,
  )
