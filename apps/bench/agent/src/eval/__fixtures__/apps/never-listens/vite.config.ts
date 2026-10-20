import { writeFileSync } from 'node:fs'

// `vite preview` awaits this hook before it listens, so the server never answers; the timer
// keeps the process alive the way a wedged server would. The pid lets the test check that the
// harness killed it.
export default {
  plugins: [
    {
      name: 'never-listen',
      configurePreviewServer() {
        writeFileSync('preview.pid', String(process.pid))
        setInterval(() => {}, 1000)
        return new Promise(() => {})
      },
    },
  ],
}
