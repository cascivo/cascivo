'use client'
import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { Button } from '@cascivo/components/button'
import { Select } from '@cascivo/components/select'
import { config, DEFAULT_CONFIG, RADIUS_STOPS, RADIUS_LABELS } from './store'
import type { FontFamily, RadiusStop } from './store'
import { PRESETS } from './presets'
import { hexToOklch, oklchToHex } from './color-utils'

const FONT_OPTIONS: { value: FontFamily; label: string }[] = [
  { value: 'system', label: 'System (default)' },
  { value: 'geometric', label: 'Geometric sans' },
  { value: 'humanist', label: 'Humanist sans' },
  { value: 'transitional', label: 'Transitional serif-adjacent' },
  { value: 'mono', label: 'Monospace' },
]

// Lightness used when converting OKLCH↔hex for display/input.
const DISPLAY_L = 0.65

export function ControlPanel() {
  useSignals()
  const current = config.value

  // Local draft for the hex text input — allows partial typing without resetting.
  const hexDraft = useSignal(oklchToHex(DISPLAY_L, current.accentChroma, current.accentHue))

  // Keep draft in sync when config changes externally (preset, slider, URL load).
  useSignalEffect(() => {
    const c = config.value
    hexDraft.value = oklchToHex(DISPLAY_L, c.accentChroma, c.accentHue)
  })

  function applyPreset(id: string) {
    const preset = PRESETS.find((p) => p.id === id)
    if (preset) config.value = preset.config
  }

  function applyHex(hex: string) {
    const parsed = hexToOklch(hex)
    if (!parsed) return
    config.value = {
      ...config.value,
      accentHue: Math.round(parsed.hue),
      accentChroma: Math.max(0.05, Math.min(0.3, parsed.chroma)),
      presetId: null,
    }
  }

  return (
    <div className="ctrl-panel">
      {/* Preset tiles */}
      <section className="ctrl-section">
        <h3 className="ctrl-label">Presets</h3>
        <div className="ctrl-presets" role="listbox" aria-label="Theme presets">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="ctrl-preset-tile"
              role="option"
              aria-selected={current.presetId === preset.id}
              data-state={current.presetId === preset.id ? 'active' : undefined}
              onClick={() => applyPreset(preset.id)}
            >
              <span
                className="ctrl-preset-swatch"
                style={
                  {
                    '--swatch-bg': preset.swatchBg,
                    '--swatch-accent': preset.swatchAccent,
                  } as React.CSSProperties
                }
                aria-hidden="true"
              />
              <span className="ctrl-preset-label">{preset.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Base mode */}
      <section className="ctrl-section">
        <h3 className="ctrl-label">Mode</h3>
        <div className="ctrl-mode-row">
          <button
            type="button"
            className="ctrl-mode-btn"
            aria-pressed={current.baseMode === 'light'}
            data-state={current.baseMode === 'light' ? 'active' : undefined}
            onClick={() => (config.value = { ...current, baseMode: 'light', presetId: null })}
          >
            Light
          </button>
          <button
            type="button"
            className="ctrl-mode-btn"
            aria-pressed={current.baseMode === 'dark'}
            data-state={current.baseMode === 'dark' ? 'active' : undefined}
            onClick={() => (config.value = { ...current, baseMode: 'dark', presetId: null })}
          >
            Dark
          </button>
        </div>
      </section>

      {/* Accent color */}
      <section className="ctrl-section">
        <h3 className="ctrl-label">Accent colour</h3>

        {/* Hex colour picker */}
        <div className="ctrl-hex-row">
          <input
            type="color"
            className="ctrl-hex-picker"
            value={oklchToHex(DISPLAY_L, current.accentChroma, current.accentHue)}
            onChange={(e) => applyHex(e.target.value)}
            aria-label="Pick accent colour"
          />
          <input
            type="text"
            className="ctrl-hex-text"
            value={hexDraft.value}
            onChange={(e) => {
              hexDraft.value = e.target.value
              applyHex(e.target.value)
            }}
            placeholder="#3b82f6"
            aria-label="Hex colour value"
            maxLength={7}
            spellCheck={false}
          />
        </div>

        {/* Hue slider */}
        <div className="ctrl-slider-row">
          <label className="ctrl-slider-label" htmlFor="ctrl-hue">
            Hue
          </label>
          <div className="ctrl-slider-track ctrl-slider-track--hue">
            <input
              id="ctrl-hue"
              type="range"
              min={0}
              max={360}
              step={1}
              value={current.accentHue}
              onChange={(e) =>
                (config.value = { ...current, accentHue: Number(e.target.value), presetId: null })
              }
            />
          </div>
          <span
            className="ctrl-swatch-circle"
            style={{
              background: `oklch(${DISPLAY_L} ${current.accentChroma.toFixed(3)} ${current.accentHue})`,
            }}
            aria-hidden="true"
          />
        </div>

        {/* Chroma slider */}
        <div className="ctrl-slider-row">
          <label className="ctrl-slider-label" htmlFor="ctrl-chroma">
            Chroma
          </label>
          <div
            className="ctrl-slider-track ctrl-slider-track--chroma"
            style={{ '--slider-hue': current.accentHue } as React.CSSProperties}
          >
            <input
              id="ctrl-chroma"
              type="range"
              min={0.05}
              max={0.3}
              step={0.01}
              value={current.accentChroma}
              onChange={(e) =>
                (config.value = {
                  ...current,
                  accentChroma: Number(e.target.value),
                  presetId: null,
                })
              }
            />
          </div>
          <span
            className="ctrl-swatch-circle"
            aria-hidden="true"
            style={{
              background: `oklch(${DISPLAY_L} ${current.accentChroma.toFixed(3)} ${current.accentHue})`,
            }}
          />
        </div>
      </section>

      {/* Radius */}
      <section className="ctrl-section">
        <h3 className="ctrl-label">Border radius</h3>
        <div className="ctrl-radius-track">
          <input
            type="range"
            min={0}
            max={RADIUS_STOPS.length - 1}
            step={1}
            value={RADIUS_STOPS.indexOf(current.radiusBase)}
            onChange={(e) => {
              const stop = RADIUS_STOPS[Number(e.target.value)] as RadiusStop
              config.value = { ...current, radiusBase: stop, presetId: null }
            }}
            aria-label="Border radius"
            aria-valuetext={RADIUS_LABELS[current.radiusBase]}
          />
          <div className="ctrl-radius-ticks" aria-hidden="true">
            {RADIUS_STOPS.map((stop) => (
              <span key={stop} className="ctrl-radius-tick">
                {RADIUS_LABELS[stop]}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Font */}
      <section className="ctrl-section">
        <h3 className="ctrl-label">Font family</h3>
        <Select
          label="Font"
          value={current.fontFamily}
          options={FONT_OPTIONS}
          onChange={(e) =>
            (config.value = {
              ...current,
              fontFamily: (e as React.ChangeEvent<HTMLSelectElement>).target.value as FontFamily,
              presetId: null,
            })
          }
        />
      </section>

      {/* Reset */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          config.value = DEFAULT_CONFIG
        }}
        className="ctrl-reset"
      >
        Reset to default
      </Button>
    </div>
  )
}
