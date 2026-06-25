import { chromium } from '@playwright/test'
const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const p = await b.newPage({ viewport: { width: 1280, height: 800 } })
await p.goto('http://localhost:4192/docs/components/button', { waitUntil: 'networkidle' })
await p.waitForTimeout(900)
const info = await p.evaluate(() => {
  const header = document.querySelector('.landing-shell-header')
  const navLinks = [
    ...document.querySelectorAll('.landing-shell-header a, .landing-shell-header button'),
  ]
    .map((e) => e.textContent?.trim())
    .filter(Boolean)
    .slice(0, 8)
  const sidenav = document.querySelector('[class*="nav-content"], aside, nav')
  return { hasMarketingHeader: !!header, navSample: navLinks, hasSidenav: !!sidenav }
})
console.log(JSON.stringify(info))
await p.screenshot({
  path: '/tmp/claude-0/-home-user-cascivo/6d97cf93-150b-5817-a6bf-58f79b6cc5ce/scratchpad/docs.png',
})
await b.close()
