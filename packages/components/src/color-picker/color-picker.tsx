'use client'
import { cn, useControllableSignal, useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { useId, useRef, type KeyboardEvent } from 'react'
import styles from './color-picker.module.css'

export interface ColorPickerLabels {
  hue?: string
  alpha?: string
  colorArea?: string
  eyedropper?: string
}

export interface ColorPickerProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  presets?: string[]
  alpha?: boolean
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  labels?: ColorPickerLabels
}

interface Rgb {
  r: number
  g: number
  b: number
  a: number
}

interface Hsl {
  h: number
  s: number
  l: number
  a: number
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function parseHex(hex: string): Rgb {
  let h = hex.trim().replace(/^#/, '')
  if (h.length === 3) h = h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]!
  if (h.length === 4) h = h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]! + h[3]! + h[3]!
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return { r: 0, g: 0, b: 0, a: 1 }
  return { r, g, b, a }
}

function toHex({ r, g, b, a }: Rgb, withAlpha: boolean): string {
  const part = (n: number): string => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0')
  const base = `#${part(r)}${part(g)}${part(b)}`
  if (!withAlpha || a >= 1) return base
  return base + part(a * 255)
}

function rgbToHsl({ r, g, b, a }: Rgb): Hsl {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const l = (max + min) / 2
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  return { h, s: s * 100, l: l * 100, a }
}

function hslToRgb({ h, s, l, a }: Hsl): Rgb {
  const sn = s / 100
  const ln = l / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = ln - c / 2
  let rn = 0
  let gn = 0
  let bn = 0
  if (h < 60) [rn, gn, bn] = [c, x, 0]
  else if (h < 120) [rn, gn, bn] = [x, c, 0]
  else if (h < 180) [rn, gn, bn] = [0, c, x]
  else if (h < 240) [rn, gn, bn] = [0, x, c]
  else if (h < 300) [rn, gn, bn] = [x, 0, c]
  else [rn, gn, bn] = [c, 0, x]
  return {
    r: (rn + m) * 255,
    g: (gn + m) * 255,
    b: (bn + m) * 255,
    a,
  }
}

interface EyeDropperResult {
  sRGBHex: string
}
interface EyeDropperCtor {
  new (): { open: () => Promise<EyeDropperResult> }
}

