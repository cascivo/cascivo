import type { Meta, StoryObj } from '@storybook/react-vite'
import { FileUploader } from '@cascivo/components/file-uploader'

const meta: Meta<typeof FileUploader> = {
  title: 'Inputs/FileUploader',
  component: FileUploader,
}
export default meta
type Story = StoryObj<typeof FileUploader>

export const Default: Story = {}
export const WithFiles: Story = {
  args: {
    files: [
      { id: '1', name: 'document.pdf', size: 102400, status: 'complete' },
      { id: '2', name: 'image.jpg', size: 204800, status: 'uploading' },
      { id: '3', name: 'archive.zip', size: 512, status: 'error', errorMessage: 'Upload failed' },
    ],
  },
}
export const Multiple: Story = { args: { multiple: true } }
export const WithHint: Story = { args: { hint: 'Accepted: PDF, JPEG. Max 10 MB.' } }
export const Disabled: Story = { args: { disabled: true } }
export const Accessibility: Story = { parameters: { a11y: { test: 'error' } } }
