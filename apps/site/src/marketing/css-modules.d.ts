// Cascade components import CSS Modules from source; declare them for tsc.
declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}

declare module '*?raw' {
  const content: string
  export default content
}

// Vite's import.meta.glob — not available via vite/client since vite is not a direct dep.
interface ImportMeta {
  glob<T = unknown>(pattern: string, options?: { eager?: boolean; as?: string }): Record<string, T>
}

// Build-time variables the site reads (Vite inlines `import.meta.env.VITE_*`).
interface ImportMeta {
  readonly env: {
    /** The live strip's room, e.g. `wss://cascivo-live.example.workers.dev/room`. */
    readonly VITE_CASCIVO_LIVE_URL?: string
  }
}
