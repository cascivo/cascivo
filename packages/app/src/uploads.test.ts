// @vitest-environment node
// Node's own File/Blob/Request: jsdom's Blob does not travel through Node's fetch types.
import { describe, expect, it, vi } from 'vitest'
import { checkFile, defineUploads, startUpload } from './uploads'
import type { Upload, UploadTransport } from './uploads'
import { handleUploads, listUploads } from './uploads-server'
import type { ImageResizer, UploadBucket } from './uploads-server'

const MiB = 1024 * 1024

async function bytes(stream: ReadableStream): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

/** R2, in memory: objects, metadata, and multipart uploads that reassemble by part number. */
function createBucket() {
  const objects = new Map<
    string,
    { data: Uint8Array<ArrayBuffer>; contentType: string; custom: Record<string, string> }
  >()
  const pending = new Map<
    string,
    {
      key: string
      parts: Map<number, Uint8Array<ArrayBuffer>>
      meta: { contentType: string; custom: Record<string, string> }
    }
  >()
  const describe = (key: string) => {
    const o = objects.get(key)!
    return {
      key,
      size: o.data.length,
      httpMetadata: { contentType: o.contentType },
      customMetadata: o.custom,
    }
  }
  const bucket: UploadBucket = {
    async put(key, value, options) {
      objects.set(key, {
        data: await bytes(value),
        contentType: options.httpMetadata.contentType,
        custom: options.customMetadata,
      })
      return describe(key)
    },
    async head(key) {
      return objects.has(key) ? describe(key) : null
    },
    async get(key) {
      const o = objects.get(key)
      return o ? { ...describe(key), body: new Response(o.data).body! } : null
    },
    async delete(key) {
      objects.delete(key)
    },
    async createMultipartUpload(key, options) {
      const uploadId = `up-${pending.size + 1}`
      pending.set(uploadId, {
        key,
        parts: new Map(),
        meta: { contentType: options.httpMetadata.contentType, custom: options.customMetadata },
      })
      return { key, uploadId }
    },
    resumeMultipartUpload(key, uploadId) {
      const upload = pending.get(uploadId)
      if (!upload || upload.key !== key) throw new Error('No such upload')
      return {
        async uploadPart(partNumber, value) {
          upload.parts.set(partNumber, await bytes(value))
          return { partNumber, etag: `etag-${partNumber}` }
        },
        async complete(parts) {
          const chunks = parts
            .sort((a, b) => a.partNumber - b.partNumber)
            .map((p) => upload.parts.get(p.partNumber)!)
          const data = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0))
          let offset = 0
          for (const chunk of chunks) {
            data.set(chunk, offset)
            offset += chunk.length
          }
          objects.set(key, {
            data,
            contentType: upload.meta.contentType,
            custom: upload.meta.custom,
          })
          pending.delete(uploadId)
          return describe(key)
        },
        async abort() {
          pending.delete(uploadId)
        },
      }
    },
    async list({ prefix, limit }) {
      return {
        objects: [...objects.keys()]
          .filter((k) => k.startsWith(prefix))
          .slice(0, limit)
          .map(describe),
      }
    },
  }
  return { bucket, objects }
}

const policy = defineUploads({
  path: '/api/uploads',
  maxBytes: 20 * MiB,
  types: ['image/png', 'application/pdf'],
  partBytes: 5 * MiB,
})

/** A transport that calls the Worker's handler directly, reporting progress when sent. */
function directTransport(handle: (request: Request) => Promise<Response | null>) {
  const calls: string[] = []
  const transport: UploadTransport = async ({ method, url, body, headers, onProgress, signal }) => {
    signal.throwIfAborted()
    calls.push(`${method} ${url}`)
    const size = body instanceof Blob ? body.size : typeof body === 'string' ? body.length : 0
    const request = new Request(`http://app.test${url}`, {
      method,
      headers: { ...headers, ...(body !== null ? { 'content-length': String(size) } : {}) },
      body,
    })
    const response = (await handle(request))!
    onProgress(size)
    return { status: response.status, body: await response.text() }
  }
  return { transport, calls }
}

function file(size: number, type = 'image/png', name = 'photo.png'): File {
  const data = new Uint8Array(size)
  for (let i = 0; i < size; i += 4096) data[i] = i % 251
  return new File([data], name, { type })
}

async function finished(upload: Upload): Promise<void> {
  for (let i = 0; i < 200 && upload.status.value === 'uploading'; i++) {
    await new Promise((r) => setTimeout(r, 0))
  }
}

