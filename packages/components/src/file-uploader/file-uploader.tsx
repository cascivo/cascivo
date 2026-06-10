'use client'
import { cn, useSignal, useSignals } from '@cascade-ui/core'
import { builtin, t } from '@cascade-ui/i18n'
import { useRef, type ChangeEvent, type DragEvent } from 'react'
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
  files?: UploaderFile[]
  onFilesAdded?: (files: File[]) => void
  onRemove?: (id: string) => void
  multiple?: boolean
  accept?: string
  maxSize?: number
  onRejected?: (files: File[], reason: 'size' | 'type') => void
  label?: string
  hint?: string
  labels?: FileUploaderLabels
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

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
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
  hint,
  labels,
  disabled = false,
  className,
}: FileUploaderProps) {
  useSignals()
  const inputRef = useRef<HTMLInputElement>(null)
  const dragOver = useSignal(false)

  const resolvedLabel = label ?? labels?.label ?? t(builtin.fileUploader.label)
  const resolvedDrop = labels?.drop ?? t(builtin.fileUploader.drop)
  const resolvedUploading = labels?.uploading ?? t(builtin.fileUploader.uploading)
  const resolvedComplete = labels?.complete ?? t(builtin.fileUploader.complete)
  const resolvedError = labels?.error ?? t(builtin.fileUploader.error)
  const resolveRemove = (name: string) =>
    labels?.remove ? labels.remove.replace('{name}', name) : t(builtin.fileUploader.remove, { name })

  const baseId = `cascade-uploader-${resolvedLabel.toLowerCase().replace(/\s+/g, '-')}`
  const labelId = `${baseId}-label`
  const hintId = `${baseId}-hint`

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
        aria-hidden="true"
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
        aria-describedby={hint ? `${labelId} ${hintId}` : labelId}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault()
          if (!disabled) dragOver.value = true
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => {
          dragOver.value = false
        }}
        onDrop={handleDrop}
      >
        {resolvedDrop}
      </button>
      {hint && (
        <span id={hintId} className={styles['hint']}>
          {hint}
        </span>
      )}
      {files.length > 0 && (
        <ul className={styles['list']} aria-live="polite">
          {files.map((file) => (
            <li key={file.id} className={styles['file']} data-state={file.status}>
              <span className={styles['status']}>
                {file.status === 'uploading' && <Spinner size="sm" label={resolvedUploading} />}
                {file.status === 'complete' && (
                  <span className={styles['glyph-complete']} aria-label={resolvedComplete}>
                    ✓
                  </span>
                )}
                {file.status === 'error' && (
                  <span className={styles['glyph-error']} aria-label={resolvedError}>
                    ✕
                  </span>
                )}
              </span>
              <span className={styles['name']}>{file.name}</span>
              {file.size !== undefined && (
                <span className={styles['size']}>{formatSize(file.size)}</span>
              )}
              <button
                type="button"
                className={styles['remove']}
                aria-label={resolveRemove(file.name)}
                onClick={() => onRemove?.(file.id)}
              >
                ✕
              </button>
              {file.status === 'error' && file.errorMessage && (
                <span className={styles['error-message']}>{file.errorMessage}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
