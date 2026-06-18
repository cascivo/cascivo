import { signal } from '@cascivo/core'

/**
 * Home-page "peek" gimmick: when true, the blurred component backdrop sharpens
 * and the foreground content fades away, so a visitor can see the real
 * components behind the page. Toggled from the navbar (home only).
 */
export const peek = signal(false)
