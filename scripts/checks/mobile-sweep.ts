/**
 * Reusable mobile-overflow + touch-target assertions for Playwright tests.
 * Mirrors apps/landing/test/mobile.spec.ts patterns.
 */
import type { Page } from '@playwright/test'

export const MOBILE_WIDTHS = [320, 360, 390, 414] as const

/**
 * Assert zero horizontal overflow at the given viewport widths.
 * Sets viewport size, waits for layout, checks scrollWidth <= innerWidth.
 */
export async function assertNoOverflow(page: Page, widths: readonly number[] = MOBILE_WIDTHS): Promise<void> {
  for (const width of widths) {
    await page.setViewportSize({ width, height: 812 })
    // wait for layout settle
    await page.waitForTimeout(100)
    const overflows = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
    }))
    if (overflows.overflow) {
      throw new Error(`Horizontal overflow at ${width}px: scrollWidth=${overflows.scrollWidth} > innerWidth=${overflows.innerWidth}`)
    }
  }
}

/**
 * Assert all interactive elements matched by selector have a rendered hit area >= 44px
 * on a coarse-pointer (touch) context. Call this with a Playwright context that has
 * hasTouch: true, isMobile: true so @media (pointer: coarse) rules apply.
 *
 * NOTE: This uses getBoundingClientRect which reflects the visual box. If your component
 * uses padding/pseudo-element hit-area expansion, this may undercount. Adjust selector
 * to match the actual hit area element.
 */
export async function assertTapTargets(page: Page, selector: string, minPx = 44): Promise<void> {
  // 44px = WCAG 2.5.5 minimum touch target / --cascivo-target-min-coarse: 2.75rem * 16px
  const MIN_PX = minPx
  const elements = await page.locator(selector).all()
  const failures: string[] = []
  for (const el of elements) {
    const box = await el.boundingBox()
    if (!box) continue
    const effective = Math.min(box.width, box.height)
    if (effective < MIN_PX) {
      const text = await el.textContent().catch(() => '?')
      failures.push(`  ${selector} "${(text ?? '').trim().slice(0, 30)}": ${effective.toFixed(1)}px < ${MIN_PX}px`)
    }
  }
  if (failures.length > 0) {
    throw new Error(`Tap targets below ${MIN_PX}px (coarse pointer):\n${failures.join('\n')}`)
  }
}
