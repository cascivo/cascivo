import type { UploaderFile } from '@cascivo/react'
import {
  Card,
  CardContent,
  FileUploader,
  Flex,
  Heading,
  ProgressBar,
  Text,
  useSignals,
} from '@cascivo/react'
import { formatBytes } from '@cascivo/app/uploads'
import { addFiles, inFlight, refresh, removeUpload, stored } from '../files'
import { uploads } from '../upload-policy'
import styles from '../files.module.css'

void refresh()

export default function Files() {
  useSignals()
  const files: UploaderFile[] = inFlight.value.map((upload) => ({
    id: upload.id,
    name: upload.name,
    size: upload.size,
    status: upload.status.value === 'done' ? 'complete' : upload.status.value,
    ...(upload.error.value ? { errorMessage: upload.error.value } : {}),
  }))

  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Files</Heading>
        <Text muted>
          Uploads go through the Worker into R2: up to {formatBytes(uploads.maxBytes)} each, large
          files in parts. Images get resized previews from Cloudflare Images.
        </Text>
      </Flex>
      <FileUploader
        multiple
        accept={uploads.types.join(',')}
        maxSize={uploads.maxBytes}
        files={files}
        onFilesAdded={addFiles}
        onRemove={removeUpload}
      />
      {inFlight.value
        .filter((upload) => upload.status.value === 'uploading')
        .map((upload) => (
          <ProgressBar
            key={upload.id}
            value={Math.round(upload.progress.value * 100)}
            label={upload.name}
          />
        ))}
      <div className={styles['grid']}>
        {stored.value.map((file) => (
          <Card key={file.key}>
            <CardContent>
              <Flex gap={2}>
                {file.type.startsWith('image/') ? (
                  <img
                    className={styles['preview']}
                    src={`${uploads.path}/${file.key}?w=320`}
                    alt={file.name}
                    loading="lazy"
                  />
                ) : null}
                <a href={`${uploads.path}/${file.key}`} target="_blank" rel="noreferrer">
                  {file.name}
                </a>
                <Text size="sm" muted>
                  {formatBytes(file.size)}
                </Text>
              </Flex>
            </CardContent>
          </Card>
        ))}
      </div>
    </Flex>
  )
}
