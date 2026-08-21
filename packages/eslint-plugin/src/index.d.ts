/**
 * `@cascivo/eslint-plugin` — one rule, `cascivo/prop-vocabulary`.
 *
 * Typed loosely on purpose, like `@cascivo/eslint-config`: the plugin ships plain data and a
 * visitor, and deliberately does not depend on `eslint`, so it stays installable next to any
 * ESLint 9+ without a version handshake.
 */
export interface CascadeRule {
  meta: Record<string, unknown>
  create: (context: unknown) => Record<string, unknown>
}

declare const plugin: {
  meta: { name: string; version: string }
  rules: { 'prop-vocabulary': CascadeRule }
}
export default plugin
