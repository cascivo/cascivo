'use client'
import { builtin, t } from '@cascivo/i18n'

export interface ToolboxOptions {
  /** Export the chart as a PNG (default true). */
  png?: boolean
  /** Export the chart as a standalone SVG (default true). */
  svg?: boolean
  /** Toggle a readable data `<table>` (default true). */
  dataView?: boolean
  /** Reset zoom / visualMap / legend filters (default true). */
  restore?: boolean
}

export interface ToolboxProps {
  options: ToolboxOptions
  onPng: () => void
  onSvg: () => void
  onToggleData: () => void
  onRestore: () => void
  showData: boolean
}

const btnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minBlockSize: 'var(--cascivo-target-min-coarse, 1.75rem)',
  minInlineSize: '1.75rem',
  padding: '0.2rem 0.5rem',
  fontSize: '0.75rem',
  lineHeight: 1.2,
  borderRadius: '0.375rem',
  border: '1px solid var(--cascivo-chart-grid, currentColor)',
  background: 'var(--cascivo-color-background, white)',
  color: 'var(--cascivo-color-foreground, inherit)',
  cursor: 'pointer',
}

/**
 * The chart's utility belt — real `<button>`s (keyboard + focus-visible, ≥44px under
 * coarse pointers) to export a PNG/SVG, toggle a data-view table, and restore the
 * default view. Rendered in the chart's corner by `ChartFrame`.
 */
export function Toolbox({
  options,
  onPng,
  onSvg,
  onToggleData,
  onRestore,
  showData,
}: ToolboxProps) {
  const o = options
  return (
    <div role="group" aria-label="Chart toolbox" style={{ display: 'inline-flex', gap: '0.25rem' }}>
      {o.png !== false && (
        <button type="button" style={btnStyle} onClick={onPng}>
          {t(builtin.charts.exportPng)}
        </button>
      )}
      {o.svg !== false && (
        <button type="button" style={btnStyle} onClick={onSvg}>
          {t(builtin.charts.exportSvg)}
        </button>
      )}
      {o.dataView !== false && (
        <button type="button" style={btnStyle} aria-pressed={showData} onClick={onToggleData}>
          {t(builtin.charts.dataView)}
        </button>
      )}
      {o.restore !== false && (
        <button type="button" style={btnStyle} onClick={onRestore}>
          {t(builtin.charts.restore)}
        </button>
      )}
    </div>
  )
}
