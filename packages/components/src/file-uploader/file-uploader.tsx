'use client'
import { cn, useId, useSignal, useSignals } from '@cascivo/core'
import { builtin, currentLocale, t } from '@cascivo/i18n'
import { useRef } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { Spinner } from '../spinner/spinner'
import styles from './file-uploader.module.css'

export interface UploaderFile {
  id: string
  name: string
  size?: number
  status: 'uploading' | 'complete' | 'error'
  errorMessage?: string
}

export interface FileUploaderLabels {
  label?: string
  drop?: string
  remove?: string
  uploading?: string
  complete?: string
  error?: string
}

export interface FileUploaderProps {
  /**
   * Controlled file list
   *
   * @defaultValue `[]`
   * @see the component manifest
   */
  files?: UploaderFile[]
  onFilesAdded?: (files: File[]) => void
  onRemove?: (id: string) => void
  /**
   * Allow multiple files
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  multiple?: boolean
  accept?: string
  maxSize?: number
  onRejected?: (files: File[], reason: 'size' | 'type') => void
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
  hint?: string
  labels?: FileUploaderLabels
  /**
   * Disables the upload zone
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  disabled?: boolean
  className?: string
}

function matchesAccept(file: File, accept: string): boolean {
  const patterns = accept
    .split(',')
    .map((pattern) => pattern.trim())
    .filter(Boolean)
  if (patterns.length === 0) return true
  return patterns.some((pattern) => {
    if (pattern.startsWith('.')) {
      return file.name.toLowerCase().endsWith(pattern.toLowerCase())
    }
    if (pattern.endsWith('/*')) {
      return file.type.startsWith(pattern.slice(0, -1))
    }
    return file.type === pattern
  })
}

/**
 * Byte size in the reader's locale. The unit strings and the decimal separator were both
 * hardcoded English before ("1.5 MB" reads wrong in every comma-decimal locale), which the
 * component checklist forbids. `Intl.NumberFormat`'s `unit` style supplies both.
 */
function formatSize(bytes: number, locale: string): string {
  const [value, unit] =
    bytes >= 1024 * 1024
      ? [bytes / (1024 * 1024), 'megabyte' as const]
      : bytes >= 1024
        ? [bytes / 1024, 'kilobyte' as const]
        : [bytes, 'byte' as const]
  try {
    return new Intl.NumberFormat(locale, {
      style: 'unit',
      unit,
      unitDisplay: 'short',
      maximumFractionDigits: unit === 'byte' ? 0 : 1,
    }).format(value)
  } catch {
    // `style: 'unit'` is widely supported but not universal; fall back to a plain number.
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: unit === 'byte' ? 0 : 1,
    }).format(value)
  }
}

/** One word describing the list as a whole, for the live region. */
function statusSummary(
  files: UploaderFile[],
  uploading: string,
  complete: string,
  error: string,
): string {
  if (files.some((f) => f.status === 'error')) return error
  if (files.some((f) => f.status === 'uploading')) return uploading
  return complete
}