describe('uploads', () => {
  it('stores a file in one request, under a key the Worker chose', async () => {
    const { bucket, objects } = createBucket()
    const { transport, calls } = directTransport(handleUploads(policy, bucket))
    const upload = startUpload(policy, file(1000, 'image/png', 'Holiday photo.png'), { transport })
    await finished(upload)
    expect(upload.status.value).toBe('done')
    expect(upload.progress.value).toBe(1)
    expect(calls).toEqual(['PUT /api/uploads'])
    const stored = upload.result.value!
    expect(stored).toMatchObject({ name: 'Holiday-photo.png', size: 1000, type: 'image/png' })
    expect(stored.key).toMatch(/^[0-9a-f-]{36}\/Holiday-photo\.png$/)
    expect(objects.get(`uploads/${stored.key}`)?.data.length).toBe(1000)
  })

  it('sends a large file in parts, with progress across all of them, and reassembles it', async () => {
    const { bucket, objects } = createBucket()
    const { transport, calls } = directTransport(handleUploads(policy, bucket))
    const big = file(11 * MiB)
    const seen: number[] = []
    const upload = startUpload(policy, big, { transport })
    const stop = upload.progress.subscribe((p) => seen.push(p))
    await finished(upload)
    stop()
    expect(upload.status.value).toBe('done')
    expect(calls.map((c) => c.split('?')[1]?.split('&')[0])).toEqual([
      'multipart=start',
      'multipart=part',
      'multipart=part',
      'multipart=part',
      'multipart=complete',
    ])
    expect(seen).toEqual([...seen].sort((a, b) => a - b))
    expect(seen.at(-1)).toBe(1)
    const stored = objects.get(`uploads/${upload.result.value!.key}`)!
    // Byte comparison, not toEqual: deep equality over 11M elements takes a minute.
    const original = new Uint8Array(await big.arrayBuffer())
    expect(stored.data.length).toBe(original.length)
    expect(Buffer.compare(Buffer.from(stored.data), Buffer.from(original))).toBe(0)
  })

  it('refuses a file the policy does not accept before sending anything', () => {
    const { transport, calls } = directTransport(async () => null)
    const wrongType = startUpload(policy, file(10, 'text/plain', 'a.txt'), { transport })
    const tooBig = startUpload(policy, file(21 * MiB), { transport })
    expect(wrongType.status.value).toBe('error')
    expect(wrongType.error.value).toMatch(/not accepted/)
    expect(tooBig.error.value).toMatch(/Larger than 20 MB/)
    expect(calls).toEqual([])
    expect(checkFile(policy, { size: 0, type: 'image/png' })).toMatch(/empty/)
  })

  it('reports a cancelled upload', async () => {
    const { bucket } = createBucket()
    const { transport } = directTransport(handleUploads(policy, bucket))
    const upload = startUpload(policy, file(11 * MiB), { transport })
    upload.abort()
    await finished(upload)
    expect(upload.status.value).toBe('error')
    expect(upload.error.value).toBe('Cancelled')
  })
})

