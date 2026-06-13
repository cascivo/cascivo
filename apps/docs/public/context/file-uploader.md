# FileUploader

**Category:** inputs  
**Description:** Drag-and-drop file upload zone with file list and status indicators.

## When to use

- Letting users attach one or more files via click-to-browse or drag-and-drop
- Showing per-file upload progress and status (uploading, complete, error) in a list
- Enforcing client-side accept/maxSize constraints with a callback for rejected files

## When NOT to use

- A single short text value — use Input
- Choosing from a fixed set of options rather than supplying a file — use Select or MultiSelect

## Anti-patterns

### The file list is controlled — without wiring files/onFilesAdded/onRemove nothing renders in the list and status cannot update

**Bad:** `Treating the component as uncontrolled and ignoring onFilesAdded`  
**Good:** `Track accepted files in state and pass them back via the files prop`  
**Why:** The file list is controlled — without wiring files/onFilesAdded/onRemove nothing renders in the list and status cannot update

### Client-side accept/maxSize are UX filters, not enforcement; a determined user can bypass them

**Bad:** `Relying only on accept/maxSize for security`  
**Good:** `Re-validate type and size on the server after upload`  
**Why:** Client-side accept/maxSize are UX filters, not enforcement; a determined user can bypass them

## Related components

- **Form** (pairs-with): Place the uploader inside a Form when files are part of a larger submission
- **Input** (alternative): Use a plain text Input when capturing a value rather than a file

## Accessibility rationale

The drop zone is a real <button> so it is keyboard-operable (Enter/Space open the native file picker), the hidden file input is removed from the tab order and labelled via aria-describedby, and the file list uses aria-live="polite" so status changes are announced; each remove control carries an aria-label naming its file.

## Props

| Name           | Type                            | Required         | Default | Description                             |
| -------------- | ------------------------------- | ---------------- | ------- | --------------------------------------- | -------------------------- |
| `files`        | `UploaderFile[]`                | No               | —       | Controlled file list                    |
| `onFilesAdded` | `(files: File[]) => void`       | No               | —       | Called with accepted files              |
| `onRemove`     | `(id: string) => void`          | No               | —       | Called when a file is removed           |
| `multiple`     | `boolean`                       | No               | —       | Allow multiple files                    |
| `accept`       | `string`                        | No               | —       | Accepted file types (MIME or extension) |
| `maxSize`      | `number`                        | No               | —       | Maximum file size in bytes              |
| `onRejected`   | `(files: File[], reason: 'size' | 'type') => void` | No      | —                                       | Called with rejected files |
| `label`        | `string`                        | No               | —       | Field label                             |
| `hint`         | `string`                        | No               | —       | Hint text below the drop zone           |
| `labels`       | `FileUploaderLabels`            | No               | —       | i18n label overrides                    |
| `disabled`     | `boolean`                       | No               | —       | Disables the upload zone                |

## Tokens

- `--cascade-color-accent`
- `--cascade-color-accent-subtle`
- `--cascade-color-success`
- `--cascade-color-danger`
- `--cascade-color-danger-subtle`

## Examples

### Basic

Single file upload zone

```jsx
<FileUploader onFilesAdded={console.log} />
```

### Multiple

Accept multiple files

```jsx
<FileUploader multiple onFilesAdded={console.log} />
```

### With files

Shows file list

```jsx
<FileUploader files={[{ id: '1', name: 'report.pdf', size: 102400, status: 'complete' }]} />
```

## Boundaries

| Area                         | Level    | Note                                                                       |
| ---------------------------- | -------- | -------------------------------------------------------------------------- |
| token names                  | strict   | Status colors must resolve to --cascade-color-accent/success/danger tokens |
| label and hint copy          | flexible | Overridable via label/hint props or the labels object                      |
| accept / maxSize constraints | flexible | Configure freely; rejected files surface through onRejected                |
