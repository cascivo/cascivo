'use client'
import {
  cn,
  useControllableSignal,
  useRovingFocus,
  useSignal,
  useSignalEffect,
  useSignals,
} from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { useId, useRef } from 'react'
import { clamp, formatColor, hsvToRgb, parseColor, sameColor, toHex } from './color'
import type { ColorFormat, Hsv } from './color'
import styles from './color-picker.module.css'

export type { ColorFormat } from './color'

export interface ColorPickerLabels {
  hue?: string
  /** Accessible name for the alpha slider. */
  alpha?: string
  colorArea?: string
  saturation?: string
  brightness?: string
  eyedropper?: string
  presets?: string
  hex?: string
}

export interface ColorPickerProps {
  /**
   * Wired automatically by a wrapping `Field` — its label id. Forwarded to the text input so
   * the Field's label names it; the built-in fallback name is then not applied.
   */
  'aria-labelledby'?: string
  /**
   * Wired automatically by a wrapping `Field` — the ids of its hint/error text. Forwarded to
   * the text input so the supporting text is announced, not just displayed.
   */
  'aria-describedby'?: string
  /** Wired automatically by a wrapping `Field` when it is in an error state. */
  'aria-invalid'?: boolean
  /** Id for the focusable text input. `Field` supplies this automatically. */
  id?: string
  value?: string
  /**
   * The initial value when uncontrolled.
   *
   * @defaultValue `#3b82f6`
   * @see the component manifest
   */
  defaultValue?: string
  onValueChange?: (value: string) => void
  presets?: string[]
  /**
   * When true, enables alpha (opacity) selection.
   *
   * @defaultValue `true`
   * @see the component manifest
   */
  alpha?: boolean
  /**
   * Notation for the emitted value. Alpha is included whenever `alpha` is on, so the width
   * of the emitted string is stable.
   *
   * @defaultValue `'hex'`
   * @see the component manifest
   */
  format?: ColorFormat
  label?: string
  /**
   * Invisible accessible name, for when a visible element outside this component already
   * labels it and `label` would render that text a second time.
   *
   * `label` on this component is **visible**. `IconButton.label` and `Sparkline.label` are
   * invisible names, so an adopter arriving with that prior writes `label` here and gets the
   * text twice (2026-08-22 report item 13). Both props are listed side by side, each saying
   * which it is.
   */
  ariaLabel?: string
  /**
   * When true, disables the control and removes it from the tab order.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  disabled?: boolean
  /** Submitted with a surrounding form — a hidden input carrying the current value. */
  name?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  labels?: ColorPickerLabels
}

interface EyeDropperResult {
  sRGBHex: string
}
interface EyeDropperCtor {
  new (): { open: () => Promise<EyeDropperResult> }
}

const DEFAULT_COLOR = '#3b82f6'

