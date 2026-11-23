// Static server for apps/site/dist that gzips text responses, for LCP measurements.
// `vp preview` sends everything uncompressed, so under throttling it measures raw bytes
// (~5x the wire size of Cloudflare's gzip/brotli). Use with measure-home.mjs:
//   node apps/site/scripts/serve-gz.mjs 4174 &   then   measure-home.mjs http://127.0.0.1:4174 <out>
import http from 'node:http'
import { readFileSync, statSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = resolve(fileURLToPath(new URL('.', import.meta.url)), '../dist')
const port = Number(process.argv[2] ?? 4174)
const types = {
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.html': 'text/html',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
}
http
  .createServer((req, res) => {
    let p = decodeURIComponent((req.url ?? '/').split('?')[0])
    if (p.endsWith('/')) p += 'index.html'
    const file = join(dist, p)
    if (!file.startsWith(dist)) return res.writeHead(403).end()
    try {
      statSync(file)
      let body = readFileSync(file)
      const type = types[extname(file)] ?? 'application/octet-stream'
      const headers = { 'content-type': type, 'cache-control': 'no-cache' }
      if (/^text\/|javascript|json|svg/.test(type)) {
        body = gzipSync(body)
        headers['content-encoding'] = 'gzip'
      }
      res.writeHead(200, headers).end(body)
    } catch {
      res.writeHead(404).end()
    }
  })
  .listen(port, '127.0.0.1')
