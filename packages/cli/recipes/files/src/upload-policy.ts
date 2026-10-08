import { defineUploads } from '@cascivo/app/uploads'

/**
 * What the app accepts, shared by the page (which checks first) and the Worker (which
 * enforces). SVG and HTML are not on the list, and cannot be: served from this origin they
 * would run script.
 */
export const uploads = defineUploads({
  path: '/api/uploads',
  maxBytes: 50 * 1024 * 1024,
  types: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'],
})