export function ColorPicker({
  id,
  value,
  defaultValue,
  onValueChange,
  presets,
  alpha = true,
  format = 'hex',
  label,
  ariaLabel,
  disabled = false,
  name,
  size = 'md',
  className,
  labels,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: ColorPickerProps) {
  useSignals()
  const baseId = useId()
  const inputId = id ?? `${baseId}-hex`
  const areaRef = useRef<HTMLDivElement>(null)
  const dragging = useSignal(false)

  const [color, setColor] = useControllableSignal<string>({
    value,
    defaultValue: defaultValue ?? DEFAULT_COLOR,
    onChange: onValueChange,
  })

  /**
   * HSV is the stored state, not hex. Hex is 8-bit, so hue→hex→hue loses precision on every
   * nudge and repeated arrow presses bleed saturation away. The prop only re-seeds this when
   * it names a different colour, so the component's own edits are never round-tripped.
   */
  const hsv = useSignal<Hsv>(parseColor(color.peek()) ?? { h: 217, s: 76, v: 96, a: 1 })
  const lastEmitted = useRef<string>(color.peek())
  const current = color.value
  if (current !== lastEmitted.current && !sameColor(current, lastEmitted.current)) {
    const parsed = parseColor(current)
    if (parsed) hsv.value = parsed
    lastEmitted.current = current
  }

  const hsvValue = hsv.value
  const swatch = formatColor(hsvValue, format, alpha)
  const opaqueHex = toHex(hsvToRgb({ ...hsvValue, a: 1 }), false)
  const hueHex = toHex(hsvToRgb({ h: hsvValue.h, s: 100, v: 100, a: 1 }), false)

  const resolved = {
    hue: labels?.hue ?? t(builtin.colorPicker.hue),
    alpha: labels?.alpha ?? t(builtin.colorPicker.alpha),
    colorArea: labels?.colorArea ?? t(builtin.colorPicker.colorArea),
    saturation: labels?.saturation ?? t(builtin.colorPicker.saturation),
    brightness: labels?.brightness ?? t(builtin.colorPicker.brightness),
    eyedropper: labels?.eyedropper ?? t(builtin.colorPicker.eyedropper),
    presets: labels?.presets ?? t(builtin.colorPicker.presets),
    hex: labels?.hex ?? t(builtin.colorPicker.hex),
  }

  function commit(next: Hsv): void {
    hsv.value = next
    const out = formatColor(next, format, alpha)
    lastEmitted.current = out
    setColor(out)
  }

  function setFromPointer(clientX: number, clientY: number): void {
    const el = areaRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const sx = clamp((clientX - rect.left) / rect.width, 0, 1)
    const sy = clamp((clientY - rect.top) / rect.height, 0, 1)
    // x is saturation, y is value — matching the gradient the area actually paints.
    commit({ ...hsv.peek(), s: sx * 100, v: (1 - sy) * 100 })
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

  /**
   * Read on the client only. Reading `window.EyeDropper` during render made the server emit
   * no button and the first client render emit one, which is a hydration mismatch on a
   * component that is server-rendered despite `clientJs: 'required'`.
   */
  const hasEyeDropper = useSignal(false)
  useSignalEffect(() => {
    hasEyeDropper.value =
      typeof window !== 'undefined' &&
      typeof (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper === 'function'
  })

  async function pickFromScreen(): Promise<void> {
    const ctor = (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper
    if (!ctor) return
    try {
      const result = await new ctor().open()
      const parsed = parseColor(result.sRGBHex)
      if (parsed) commit({ ...parsed, a: hsv.peek().a })
    } catch {
      // The user dismissed the picker; nothing to do.
    }
  }

  // The hex field keeps its own draft so a half-typed value never reaches onValueChange.
  // The old build called setColor on every keystroke, and an unparseable prefix fell back to
  // black, so the area and thumb thrashed while the user typed.
  const draft = useSignal<string | null>(null)
  const hexText = draft.value ?? (format === 'hex' ? swatch : toHex(hsvToRgb(hsvValue), alpha))

  function commitDraft(): void {
    const text = draft.peek()
    draft.value = null
    if (text === null) return
    const parsed = parseColor(text)
    if (parsed) commit(alpha ? parsed : { ...parsed, a: 1 })
  }

  const presetList = presets ?? []
  const roving = useRovingFocus({ orientation: 'horizontal', loop: true })

  return (
    <div
      className={cn(styles['wrapper'], className)}
      data-size={size}
      data-disabled={disabled || undefined}
    >
      {label && (
        <label className={styles['label']} htmlFor={inputId}>
          {label}
        </label>
      )}

      {/* Two real range inputs carry the slider semantics for the two axes. A single
          role="slider" cannot describe a 2-D area — the old one had no aria-valuenow at all,
          which is an invalid slider — and the native inputs bring Home/End/PageUp/PageDown
          and arrow stepping with them instead of a hand-rolled key switch. */}
      <div
        ref={areaRef}
        role="group"
        aria-label={resolved.colorArea}
        className={styles['area']}
        style={{ background: hueHex }}
        onPointerDown={(e) => {
          if (disabled) return
          e.preventDefault()
          dragging.value = true
          setFromPointer(e.clientX, e.clientY)
        }}
      >
        <input
          type="range"
          className={styles['axis']}
          aria-label={resolved.saturation}
          min={0}
          max={100}
          step={1}
          value={Math.round(hsvValue.s)}
          disabled={disabled}
          aria-valuetext={`${Math.round(hsvValue.s)}%`}
          onChange={(e) => commit({ ...hsv.peek(), s: Number(e.currentTarget.value) })}
        />
        <input
          type="range"
          className={styles['axis']}
          aria-label={resolved.brightness}
          min={0}
          max={100}
          step={1}
          value={Math.round(hsvValue.v)}
          disabled={disabled}
          aria-valuetext={`${Math.round(hsvValue.v)}%`}
          onChange={(e) => commit({ ...hsv.peek(), v: Number(e.currentTarget.value) })}
        />
        <span
          className={styles['thumb']}
          style={{
            insetInlineStart: `${hsvValue.s}%`,
            insetBlockStart: `${100 - hsvValue.v}%`,
            backgroundColor: opaqueHex,
          }}
          aria-hidden="true"
        />
      </div>

      <div className={styles['sliders']}>
        <input
          type="range"
          className={cn(styles['slider'], styles['hue'])}
          aria-label={resolved.hue}
          min={0}
          max={360}
          step={1}
          value={Math.round(hsvValue.h)}
          disabled={disabled}
          onChange={(e) => commit({ ...hsv.peek(), h: Number(e.currentTarget.value) })}
        />
        {alpha && (
          <input
            type="range"
            className={cn(styles['slider'], styles['alpha'])}
            aria-label={resolved.alpha}
            min={0}
            max={100}
            step={1}
            value={Math.round(hsvValue.a * 100)}
            disabled={disabled}
            aria-valuetext={`${Math.round(hsvValue.a * 100)}%`}
            style={{ '--cascivo-color-picker-alpha-to': opaqueHex } as React.CSSProperties}
            onChange={(e) => commit({ ...hsv.peek(), a: Number(e.currentTarget.value) / 100 })}
          />
        )}
      </div>

      <div className={styles['row']}>
        <span
          className={styles['preview']}
          style={{ backgroundColor: swatch }}
          aria-hidden="true"
        />
        <input
          id={inputId}
          type="text"
          className={styles['hex']}
          value={hexText}
          disabled={disabled}
          spellCheck={false}
          autoComplete="off"
          // aria-labelledby from a Field outranks a name of our own; only fall back when the
          // Field has not supplied one.
          aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? resolved.hex)}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          onChange={(e) => {
            draft.value = e.currentTarget.value
          }}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commitDraft()
            } else if (e.key === 'Escape') {
              draft.value = null
            }
          }}
        />
        {hasEyeDropper.value && (
          <button
            type="button"
            className={styles['eyedropper']}
            aria-label={resolved.eyedropper}
            disabled={disabled}
            onClick={() => void pickFromScreen()}
          >
            <span className={styles['eyedropperGlyph']} aria-hidden="true" />
          </button>
        )}
      </div>

      {presetList.length > 0 && (
        <div role="group" aria-label={resolved.presets} className={styles['presets']}>
          {presetList.map((preset, i) => {
            const itemProps = roving.getItemProps(i)
            const selected = sameColor(preset, swatch)
            return (
              <button
                key={preset}
                ref={itemProps.ref as (el: HTMLButtonElement | null) => void}
                type="button"
                className={styles['preset']}
                style={{ backgroundColor: preset }}
                aria-label={preset}
                aria-pressed={selected}
                disabled={disabled}
                // Arrows move focus between swatches; they used to change the value instead,
                // which is the inverse of what a group of buttons should do.
                tabIndex={itemProps.tabIndex}
                onKeyDown={itemProps.onKeyDown}
                onFocus={itemProps.onFocus}
                onClick={() => {
                  const parsed = parseColor(preset)
                  if (parsed) commit(alpha ? parsed : { ...parsed, a: 1 })
                }}
              />
            )
          })}
        </div>
      )}

      {name !== undefined && <input type="hidden" name={name} value={swatch} />}

      {/* Mounted unconditionally so the first change is announced too. */}
      <span className={styles['srOnly']} role="status" aria-live="polite">
        {t(builtin.colorPicker.value, { color: swatch })}
      </span>
    </div>
  )
}
