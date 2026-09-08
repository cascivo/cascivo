import { defineConfig } from 'vite-plus'

export default defineConfig({
  test: {
    // No jsdom: an email is rendered to a string and asserted as a string. Introducing a
    // DOM here would let a test pass on behaviour no email client has.
    environment: 'node',
  },
})
