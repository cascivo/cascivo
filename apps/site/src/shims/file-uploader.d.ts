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
export declare function FileUploader(props: FileUploaderProps): JSX.Element