export function FileUploader({
  files = [],
  onFilesAdded,
  onRemove,
  multiple = false,
  accept,
  maxSize,
  onRejected,
  label,
  ariaLabel,
  hint,
  labels,
  disabled = false,
  className,
}: FileUploaderProps) {
  useSignals()
  const locale = currentLocale()
  const inputRef = useRef<HTMLInputElement>(null)
  const dragOver = useSignal(false)

  const resolvedLabel = label ?? labels?.label ?? t(builtin.fileUploader.label)
  const resolvedDrop = labels?.drop ?? t(builtin.fileUploader.drop)
  const resolvedUploading = labels?.uploading ?? t(builtin.fileUploader.uploading)
  const resolvedComplete = labels?.complete ?? t(builtin.fileUploader.complete)
  const resolvedError = labels?.error ?? t(builtin.fileUploader.error)
  const resolveRemove = (name: string) =>
    labels?.remove
      ? labels.remove.replaceAll('{name}', name)
      : t(builtin.fileUploader.remove, { name })

  // useId, not a slug of the label: the default label is the same string for every instance,
  // so two uploaders on one page emitted duplicate ids and aria-describedby resolved to
  // whichever came first. A non-ASCII label also produced ids containing arbitrary characters.
  const baseId = useId('cascivo-uploader')
  const labelId = `${baseId}-label`
  const hintId = `${baseId}-hint`
  const statusId = `${baseId}-status`

  const processFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return
    const incoming = multiple ? Array.from(list) : Array.from(list).slice(0, 1)
    const accepted: File[] = []
    const typeRejected: File[] = []
    const sizeRejected: File[] = []
    for (const file of incoming) {
      if (accept && !matchesAccept(file, accept)) {
        typeRejected.push(file)
      } else if (maxSize !== undefined && file.size > maxSize) {
        sizeRejected.push(file)
      } else {
        accepted.push(file)
      }
    }
    if (typeRejected.length > 0) onRejected?.(typeRejected, 'type')
    if (sizeRejected.length > 0) onRejected?.(sizeRejected, 'size')
    if (accepted.length > 0) onFilesAdded?.(accepted)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files)
    e.target.value = ''
  }

  const handleDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault()
    dragOver.value = false
    if (disabled) return
    processFiles(e.dataTransfer.files)
  }

  return (
    <div className={cn(styles['uploader'], className)}>
      <span id={labelId} className={styles['label']}>
        {resolvedLabel}
      </span>
      <input
        ref={inputRef}
        type="file"
        className={styles['input']}
        tabIndex={-1}
        multiple={multiple}
        accept={accept}
        disabled={disabled}
        onChange={handleChange}
      />
      <button
        type="button"
        className={styles['zone']}
        data-state={dragOver.value ? 'dragover' : 'idle'}
        disabled={disabled}
        aria-labelledby={ariaLabel ? undefined : labelId}
        aria-label={ariaLabel}
        aria-describedby={hint ? hintId : undefined}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault()
          if (!disabled) dragOver.value = true
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) e.dataTransfer.dropEffect = 'copy'
        }}
        onDragLeave={(e) => {
          // dragleave fires on the zone every time the pointer crosses onto a descendant, so
          // the unguarded version dropped the drag-over state mid-drag. `.zoneText` is
          // pointer-events: none for the browsers that report a null relatedTarget here.
          if (!e.currentTarget.contains(e.relatedTarget as Node)) dragOver.value = false
        }}
        onDrop={handleDrop}
      >
        <span className={styles['zoneText']}>{resolvedDrop}</span>
      </button>
      {hint && (
        <span id={hintId} className={styles['hint']}>
          {hint}
        </span>
      )}
      {/* Mounted unconditionally: a live region added in the same commit as its first
          content announces nothing, which is why the first upload was always silent. */}
      <span id={statusId} className={styles['srOnly']} role="status" aria-live="polite">
        {files.length > 0
          ? t(builtin.fileUploader.status, {
              count: files.length,
              state: statusSummary(files, resolvedUploading, resolvedComplete, resolvedError),
            })
          : ''}
      </span>
      {files.length > 0 && (
        <ul className={styles['list']}>
          {files.map((file) => (
            <li key={file.id} className={styles['file']} data-state={file.status}>
              <span className={styles['status']}>
                {file.status === 'uploading' && <Spinner size="sm" label={resolvedUploading} />}
                {file.status === 'complete' && (
                  <span
                    className={styles['glyph-complete']}
                    role="img"
                    aria-label={resolvedComplete}
                  >
                    ✓
                  </span>
                )}
                {file.status === 'error' && (
                  <span className={styles['glyph-error']} role="img" aria-label={resolvedError}>
                    ✕
                  </span>
                )}
              </span>
              <span className={styles['name']}>{file.name}</span>
              {file.size !== undefined && (
                <span className={styles['size']}>{formatSize(file.size, locale)}</span>
              )}
              <button
                type="button"
                className={styles['remove']}
                aria-label={resolveRemove(file.name)}
                disabled={disabled}
                onClick={() => onRemove?.(file.id)}
              >
                ✕
              </button>
              {file.status === 'error' && file.errorMessage && (
                <span className={styles['error-message']} role="alert">
                  {file.errorMessage}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
