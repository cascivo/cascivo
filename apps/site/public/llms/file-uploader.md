# FileUploader

Drag-and-drop file upload zone with file list and status indicators.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add file-uploader
```

Or use it from the prebuilt package without copying:

```tsx
import { FileUploader } from '@cascivo/react'
```

## Category

`inputs`

## States

- `idle`
- `dragover`
- `uploading`
- `complete`
- `error`
- `disabled`

## Props

| Prop           | Type                                                | Required | Default | Description                             |
| -------------- | --------------------------------------------------- | -------- | ------- | --------------------------------------- |
| `files`        | `UploaderFile[]`                                    | no       | —       | Controlled file list                    |
| `onFilesAdded` | `(files: File[]) => void`                           | no       | —       | Called with accepted files              |
| `onRemove`     | `(id: string) => void`                              | no       | —       | Called when a file is removed           |
| `multiple`     | `boolean`                                           | no       | —       | Allow multiple files                    |
| `accept`       | `string`                                            | no       | —       | Accepted file types (MIME or extension) |
| `maxSize`      | `number`                                            | no       | —       | Maximum file size in bytes              |
| `onRejected`   | `(files: File[], reason: 'size' \| 'type') => void` | no       | —       | Called with rejected files              |
| `label`        | `string`                                            | no       | —       | Field label                             |
| `hint`         | `string`                                            | no       | —       | Hint text below the drop zone           |
| `labels`       | `FileUploaderLabels`                                | no       | —       | i18n label overrides                    |
| `disabled`     | `boolean`                                           | no       | —       | Disables the upload zone                |

## Examples

### Basic

Single file upload zone

```tsx
<FileUploader onFilesAdded={console.log} />
```

### Multiple

Accept multiple files

```tsx
<FileUploader multiple onFilesAdded={console.log} />
```

### With files

Shows file list

```tsx
<FileUploader files={[{ id: '1', name: 'report.pdf', size: 102400, status: 'complete' }]} />
```

## Design tokens

- `--cascivo-color-accent`
- `--cascivo-color-accent-subtle`
- `--cascivo-color-success`
- `--cascivo-color-danger`
- `--cascivo-color-danger-subtle`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `button`
- **Keyboard:** Enter, Space

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

upload, file, drop, drag, input, form

---

_Generated from registry v0.10.0 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
