import { defineConfig } from 'vite-plus'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid({ ssr: false })],
  resolve: { conditions: ['browser'] },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    server: { deps: { inline: [/solid-js/] } },
  },
})
