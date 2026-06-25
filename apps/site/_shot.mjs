import { chromium } from '@playwright/test'
const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const p = await b.newPage({ viewport: { width: 1280, height: 800 } })
await p.goto('http://localhost:4194/docs', { waitUntil: 'networkidle' })
await p.waitForTimeout(700)
const info = await p.evaluate(() => {
  const buttons = [...document.querySelectorAll('.landing-shell-header button')]
  const hamburger = buttons.find((b) => b.querySelector('svg path[d^="M2 4h12"]'))
  return { totalHeaderButtons: buttons.length, hamburgerPresent: !!hamburger }
})
console.log('DESKTOP /docs:', JSON.stringify(info))
await p.screenshot({
  path: '/tmp/claude-0/-home-user-cascivo/6d97cf93-150b-5817-a6bf-58f79b6cc5ce/scratchpad/docs2.png',
})
await b.close()