describe('handleUploads enforces the policy on its own', () => {
  const { bucket, objects } = createBucket()
  const handle = handleUploads(policy, bucket)
  const put = (headers: Record<string, string>, body: BodyInit | null = 'x', query = '') =>
    handle(new Request(`http://app.test/api/uploads${query}`, { method: 'PUT', headers, body }))

  it.each([
    ['a type outside the policy', { 'content-type': 'image/svg+xml', 'content-length': '1' }, 415],
    ['no Content-Length', { 'content-type': 'image/png' }, 411],
    [
      'a size over the limit',
      { 'content-type': 'image/png', 'content-length': String(21 * MiB) },
      413,
    ],
  ])('refuses %s', async (_, headers, status) => {
    expect((await put(headers))!.status).toBe(status)
  })

  it('keeps a hostile file name out of the key', async () => {
    const response = await put({
      'content-type': 'image/png',
      'content-length': '1',
      'x-file-name': encodeURIComponent('../../etc/passwd'),
    })
    const stored = (await response!.json()) as { key: string; name: string }
    expect(stored.name).toBe('etc-passwd')
    expect([...objects.keys()].every((k) => /^uploads\/[0-9a-f-]{36}\/[\w.-]+$/.test(k))).toBe(true)
  })

  it('refuses parts that are out of range or for a key it did not issue', async () => {
    const part = (query: string) => put({ 'content-length': '1' }, 'x', `?multipart=part&${query}`)
    expect((await part('part=1&key=..%2Fx&uploadId=u'))!.status).toBe(400)
    expect(
      (await part('part=99&key=00000000-0000-0000-0000-000000000000%2Fa.png&uploadId=u'))!.status,
    ).toBe(400)
  })

  it('removes a multipart file whose parts add up to more than the limit', async () => {
    const small = defineUploads({ ...policy, maxBytes: 6 * MiB, partBytes: 5 * MiB })
    const { bucket: b, objects: o } = createBucket()
    const h = handleUploads(small, b)
    const start = await h(
      new Request('http://app.test/api/uploads?multipart=start', {
        method: 'POST',
        headers: { 'content-type': 'image/png', 'x-file-size': String(6 * MiB) },
      }),
    )
    const { key, uploadId } = (await start!.json()) as { key: string; uploadId: string }
    const q = `key=${encodeURIComponent(key)}&uploadId=${uploadId}`
    for (const n of [1, 2]) {
      await h(
        new Request(`http://app.test/api/uploads?multipart=part&part=${n}&${q}`, {
          method: 'PUT',
          headers: { 'content-length': String(5 * MiB) },
          body: new Uint8Array(5 * MiB),
        }),
      )
    }
    const done = await h(
      new Request(`http://app.test/api/uploads?multipart=complete&${q}`, {
        method: 'POST',
        body: JSON.stringify({
          parts: [
            { partNumber: 1, etag: 'a' },
            { partNumber: 2, etag: 'b' },
          ],
        }),
      }),
    )
    expect(done!.status).toBe(413)
    expect(o.size).toBe(0)
  })

  it('leaves requests outside its path to the next handler', async () => {
    expect(await handle(new Request('http://app.test/api/other'))).toBeNull()
  })
})

describe('serving stored files', () => {
  it('serves a file so it can never run script from the origin', async () => {
    const { bucket } = createBucket()
    const handle = handleUploads(policy, bucket)
    const { transport } = directTransport(handle)
    const upload = startUpload(policy, file(10), { transport })
    await finished(upload)
    const response = (await handle(
      new Request(`http://app.test/api/uploads/${upload.result.value!.key}`),
    ))!
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/png')
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('content-security-policy')).toContain('sandbox')
    expect((await response.arrayBuffer()).byteLength).toBe(10)
    expect(
      (await handle(new Request('http://app.test/api/uploads/..%2F..%2Fsecret')))!.status,
    ).toBe(404)
  })

  it('serves a type the policy no longer accepts as a download', async () => {
    const { bucket } = createBucket()
    await bucket.put(
      'uploads/00000000-0000-0000-0000-000000000000/page.html',
      new Response('<script>').body!,
      {
        httpMetadata: { contentType: 'text/html' },
        customMetadata: { name: 'page.html' },
      },
    )
    const response = (await handleUploads(
      policy,
      bucket,
    )(new Request('http://app.test/api/uploads/00000000-0000-0000-0000-000000000000/page.html')))!
    expect(response.headers.get('content-type')).toBe('application/octet-stream')
  })

  it('resizes images through the Images binding when ?w= is set', async () => {
    const { bucket } = createBucket()
    const widths: number[] = []
    const images: ImageResizer = {
      input: () => ({
        transform: ({ width }) => {
          widths.push(width)
          return {
            output: async () => ({
              response: () => new Response('webp', { headers: { 'content-type': 'image/webp' } }),
            }),
          }
        },
      }),
    }
    const handle = handleUploads(policy, bucket, { images })
    const { transport } = directTransport(handle)
    const upload = startUpload(policy, file(10), { transport })
    await finished(upload)
    const response = (await handle(
      new Request(`http://app.test/api/uploads/${upload.result.value!.key}?w=99999`),
    ))!
    expect(widths).toEqual([2048])
    expect(response.headers.get('content-type')).toBe('image/webp')
    expect(response.headers.get('content-security-policy')).toContain('sandbox')
    expect(await listUploads(bucket)).toHaveLength(1)
  })
})

describe('defineUploads', () => {
  it.each([
    ['SVG, which runs script', { types: ['image/svg+xml'] }],
    ['HTML', { types: ['text/html'] }],
    ['parts under the R2 minimum', { partBytes: MiB }],
    ['a path that is not one', { path: 'uploads' }],
  ])('refuses %s', (_, change) => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() =>
      defineUploads({ path: '/api/u', maxBytes: 1, types: ['image/png'], ...change }),
    ).toThrow()
  })
})
