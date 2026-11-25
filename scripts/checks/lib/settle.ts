/**
 * Wait until a page holds no running CSS animation or transition, for the checks that measure
 * a state (axe, `getBoundingClientRect`) instead of a motion.
 *
 * Why it exists: the `cv-menu` panel (and every popover/dialog) fades with `opacity`. axe takes
 * the text colour through the panel's opacity, so a run that lands in the first ~30 % of the
 * fade reports a `color-contrast` violation that is not real (a fade at 10 % reproduces it
 * every time). That was the "flaky axe colour-contrast on `cv-menu`".
 *
 * One pass is not enough, and that was the race: a light dismiss (outside click, native Escape)
 * hides the popover first and flips `data-state` in the `toggle` event a task later, so the
 * exit fade *starts* after a single snapshot of `getAnimations()` has already come back empty.
 * So: wait for the snapshot, let one task and a frame pass, and repeat until a pass finds
 * nothing running.
 */
export async function settled(page: {
  evaluate: <R>(fn: () => Promise<R>) => Promise<R>
}): Promise<void> {
  const left = await page.evaluate(async () => {
    const task = () => new Promise<void>((r) => setTimeout(r, 0))
    const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()))
    for (let i = 0; i < 10; i++) {
      await task()
      await frame()
      const running = document.getAnimations()
      if (running.length === 0) return 0
      await Promise.all(running.map((a) => a.finished.catch(() => {})))
    }
    return document.getAnimations().length
  })
  if (left !== 0) throw new Error(`${left} animations still running after 10 settle passes`)
}