export function ColorPicker({
  value,
  defaultValue,
  onValueChange,
  presets,
  alpha = true,
  label,
  disabled,
  size = 'md',
  className,
  labels,
}: ColorPickerProps) {
  useSignals()
  const baseId = useId()
  const [color, setColor] = useControllableSignal<string>({
    value,
    defaultValue: defaultValue ?? '#3b82f6',
    onChange: onValueChange,
  })

  const areaRef = useRef<HTMLDivElement>(null)
  const dragging = useSignal(false)

  const hsl = rgbToHsl(parseHex(color.value))

  const commit = (next: Hsl): void => {
    setColor(toHex(hslToRgb(next), alpha))
  }

  const setFromPointer = (clientX: number, clientY: number): void => {
    const el = areaRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const sx = clamp((clientX - rect.left) / rect.width, 0, 1)
    const sy = clamp((clientY - rect.top) / rect.height, 0, 1)
    commit({ h: hsl.h, s: sx * 100, l: (1 - sy) * 100, a: hsl.a })
  }

  useSignalEffect(() => {
    if (!dragging.value) return
    const onMove = (e: PointerEvent): void => setFromPointer(e.clientX, e.clientY)
    const onUp = (): void => {
      dragging.value = false
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  })

  const onAreaKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    const step = e.shiftKey ? 10 : 2
    let { s, l } = hsl
    if (e.key === 'ArrowLeft') s -= step
    else if (e.key === 'ArrowRight') s += step
    else if (e.key === 'ArrowUp') l += step
    else if (e.key === 'ArrowDown') l -= step
    else return
    e.preventDefault()
    commit({ h: hsl.h, s: clamp(s, 0, 100), l: clamp(l, 0, 100), a: hsl.a })
  }

  const cyclePreset = (delta: number, current: number): void => {
    if (!presets || presets.length === 0) return
    const next = (current + delta + presets.length) % presets.length
    setColor(presets[next]!)
  }

  const eyeDropper =
    typeof window !== 'undefined'
      ? (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper
      : undefined

  const openEyeDropper = (): void => {
    if (!eyeDropper) return
    void new eyeDropper().open().then((res) => setColor(res.sRGBHex))
  }

  const resolved = {
    hue: labels?.hue ?? t(builtin.colorPicker.hue),
    alpha: labels?.alpha ?? t(builtin.colorPicker.alpha),
    colorArea: labels?.colorArea ?? t(builtin.colorPicker.colorArea),
    eyedropper: labels?.eyedropper ?? t(builtin.colorPicker.eyedropper),
  }

  const swatch = toHex(parseHex(color.value), false)
  const areaBg = `hsl(${hsl.h} 100% 50%)`

  return (
    <div
      className={cn(styles['picker'], className)}
      data-size={size}
      data-disabled={disabled || undefined}
    >
      {label && (
        <span className={styles['label']} id={`${baseId}-label`}>
          {label}
        </span>
      )}

      <div
        ref={areaRef}
        className={styles['area']}
        role="slider"
        aria-label={resolved.colorArea}
        aria-valuetext={swatch}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        style={{ background: areaBg }}
        onPointerDown={(e) => {
          if (disabled) return
          e.preventDefault()
          dragging.value = true
          setFromPointer(e.clientX, e.clientY)
        }}
        onKeyDown={onAreaKeyDown}
      >
        <span
          className={styles['thumb']}
          style={{
            insetInlineStart: `${hsl.s}%`,
            insetBlockStart: `${100 - hsl.l}%`,
            backgroundColor: swatch,
          }}
        />
      </div>

      <div className={styles['sliders']}>
        <label className={styles['srOnly']} htmlFor={`${baseId}-hue`}>
          {resolved.hue}
        </label>
        <input
          id={`${baseId}-hue`}
          className={styles['hue']}
          type="range"
          min={0}
          max={360}
          step={1}
          value={Math.round(hsl.h)}
          disabled={disabled}
          aria-label={resolved.hue}
          onChange={(e) => commit({ h: Number(e.target.value), s: hsl.s, l: hsl.l, a: hsl.a })}
        />

        {alpha && (
          <>
            <label className={styles['srOnly']} htmlFor={`${baseId}-alpha`}>
              {resolved.alpha}
            </label>
            <input
              id={`${baseId}-alpha`}
              className={styles['alpha']}
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={hsl.a}
              disabled={disabled}
              aria-label={resolved.alpha}
              style={{ '--cascivo-color-picker-solid': swatch } as Record<string, string>}
              onChange={(e) => commit({ h: hsl.h, s: hsl.s, l: hsl.l, a: Number(e.target.value) })}
            />
          </>
        )}
      </div>

      {presets && presets.length > 0 && (
        <div className={styles['presets']} role="group" aria-label={resolved.colorArea}>
          {presets.map((preset, i) => (
            <button
              key={preset}
              type="button"
              className={styles['preset']}
              style={{ backgroundColor: preset }}
              aria-label={preset}
              aria-pressed={preset.toLowerCase() === color.value.toLowerCase()}
              disabled={disabled}
              onClick={() => setColor(preset)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') {
                  e.preventDefault()
                  cyclePreset(1, i)
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault()
                  cyclePreset(-1, i)
                }
              }}
            />
          ))}
        </div>
      )}

      <div className={styles['row']}>
        <span
          className={styles['preview']}
          style={{ backgroundColor: color.value }}
          aria-hidden="true"
        />
        <input
          className={styles['text']}
          type="text"
          value={color.value}
          disabled={disabled}
          aria-label={label ?? resolved.colorArea}
          onChange={(e) => setColor(e.target.value)}
        />
        {eyeDropper && (
          <button
            type="button"
            className={styles['eyedropper']}
            aria-label={resolved.eyedropper}
            disabled={disabled}
            onClick={openEyeDropper}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="m2 22 1-1h3l9-9M3 21v-3l9-9m1.5 1.5-2-2M19 2l3 3-9 9-3-3z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
