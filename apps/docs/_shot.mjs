import { chromium } from '@playwright/test'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const p = await b.newPage({ viewport: { width: 1280, height: 800 } })
await p.goto('http://localhost:4191/', { waitUntil: 'networkidle' })
await p.waitForTimeout(900)
const info = await p.evaluate(() => {
  const header = document.querySelector('[role="banner"], .landing-shell-header, header')
  const bg = document.querySelector('.bg-field')
  const hr = header?.getBoundingClientRect()
  const br = bg ? getComputedStyle(bg) : null
  return {
    headerTop: Math.round(hr?.top ?? -1), headerHeight: Math.round(hr?.height ?? 0),
    bgPosition: br?.position, bgZIndex: br?.zIndex,
  }
})
console.log(JSON.stringify(info))
await p.screenshot({ path: '/tmp/claude-0/-home-user-cascivo/6d97cf93-150b-5817-a6bf-58f79b6cc5ce/scratchpad/home.png' })
await b.close()
