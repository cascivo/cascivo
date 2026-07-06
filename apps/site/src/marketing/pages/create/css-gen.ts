import type { ThemeConfig } from './store'
import { configToCSS as kitConfigToCSS } from '@cascivo/theme-kit'

/**
 * The CSS generator lives in @cascivo/theme-kit (shared with the CLI). This thin
 * wrapper keeps the builder's boolean `previewMode` call sites unchanged.
 *
 * @param previewMode - when true, inlines the full base theme token set so the
 *   preview block is self-contained and independent of the landing page's global
 *   theme. The code-output tab omits these (users import the base theme themselves).
 */
export function configToCSS(config: ThemeConfig, previewMode = false): string {
  return kitConfigToCSS(config, { previewMode })
}

export function highlightCSS(css: string): string {
  return css
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\/)/g, '<span class="css-comment">$1</span>')
    .replace(/(--[\w-]+)(?=\s*:)/g, '<span class="css-prop">$1</span>')
    .replace(/:\s*([^;{}\n]+)/g, ': <span class="css-value">$1</span>')
}
